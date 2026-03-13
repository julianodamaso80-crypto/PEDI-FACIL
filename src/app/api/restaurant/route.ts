import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório" },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Error getting restaurant:", error)
    return NextResponse.json(
      { error: "Erro ao buscar restaurante" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório" },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data,
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Error updating restaurant:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar restaurante" },
      { status: 500 }
    )
  }
}
