"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  Megaphone,
  Award,
  Settings,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface Restaurant {
  id: string
  name: string
  logo: string | null
}

interface AdminSidebarProps {
  restaurant: Restaurant
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Pedidos", href: "/admin/orders", icon: ShoppingBag },
  { label: "Cardápio", href: "/admin/menu", icon: UtensilsCrossed },
  { label: "Clientes", href: "/admin/customers", icon: Users },
  { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
  { label: "Fidelidade", href: "/admin/loyalty", icon: Award },
  { label: "Configurações", href: "/admin/settings", icon: Settings },
]

function SidebarContent({ restaurant }: { restaurant: Restaurant }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-gray-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 font-bold text-white text-lg">
          P
        </div>
        <span className="text-xl font-bold tracking-tight">
          Pede<span className="text-orange-500">Fácil</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-500/10 text-orange-500"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 px-6 py-4">
        <p className="text-xs text-gray-600">PedeFácil v1.0</p>
      </div>
    </div>
  )
}

export function AdminSidebar({ restaurant }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-800 lg:block">
        <SidebarContent restaurant={restaurant} />
      </aside>
    </>
  )
}

export function MobileSidebar({ restaurant }: AdminSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 border-gray-800 bg-gray-950 p-0"
      >
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <SidebarContent restaurant={restaurant} />
      </SheetContent>
    </Sheet>
  )
}
