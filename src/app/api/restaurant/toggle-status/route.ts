import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, isOpen } = await request.json()

    if (!restaurantId || typeof isOpen !== "boolean") {
      return NextResponse.json(
        { error: "restaurantId and isOpen are required" },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen },
      select: {
        id: true,
        name: true,
        isOpen: true,
      },
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Error toggling restaurant status:", error)
    return NextResponse.json(
      { error: "Failed to update restaurant status" },
      { status: 500 }
    )
  }
}
