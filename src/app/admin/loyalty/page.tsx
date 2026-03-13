import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { LoyaltyPanel } from "@/components/admin/loyalty-panel"

export default async function LoyaltyPage() {
  const restaurant = await prisma.restaurant.findFirst({
    select: { id: true, name: true },
  })

  if (!restaurant) {
    redirect("/")
  }

  const config = await prisma.loyaltyConfig.findUnique({
    where: { restaurantId: restaurant.id },
  })

  const topCustomers = await prisma.customer.findMany({
    where: { restaurantId: restaurant.id },
    select: {
      id: true,
      name: true,
      phone: true,
      loyaltyPoints: true,
      totalOrders: true,
      totalSpent: true,
    },
    orderBy: { loyaltyPoints: "desc" },
    take: 10,
  })

  return (
    <LoyaltyPanel
      restaurantId={restaurant.id}
      initialConfig={config}
      initialTopCustomers={topCustomers}
    />
  )
}
