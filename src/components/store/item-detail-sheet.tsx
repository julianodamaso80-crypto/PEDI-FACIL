"use client"

import Image from "next/image"
import { useState, useMemo } from "react"
import { Minus, Plus } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { useCart } from "@/contexts/cart-context"
import type { MenuItemType, Size, Extra } from "@/types"

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
}: {
  item: MenuItemType
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<Size | null>(
    item.sizes && item.sizes.length > 0 ? item.sizes[0] : null
  )
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([])
  const [notes, setNotes] = useState("")

  const calculatedTotal = useMemo(() => {
    const basePrice = selectedSize ? selectedSize.price : item.price
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0)
    return (basePrice + extrasTotal) * quantity
  }, [item.price, selectedSize, selectedExtras, quantity])

  function handleToggleExtra(extra: Extra) {
    setSelectedExtras((prev) => {
      const exists = prev.find((e) => e.name === extra.name)
      if (exists) return prev.filter((e) => e.name !== extra.name)
      return [...prev, extra]
    })
  }

  function handleAdd() {
    addItem({
      menuItem: item,
      quantity,
      selectedSize,
      selectedExtras,
      notes,
    })
    // Reset state and close
    setQuantity(1)
    setSelectedSize(
      item.sizes && item.sizes.length > 0 ? item.sizes[0] : null
    )
    setSelectedExtras([])
    setNotes("")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0 sm:max-w-lg sm:mx-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{item.name}</SheetTitle>
          <SheetDescription>Detalhes do item</SheetDescription>
        </SheetHeader>

        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                backgroundColor: "var(--restaurant-primary)",
                opacity: 0.15,
              }}
            >
              <span className="text-7xl" style={{ opacity: 1 }}>
                🍽️
              </span>
            </div>
          )}
          {item.isPopular && (
            <Badge className="absolute left-3 top-3 bg-amber-500 text-white">
              Popular
            </Badge>
          )}
        </div>

        <div className="space-y-5 p-5">
          {/* Name & Description */}
          <div>
            <h2 className="text-xl font-bold">{item.name}</h2>
            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
            <p
              className="mt-2 text-lg font-bold"
              style={{ color: "var(--restaurant-primary)" }}
            >
              {formatCurrency(selectedSize ? selectedSize.price : item.price)}
            </p>
          </div>

          {/* Sizes */}
          {item.sizes && item.sizes.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Tamanho</h3>
              <div className="space-y-2">
                {item.sizes.map((size) => (
                  <label
                    key={size.name}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                      selectedSize?.name === size.name
                        ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)]/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          selectedSize?.name === size.name
                            ? "border-[var(--restaurant-primary)]"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {selectedSize?.name === size.name && (
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: "var(--restaurant-primary)",
                            }}
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium">{size.name}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(size.price)}
                    </span>
                    <input
                      type="radio"
                      name="size"
                      className="sr-only"
                      checked={selectedSize?.name === size.name}
                      onChange={() => setSelectedSize(size)}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Extras */}
          {item.extras && item.extras.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Adicionais</h3>
              <div className="space-y-2">
                {item.extras.map((extra) => {
                  const isSelected = selectedExtras.some(
                    (e) => e.name === extra.name
                  )
                  return (
                    <label
                      key={extra.name}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)]/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleExtra(extra)}
                        />
                        <span className="text-sm font-medium">
                          {extra.name}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        + {formatCurrency(extra.price)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="item-notes" className="text-sm font-semibold">
              Observações
            </Label>
            <Textarea
              id="item-notes"
              placeholder="Ex: sem cebola, bem passado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5 resize-none"
              rows={2}
            />
          </div>

          {/* Quantity + Add Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-r-none"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex h-10 w-10 items-center justify-center text-sm font-semibold">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-l-none"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              className="flex-1 h-11 text-white font-semibold"
              style={{ backgroundColor: "var(--restaurant-primary)" }}
              onClick={handleAdd}
            >
              Adicionar {formatCurrency(calculatedTotal)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
