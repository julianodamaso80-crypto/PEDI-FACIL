import { prisma } from "@/lib/db"
import { OrdersPanel } from "@/components/admin/orders-panel"

export default async function AdminOrdersPage() {
  // Temporary: fetch the first restaurant until auth is implemented
  const restaurant = await prisma.restaurant.findFirst()

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-400">
        <p>Nenhum restaurante encontrado. Configure um restaurante primeiro.</p>
      </div>
    )
  }

  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant.id },
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

  // Serialize dates for client component
  const serializedOrders = JSON.parse(JSON.stringify(orders))

  return (
    <OrdersPanel
      restaurantId={restaurant.id}
      initialOrders={serializedOrders}
    />
  )
}
