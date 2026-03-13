import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { MenuPanel } from "@/components/admin/menu-panel"

export const dynamic = "force-dynamic"

export default async function AdminMenuPage() {
  const restaurant = await prisma.restaurant.findFirst({
    select: { id: true, name: true },
  })

  if (!restaurant) {
    redirect("/")
  }

  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { items: true } },
    },
  })

  const items = await prisma.menuItem.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })

  return (
    <MenuPanel
      restaurantId={restaurant.id}
      initialCategories={JSON.parse(JSON.stringify(categories))}
      initialItems={JSON.parse(JSON.stringify(items))}
    />
  )
}
