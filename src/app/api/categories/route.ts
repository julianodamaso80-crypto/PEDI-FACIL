import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/categories?restaurantId=xxx
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

    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { items: true } },
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    )
  }
}

// POST /api/categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, restaurantId, sortOrder } = body

    if (!name || !restaurantId) {
      return NextResponse.json(
        { error: "name e restaurantId são obrigatórios" },
        { status: 400 }
      )
    }

    const category = await prisma.menuCategory.create({
      data: {
        name,
        description: description || null,
        restaurantId,
        sortOrder: sortOrder ?? 0,
      },
      include: {
        _count: { select: { items: true } },
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    )
  }
}
