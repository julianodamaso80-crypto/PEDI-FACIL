import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { processWebhook } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Mercado Pago sends notifications with action and data.id
    const { action, data } = body as {
      action: string
      data: { id: string }
    }

    // Only process payment events
    if (action !== "payment.created" && action !== "payment.updated") {
      return NextResponse.json({ received: true })
    }

    const paymentId = String(data.id)

    // Find order by mpPaymentId
    const order = await prisma.order.findFirst({
      where: { mpPaymentId: paymentId },
      include: {
        restaurant: {
          include: {
            loyaltyConfig: true,
          },
        },
        customer: true,
        items: true,
      },
    })

    if (!order) {
      // Order not found, but return 200 to prevent MP from retrying
      console.warn(
        `[MP Webhook] Order not found for payment ID: ${paymentId}`
      )
      return NextResponse.json({ received: true })
    }

    // Skip if restaurant has no access token (mock payments)
    if (!order.restaurant.mpAccessToken) {
      console.log(
        `[MP Webhook] Skipping mock payment for order #${order.orderNumber}`
      )
      return NextResponse.json({ received: true })
    }

    // Check payment status with Mercado Pago
    const webhookResult = await processWebhook(
      paymentId,
      order.restaurant.mpAccessToken
    )

    console.log(
      `[MP Webhook] Payment ${paymentId} status: ${webhookResult.status} (${webhookResult.statusDetail})`
    )

    if (webhookResult.isApproved && order.paymentStatus !== "PAID") {
      // Update order payment status to PAID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
        },
      })

      // Add loyalty points to customer
      const loyaltyConfig = order.restaurant.loyaltyConfig
      if (loyaltyConfig && loyaltyConfig.isActive) {
        const pointsToAdd = Math.floor(
          order.total * loyaltyConfig.pointsPerReal
        )

        if (pointsToAdd > 0) {
          await prisma.customer.update({
            where: { id: order.customerId },
            data: {
              loyaltyPoints: { increment: pointsToAdd },
            },
          })

          console.log(
            `[MP Webhook] Added ${pointsToAdd} loyalty points to customer ${order.customer.name}`
          )
        }
      }

      console.log(
        `[MP Webhook] Order #${order.orderNumber} marked as PAID`
      )
    } else if (webhookResult.status === "rejected") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
        },
      })

      console.log(
        `[MP Webhook] Order #${order.orderNumber} payment FAILED`
      )
    }

    // Always return 200 to prevent MP from retrying
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[MP Webhook] Error processing webhook:", error)
    // Return 200 even on error to prevent MP from retrying indefinitely
    return NextResponse.json({ received: true })
  }
}
