import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.message !== undefined && { message: body.message }),
        ...(body.channel !== undefined && { channel: body.channel }),
        ...(body.targetDaysInactive !== undefined && {
          targetDaysInactive: body.targetDaysInactive ? Number(body.targetDaysInactive) : null,
        }),
        ...(body.targetMinOrders !== undefined && {
          targetMinOrders: body.targetMinOrders ? Number(body.targetMinOrders) : null,
        }),
        ...(body.targetBirthday !== undefined && { targetBirthday: body.targetBirthday }),
        ...(body.couponCode !== undefined && { couponCode: body.couponCode || null }),
        ...(body.discountPercent !== undefined && {
          discountPercent: body.discountPercent ? Number(body.discountPercent) : null,
        }),
        ...(body.discountFixed !== undefined && {
          discountFixed: body.discountFixed ? Number(body.discountFixed) : null,
        }),
        ...(body.isAutomated !== undefined && { isAutomated: body.isAutomated }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.scheduledAt !== undefined && {
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        }),
      },
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar campanha" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.campaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return NextResponse.json(
      { error: "Erro ao excluir campanha" },
      { status: 500 }
    )
  }
}
