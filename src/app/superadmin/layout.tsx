import Link from "next/link"
import { LayoutDashboard, Store, Receipt } from "lucide-react"

const sidebarLinks = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/restaurants", label: "Restaurantes", icon: Store },
  { href: "/superadmin/commissions", label: "Comissões", icon: Receipt },
]

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-lg font-bold text-orange-500">PedeFácil</h1>
          <p className="text-xs text-gray-400 mt-1">Super Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-800 bg-gray-950 flex items-center px-6">
          <h2 className="text-sm font-medium text-gray-300">
            PedeFácil - Super Admin
          </h2>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
