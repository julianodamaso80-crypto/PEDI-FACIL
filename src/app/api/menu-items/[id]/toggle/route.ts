import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST /api/menu-items/[id]/toggle
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const current = await prisma.menuItem.findUnique({
      where: { id },
      select: { isAvailable: true },
    })

    if (!current) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      )
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !current.isAvailable },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Erro ao alternar disponibilidade:", error)
    return NextResponse.json(
      { error: "Erro ao alternar disponibilidade" },
      { status: 500 }
    )
  }
}
