import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendBirthdayMessage } from "@/lib/whatsapp"

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
    // Find all restaurants with active, automated birthday campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        isAutomated: true,
        type: "BIRTHDAY",
      },
      include: {
        restaurant: true,
      },
    })

    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()

    const summary: {
      campaignId: string
      restaurantName: string
      customersSent: number
      birthdayCustomers: number
    }[] = []

    for (const campaign of campaigns) {
      // Fetch all customers with birthdays for this restaurant
      const customers = await prisma.customer.findMany({
        where: {
          restaurantId: campaign.restaurantId,
          birthday: { not: null },
        },
      })

      // Filter customers whose birthday matches today (month + day)
      const birthdayCustomers = customers.filter((customer: any) => {
        if (!customer.birthday) return false
        const bday = new Date(customer.birthday)
        return bday.getMonth() + 1 === month && bday.getDate() === day
      })

      let sentCount = 0

      // Build the offer text from campaign config
      const offer = campaign.discountPercent
        ? `${campaign.discountPercent}% de desconto no seu pedido!`
        : campaign.discountFixed
          ? `R$ ${campaign.discountFixed.toFixed(2)} de desconto no seu pedido!`
          : campaign.couponCode
            ? `Use o cupom ${campaign.couponCode} no seu pedido!`
            : campaign.message

      for (const customer of birthdayCustomers) {
        try {
          await sendBirthdayMessage(
            customer.phone,
            customer.name,
            offer,
            campaign.restaurant.name
          )
          sentCount++
        } catch (error) {
          console.error(
            `[Cron/Birthday] Failed to send to ${customer.phone}:`,
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
        birthdayCustomers: birthdayCustomers.length,
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
    console.error("[Cron/Birthday] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
