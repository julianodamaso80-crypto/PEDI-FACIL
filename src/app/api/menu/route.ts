import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  })

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
  }

  return NextResponse.json(restaurant)
}
