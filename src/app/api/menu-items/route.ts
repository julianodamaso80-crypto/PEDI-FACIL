import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/menu-items?restaurantId=xxx
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

    const items = await prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Erro ao buscar itens:", error)
    return NextResponse.json(
      { error: "Erro ao buscar itens" },
      { status: 500 }
    )
  }
}

// POST /api/menu-items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      categoryId,
      restaurantId,
      image,
      isAvailable,
      isPopular,
      extras,
      sizes,
    } = body

    if (!name || !price || !categoryId || !restaurantId) {
      return NextResponse.json(
        { error: "name, price, categoryId e restaurantId são obrigatórios" },
        { status: 400 }
      )
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        categoryId,
        restaurantId,
        image: image || null,
        isAvailable: isAvailable ?? true,
        isPopular: isPopular ?? false,
        extras: extras || null,
        sizes: sizes || null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar item:", error)
    return NextResponse.json(
      { error: "Erro ao criar item" },
      { status: 500 }
    )
  }
}
