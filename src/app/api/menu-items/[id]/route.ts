import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// PATCH /api/menu-items/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      description,
      price,
      categoryId,
      image,
      isAvailable,
      isPopular,
      extras,
      sizes,
      sortOrder,
    } = body

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(image !== undefined && { image }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(isPopular !== undefined && { isPopular }),
        ...(extras !== undefined && { extras }),
        ...(sizes !== undefined && { sizes }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Erro ao atualizar item:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar item" },
      { status: 500 }
    )
  }
}

// DELETE /api/menu-items/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.menuItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar item:", error)
    return NextResponse.json(
      { error: "Erro ao deletar item" },
      { status: 500 }
    )
  }
}
