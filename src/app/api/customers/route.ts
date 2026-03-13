import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")
    const search = searchParams.get("search")

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId e obrigatorio" },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { restaurantId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search.replace(/\D/g, "") } },
      ]
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        birthday: true,
        totalOrders: true,
        totalSpent: true,
        loyaltyPoints: true,
        lastOrderAt: true,
        createdAt: true,
      },
      orderBy: { totalSpent: "desc" },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error listing customers:", error)
    return NextResponse.json(
      { error: "Erro ao listar clientes" },
      { status: 500 }
    )
  }
}
