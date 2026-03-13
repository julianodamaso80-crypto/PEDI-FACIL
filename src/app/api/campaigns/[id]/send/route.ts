import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        restaurant: {
          include: {
            customers: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      )
    }

    const customerCount = campaign.restaurant.customers.length

    console.log(`[Campaign Send] Campanha "${campaign.name}" enviada para ${customerCount} clientes`)
    console.log(`[Campaign Send] Canal: ${campaign.channel}`)
    console.log(`[Campaign Send] Mensagem: ${campaign.message}`)

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        totalSent: { increment: customerCount },
        lastRunAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      totalSent: updated.totalSent,
      lastRunAt: updated.lastRunAt,
    })
  } catch (error) {
    console.error("Error sending campaign:", error)
    return NextResponse.json(
      { error: "Erro ao enviar campanha" },
      { status: 500 }
    )
  }
}
