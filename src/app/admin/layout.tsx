import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // For now, fetch the first restaurant (auth will be added later)
  const restaurant = await prisma.restaurant.findFirst({
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      isOpen: true,
    },
  })

  if (!restaurant) {
    redirect("/")
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <AdminSidebar restaurant={restaurant} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader restaurant={restaurant} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
