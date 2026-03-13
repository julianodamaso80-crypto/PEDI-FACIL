import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { CustomersPanel } from "@/components/admin/customers-panel"

export const dynamic = "force-dynamic"

export default async function CustomersPage() {
  const restaurant = await prisma.restaurant.findFirst({
    select: { id: true, name: true },
  })

  if (!restaurant) {
    redirect("/")
  }

  const customers = await prisma.customer.findMany({
    where: { restaurantId: restaurant.id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      birthday: true,
      totalOrders: true,
      totalSpent: true,
      loyaltyPoints: true,
      lastOrderAt: true,
      createdAt: true,
    },
    orderBy: { totalSpent: "desc" },
  })

  // Serialize dates to strings for the client component
  const serializedCustomers = JSON.parse(JSON.stringify(customers))

  return (
    <CustomersPanel
      restaurantId={restaurant.id}
      initialCustomers={serializedCustomers}
    />
  )
}
