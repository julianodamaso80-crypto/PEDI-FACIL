import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { owner: { id: session.user.id } },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      isOpen: true,
    },
  })

  if (!restaurant) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <AdminSidebar restaurant={restaurant} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader restaurant={restaurant} user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
