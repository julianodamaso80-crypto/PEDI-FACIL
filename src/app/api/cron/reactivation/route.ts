import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendReactivationMessage } from "@/lib/whatsapp"

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  // Check Authorization header
  const authHeader = request.headers.get("authorization")
  if (authHeader === `Bearer ${secret}`) return true

  // Check query param as fallback
  const url = new URL(request.url)
  const querySecret = url.searchParams.get("secret")
  if (querySecret === secret) return true

  return false
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find all restaurants with active, automated reactivation campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        isAutomated: true,
        type: "REACTIVATION",
      },
      include: {
        restaurant: true,
      },
    })

    const summary: {
      campaignId: string
      restaurantName: string
      customersSent: number
      customersFound: number
    }[] = []

    for (const campaign of campaigns) {
      const daysInactive = campaign.targetDaysInactive || 30
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

      // Find customers who haven't ordered since the cutoff date
      const inactiveCustomers = await prisma.customer.findMany({
        where: {
          restaurantId: campaign.restaurantId,
          lastOrderAt: {
            lt: cutoffDate,
          },
          // Only customers who have ordered at least once
          totalOrders: { gte: 1 },
        },
      })

      let sentCount = 0

      for (const customer of inactiveCustomers) {
        try {
          await sendReactivationMessage(
            customer.phone,
            customer.name,
            campaign.couponCode || "VOLTAPRACASA",
            campaign.restaurant.name
          )
          sentCount++
        } catch (error) {
          console.error(
            `[Cron/Reactivation] Failed to send to ${customer.phone}:`,
            error
          )
        }
      }

      // Update campaign stats
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          totalSent: { increment: sentCount },
          lastRunAt: new Date(),
        },
      })

      summary.push({
        campaignId: campaign.id,
        restaurantName: campaign.restaurant.name,
        customersFound: inactiveCustomers.length,
        customersSent: sentCount,
      })
    }

    return NextResponse.json({
      success: true,
      campaignsProcessed: campaigns.length,
      summary,
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron/Reactivation] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
