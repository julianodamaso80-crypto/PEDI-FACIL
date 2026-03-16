"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Store, LogOut } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileSidebar } from "@/components/admin/admin-sidebar"

interface Restaurant {
  id: string
  name: string
  isOpen: boolean
  logo: string | null
}

interface SessionUser {
  name?: string | null
  email?: string | null
}

interface AdminHeaderProps {
  restaurant: Restaurant
  user: SessionUser
}

export function AdminHeader({ restaurant, user }: AdminHeaderProps) {
  const [isOpen, setIsOpen] = useState(restaurant.isOpen)
  const [isToggling, setIsToggling] = useState(false)

  async function handleToggleStatus(checked: boolean) {
    setIsToggling(true)
    setIsOpen(checked)
    try {
      const response = await fetch("/api/restaurant/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id, isOpen: checked }),
      })
      if (!response.ok) setIsOpen(!checked)
    } catch {
      setIsOpen(!checked)
    } finally {
      setIsToggling(false)
    }
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U"

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar restaurant={restaurant} />
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-gray-400" />
          <h1 className="text-sm font-semibold text-white lg:text-base">
            {restaurant.name}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${isOpen ? "text-emerald-400" : "text-red-400"}`}>
            {isOpen ? "Aberto" : "Fechado"}
          </span>
          <Switch
            checked={isOpen}
            onCheckedChange={handleToggleStatus}
            disabled={isToggling}
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500/40"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none ring-offset-gray-950 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">
              <Avatar className="h-8 w-8 border border-gray-700">
                <AvatarFallback className="bg-gray-800 text-xs text-gray-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 border-gray-800 bg-gray-950 text-gray-300">
            <DropdownMenuLabel className="text-gray-400">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem
              className="cursor-pointer text-red-400 focus:bg-gray-800 focus:text-red-400"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
