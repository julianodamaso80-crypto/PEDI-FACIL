"use client"

import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRestaurant } from "@/contexts/restaurant-context"
import { useCart } from "@/contexts/cart-context"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { CartSheet } from "./cart-sheet"

function isRestaurantOpen(
  openingHours: Record<string, { open: string; close: string }>,
  isOpen: boolean
): boolean {
  if (!isOpen) return false

  const now = new Date()
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]
  const today = days[now.getDay()]
  const hours = openingHours[today]

  if (!hours) return false

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  return currentTime >= hours.open && currentTime <= hours.close
}

export function StoreHeader() {
  const restaurant = useRestaurant()
  const { itemCount, cart } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const open = isRestaurantOpen(restaurant.openingHours, restaurant.isOpen)

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {restaurant.logo ? (
              <Image
                src={restaurant.logo}
                alt={restaurant.name}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: "var(--restaurant-primary)" }}
              >
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {restaurant.name}
              </h1>
              <Badge
                className={cn(
                  "mt-0.5 text-[10px]",
                  open
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-500 text-white hover:bg-red-600"
                )}
              >
                {open ? "Aberto" : "Fechado"}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="relative gap-2"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <>
                <span className="text-sm font-medium">
                  {formatCurrency(cart.total)}
                </span>
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: "var(--restaurant-primary)" }}
                >
                  {itemCount}
                </span>
              </>
            )}
          </Button>
        </div>
      </header>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </>
  )
}

export { isRestaurantOpen }
