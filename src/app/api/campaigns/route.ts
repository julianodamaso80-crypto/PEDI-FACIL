import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId é obrigatório" },
        { status: 400 }
      )
    }

    const campaigns = await prisma.campaign.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error listing campaigns:", error)
    return NextResponse.json(
      { error: "Erro ao listar campanhas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name,
      type,
      message,
      channel,
      restaurantId,
      targetDaysInactive,
      targetMinOrders,
      targetBirthday,
      couponCode,
      discountPercent,
      discountFixed,
      isAutomated,
      scheduledAt,
    } = body

    if (!name || !type || !message || !restaurantId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, type, message, restaurantId" },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        type,
        message,
        channel: channel || "WHATSAPP",
        restaurantId,
        targetDaysInactive: targetDaysInactive ? Number(targetDaysInactive) : null,
        targetMinOrders: targetMinOrders ? Number(targetMinOrders) : null,
        targetBirthday: targetBirthday || false,
        couponCode: couponCode || null,
        discountPercent: discountPercent ? Number(discountPercent) : null,
        discountFixed: discountFixed ? Number(discountFixed) : null,
        isAutomated: isAutomated || false,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json(
      { error: "Erro ao criar campanha" },
      { status: 500 }
    )
  }
}
