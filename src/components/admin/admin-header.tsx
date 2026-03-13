"use client"

import { useState } from "react"
import { Store, User } from "lucide-react"
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

interface AdminHeaderProps {
  restaurant: Restaurant
}

export function AdminHeader({ restaurant }: AdminHeaderProps) {
  const [isOpen, setIsOpen] = useState(restaurant.isOpen)
  const [isToggling, setIsToggling] = useState(false)

  async function handleToggleStatus(checked: boolean) {
    setIsToggling(true)
    setIsOpen(checked)

    try {
      const response = await fetch("/api/restaurant/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          isOpen: checked,
        }),
      })

      if (!response.ok) {
        // Revert on error
        setIsOpen(!checked)
      }
    } catch {
      // Revert on error
      setIsOpen(!checked)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <MobileSidebar restaurant={restaurant} />

        {/* Restaurant name */}
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-gray-400" />
          <h1 className="text-sm font-semibold text-white lg:text-base">
            {restaurant.name}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Open/Closed toggle */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              isOpen ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isOpen ? "Aberto" : "Fechado"}
          </span>
          <Switch
            checked={isOpen}
            onCheckedChange={handleToggleStatus}
            disabled={isToggling}
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500/40"
          />
        </div>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none ring-offset-gray-950 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">
              <Avatar className="h-8 w-8 border border-gray-700">
                <AvatarFallback className="bg-gray-800 text-sm text-gray-300">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 border-gray-800 bg-gray-950 text-gray-300"
          >
            <DropdownMenuLabel className="text-gray-400">
              Minha Conta
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem className="cursor-pointer focus:bg-gray-800 focus:text-white">
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-gray-800 focus:text-white">
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem className="cursor-pointer text-red-400 focus:bg-gray-800 focus:text-red-400">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
