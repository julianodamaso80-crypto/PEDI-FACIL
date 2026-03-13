import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { orders: true, customers: true } },
        orders: {
          select: { total: true, commissionAmount: true },
        },
      },
    })

    const result = restaurants.map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      ownerName: r.owner.name,
      ownerEmail: r.owner.email,
      isOpen: r.isOpen,
      ordersCount: r._count.orders,
      customersCount: r._count.customers,
      totalRevenue: r.orders.reduce((sum: number, o: any) => sum + o.total, 0),
      totalCommission: r.orders.reduce((sum: number, o: any) => sum + o.commissionAmount, 0),
      createdAt: r.createdAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching restaurants:", error)
    return NextResponse.json(
      { error: "Erro ao buscar restaurantes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner, restaurant } = body

    // Validate required fields
    if (!owner?.name || !owner?.email || !owner?.password) {
      return NextResponse.json(
        { error: "Dados do proprietário são obrigatórios" },
        { status: 400 }
      )
    }

    if (!restaurant?.name || !restaurant?.slug || !restaurant?.phone || !restaurant?.whatsapp || !restaurant?.email || !restaurant?.address || !restaurant?.city || !restaurant?.state || !restaurant?.zipCode) {
      return NextResponse.json(
        { error: "Todos os campos do restaurante são obrigatórios" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: owner.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingSlug = await prisma.restaurant.findUnique({
      where: { slug: restaurant.slug },
    })

    if (existingSlug) {
      return NextResponse.json(
        { error: "Este slug já está em uso" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(owner.password, 10)

    // Create user and restaurant in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name: owner.name,
          email: owner.email,
          password: hashedPassword,
          role: "RESTAURANT_OWNER",
        },
      })

      const newRestaurant = await tx.restaurant.create({
        data: {
          name: restaurant.name,
          slug: restaurant.slug,
          phone: restaurant.phone,
          whatsapp: restaurant.whatsapp,
          email: restaurant.email,
          address: restaurant.address,
          city: restaurant.city,
          state: restaurant.state,
          zipCode: restaurant.zipCode,
          openingHours: {},
          ownerId: user.id,
        },
      })

      return { user, restaurant: newRestaurant }
    })

    return NextResponse.json(
      {
        id: result.restaurant.id,
        name: result.restaurant.name,
        slug: result.restaurant.slug,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating restaurant:", error)
    return NextResponse.json(
      { error: "Erro ao criar restaurante" },
      { status: 500 }
    )
  }
}
