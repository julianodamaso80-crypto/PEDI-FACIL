import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      slug,
      customer,
      orderType,
      deliveryAddress,
      deliveryNotes,
      paymentMethod,
      changeFor,
      couponCode,
      items,
    } = body as {
      slug: string
      customer: { name: string; phone: string; email?: string }
      orderType: "DELIVERY" | "PICKUP"
      deliveryAddress?: string
      deliveryNotes?: string
      paymentMethod: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH"
      changeFor?: number
      couponCode?: string
      items: {
        menuItemId: string
        quantity: number
        unitPrice: number
        totalPrice: number
        notes?: string
        extras?: { name: string; price: number }[]
        size?: string
      }[]
    }

    // Find restaurant by slug
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante não encontrado" },
        { status: 404 }
      )
    }

    // Find or create customer by phone + restaurantId
    const customerRecord = await prisma.customer.upsert({
      where: {
        phone_restaurantId: {
          phone: customer.phone.replace(/\D/g, ""),
          restaurantId: restaurant.id,
        },
      },
      update: {
        name: customer.name,
        ...(customer.email ? { email: customer.email } : {}),
      },
      create: {
        name: customer.name,
        phone: customer.phone.replace(/\D/g, ""),
        email: customer.email || null,
        restaurantId: restaurant.id,
      },
    })

    // Get next order number
    const lastOrder = await prisma.order.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    })
    const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1

    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)

    // Apply delivery fee if DELIVERY
    const deliveryFee = orderType === "DELIVERY" ? restaurant.deliveryFee : 0

    // Calculate total
    const total = subtotal + deliveryFee

    // Calculate commission
    const commissionAmount = total * restaurant.commissionRate

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        type: orderType,
        subtotal,
        deliveryFee,
        discount: 0,
        total,
        commissionAmount,
        paymentMethod,
        paymentStatus: "PENDING",
        deliveryAddress: deliveryAddress || null,
        deliveryNotes: deliveryNotes || null,
        estimatedTime: restaurant.estimatedTime,
        couponCode: couponCode || null,
        customerId: customerRecord.id,
        restaurantId: restaurant.id,
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes || null,
            extras: item.extras ? item.extras : undefined,
            size: item.size || null,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Update customer stats
    await prisma.customer.update({
      where: { id: customerRecord.id },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: total },
        lastOrderAt: new Date(),
      },
    })

    return NextResponse.json(
      { id: order.id, orderNumber: order.orderNumber },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")
    const status = searchParams.get("status")
    const customerId = searchParams.get("customerId")

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId é obrigatório" },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { restaurantId }
    if (status) {
      where.status = status
    }
    if (customerId) {
      where.customerId = customerId
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            menuItem: {
              select: { name: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error listing orders:", error)
    return NextResponse.json(
      { error: "Erro ao listar pedidos" },
      { status: 500 }
    )
  }
}
