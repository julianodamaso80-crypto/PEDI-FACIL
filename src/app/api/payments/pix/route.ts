import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createPixPayment } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
  try {
    const { orderId } = (await request.json()) as { orderId: string }

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId é obrigatório" },
        { status: 400 }
      )
    }

    // Fetch order with restaurant data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        customer: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    if (order.paymentMethod !== "PIX") {
      return NextResponse.json(
        { error: "Este pedido não utiliza PIX como forma de pagamento" },
        { status: 400 }
      )
    }

    // If QR code already exists, return it
    if (order.pixQrCode && order.pixCopyPaste) {
      return NextResponse.json({
        paymentId: order.mpPaymentId,
        qrCode: order.pixQrCode,
        qrCodeText: order.pixCopyPaste,
        status: order.paymentStatus,
      })
    }

    // Check if restaurant has Mercado Pago configured
    if (!order.restaurant.mpAccessToken) {
      // Mock mode for development
      console.log(
        `[PIX Mock] Generating mock QR code for order #${order.orderNumber}`
      )

      const mockPaymentId = `mock_${order.id}`
      const mockQrCodeText = `00020126580014br.gov.bcb.pix0136mock-pix-key-${order.id}5204000053039865404${order.total.toFixed(2)}5802BR6009SAO_PAULO62070503***6304MOCK`

      // Update order with mock data
      await prisma.order.update({
        where: { id: orderId },
        data: {
          mpPaymentId: mockPaymentId,
          pixQrCode: "", // no base64 image in mock mode
          pixCopyPaste: mockQrCodeText,
        },
      })

      return NextResponse.json({
        paymentId: mockPaymentId,
        qrCode: "",
        qrCodeText: mockQrCodeText,
        status: "pending",
        mock: true,
      })
    }

    // Create real PIX payment via Mercado Pago
    const customerEmail =
      order.customer.email || `customer_${order.customer.phone}@pedido.local`

    const pixResult = await createPixPayment({
      amount: order.total,
      description: `Pedido #${order.orderNumber} - ${order.restaurant.name}`,
      orderId: order.id,
      customerEmail,
      accessToken: order.restaurant.mpAccessToken,
    })

    // Update order with payment data
    await prisma.order.update({
      where: { id: orderId },
      data: {
        mpPaymentId: pixResult.paymentId,
        pixQrCode: pixResult.qrCode,
        pixCopyPaste: pixResult.qrCodeText,
      },
    })

    return NextResponse.json({
      paymentId: pixResult.paymentId,
      qrCode: pixResult.qrCode,
      qrCodeText: pixResult.qrCodeText,
      status: pixResult.status,
    })
  } catch (error) {
    console.error("Error creating PIX payment:", error)
    return NextResponse.json(
      { error: "Erro ao gerar pagamento PIX" },
      { status: 500 }
    )
  }
}
