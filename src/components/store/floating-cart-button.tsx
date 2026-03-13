"use client"

import { ShoppingCart } from "lucide-react"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { useCart } from "@/contexts/cart-context"
import { CartSheet } from "./cart-sheet"

export function FloatingCartButton() {
  const { cart, itemCount } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  if (itemCount === 0) return null

  return (
    <>
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full px-5 py-3.5 text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: "var(--restaurant-primary)" }}
      >
        <div className="relative">
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold"
            style={{ color: "var(--restaurant-primary)" }}
          >
            {itemCount}
          </span>
        </div>
        <span className="font-semibold text-sm">
          {formatCurrency(cart.total)}
        </span>
      </button>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </>
  )
}
