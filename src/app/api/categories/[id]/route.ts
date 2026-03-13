import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// PATCH /api/categories/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, isActive, sortOrder } = body

    const category = await prisma.menuCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: {
        _count: { select: { items: true } },
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.menuCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar categoria:", error)
    return NextResponse.json(
      { error: "Erro ao deletar categoria" },
      { status: 500 }
    )
  }
}
