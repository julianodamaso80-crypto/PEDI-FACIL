import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar status do pedido" },
      { status: 500 }
    )
  }
}
