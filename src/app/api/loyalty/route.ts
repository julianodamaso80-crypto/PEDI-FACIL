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

    const config = await prisma.loyaltyConfig.findUnique({
      where: { restaurantId },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error getting loyalty config:", error)
    return NextResponse.json(
      { error: "Erro ao buscar configuração de fidelidade" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      restaurantId,
      isActive,
      pointsPerReal,
      rewardThreshold,
      rewardType,
      rewardValue,
    } = body

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId é obrigatório" },
        { status: 400 }
      )
    }

    const config = await prisma.loyaltyConfig.upsert({
      where: { restaurantId },
      update: {
        isActive: isActive ?? true,
        pointsPerReal: pointsPerReal ? Number(pointsPerReal) : 1,
        rewardThreshold: rewardThreshold ? Number(rewardThreshold) : 100,
        rewardType: rewardType || "DISCOUNT_PERCENT",
        rewardValue: rewardValue ? Number(rewardValue) : 10,
      },
      create: {
        restaurantId,
        isActive: isActive ?? true,
        pointsPerReal: pointsPerReal ? Number(pointsPerReal) : 1,
        rewardThreshold: rewardThreshold ? Number(rewardThreshold) : 100,
        rewardType: rewardType || "DISCOUNT_PERCENT",
        rewardValue: rewardValue ? Number(rewardValue) : 10,
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error saving loyalty config:", error)
    return NextResponse.json(
      { error: "Erro ao salvar configuração de fidelidade" },
      { status: 500 }
    )
  }
}
