"use client"

import Image from "next/image"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { MenuItemType } from "@/types"
import { ItemDetailSheet } from "./item-detail-sheet"

export function MenuItemCard({ item }: { item: MenuItemType }) {
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <>
      <Card
        className="cursor-pointer overflow-hidden border transition-shadow hover:shadow-md p-0"
        onClick={() => setDetailOpen(true)}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-4xl"
              style={{
                backgroundColor: "var(--restaurant-primary)",
                opacity: 0.15,
              }}
            >
              <span className="text-5xl" style={{ opacity: 1 }}>
                🍽️
              </span>
            </div>
          )}
          {item.isPopular && (
            <Badge className="absolute left-2 top-2 bg-amber-500 text-white hover:bg-amber-600 text-[10px]">
              Popular
            </Badge>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span
              className="text-sm font-bold"
              style={{ color: "var(--restaurant-primary)" }}
            >
              {item.sizes && item.sizes.length > 0
                ? `a partir de ${formatCurrency(
                    Math.min(item.price, ...item.sizes.map((s) => s.price))
                  )}`
                : formatCurrency(item.price)}
            </span>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full text-white text-lg leading-none"
              style={{ backgroundColor: "var(--restaurant-primary)" }}
              onClick={(e) => {
                e.stopPropagation()
                setDetailOpen(true)
              }}
            >
              +
            </button>
          </div>
        </div>
      </Card>

      <ItemDetailSheet
        item={item}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
