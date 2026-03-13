"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/utils"
import { useCart } from "@/contexts/cart-context"
import { useRestaurant } from "@/contexts/restaurant-context"
import Link from "next/link"

export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const restaurant = useRestaurant()
  const {
    cart,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    itemCount,
  } = useCart()
  const [couponInput, setCouponInput] = useState("")
  const [couponError, setCouponError] = useState("")

  function handleApplyCoupon() {
    if (!couponInput.trim()) return
    // In a real app, this would validate via an API call
    // For now, just set the coupon as applied with 0 discount
    // The checkout page should handle real coupon validation
    setCouponError("")
    applyCoupon(couponInput.trim().toUpperCase(), 0)
  }

  function handleRemoveCoupon() {
    removeCoupon()
    setCouponInput("")
    setCouponError("")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Seu Pedido
          </SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? "Seu carrinho está vazio"
              : `${itemCount} ${itemCount === 1 ? "item" : "itens"} no carrinho`}
          </SheetDescription>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Carrinho vazio</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Adicione itens do cardápio para fazer seu pedido
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Ver cardápio
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="space-y-1 px-5 py-3">
                {cart.items.map((cartItem) => (
                  <div
                    key={cartItem.id}
                    className="flex gap-3 rounded-lg p-3 hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">
                        {cartItem.menuItem.name}
                      </p>
                      {cartItem.selectedSize && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {cartItem.selectedSize.name}
                        </p>
                      )}
                      {cartItem.selectedExtras.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          + {cartItem.selectedExtras.map((e) => e.name).join(", ")}
                        </p>
                      )}
                      {cartItem.notes && (
                        <p className="mt-0.5 text-xs italic text-muted-foreground">
                          {cartItem.notes}
                        </p>
                      )}
                      <p
                        className="mt-1 text-sm font-bold"
                        style={{ color: "var(--restaurant-primary)" }}
                      >
                        {formatCurrency(cartItem.totalPrice)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(cartItem.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>

                      <div className="flex items-center rounded-md border">
                        <button
                          className="flex h-7 w-7 items-center justify-center text-sm hover:bg-muted"
                          onClick={() =>
                            updateQuantity(cartItem.id, cartItem.quantity - 1)
                          }
                          disabled={cartItem.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex h-7 w-7 items-center justify-center text-xs font-semibold">
                          {cartItem.quantity}
                        </span>
                        <button
                          className="flex h-7 w-7 items-center justify-center text-sm hover:bg-muted"
                          onClick={() =>
                            updateQuantity(cartItem.id, cartItem.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t px-5 py-4 space-y-3">
              {/* Coupon */}
              <div>
                {cart.couponCode ? (
                  <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                    <span className="text-sm font-medium text-green-700">
                      Cupom: {cart.couponCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-700"
                      onClick={handleRemoveCoupon}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cupom de desconto"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="h-9 text-sm uppercase"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={handleApplyCoupon}
                    >
                      Aplicar
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-1 text-xs text-destructive">{couponError}</p>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>
                    {cart.deliveryFee > 0
                      ? formatCurrency(cart.deliveryFee)
                      : "Grátis"}
                  </span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>- {formatCurrency(cart.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <Button
                  asChild
                  className="w-full h-11 text-white font-semibold"
                  style={{ backgroundColor: "var(--restaurant-primary)" }}
                >
                  <Link
                    href={`/store/${restaurant.slug}/checkout`}
                    onClick={() => onOpenChange(false)}
                  >
                    Finalizar Pedido
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={clearCart}
                >
                  Limpar carrinho
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
