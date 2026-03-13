"use client"

import Image from "next/image"
import { useRef } from "react"
import { Clock, MapPin, Phone, Truck, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatPhone } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { StoreHeader, isRestaurantOpen } from "@/components/store/store-header"
import { MenuItemCard } from "@/components/store/menu-item-card"
import { FloatingCartButton } from "@/components/store/floating-cart-button"
import type { RestaurantWithMenu } from "@/types"

export function StoreContent({
  restaurant,
}: {
  restaurant: RestaurantWithMenu
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const isOpen = isRestaurantOpen(restaurant.openingHours, restaurant.isOpen)

  function scrollToCategory(categoryId: string) {
    const el = document.getElementById(`category-${categoryId}`)
    if (el) {
      const headerOffset = 130
      const elementPosition = el.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: elementPosition - headerOffset, behavior: "smooth" })
    }
  }

  const activeCategories = restaurant.categories.filter(
    (cat) => cat.items.length > 0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />

      {/* Banner */}
      <div className="relative h-40 w-full overflow-hidden sm:h-52">
        {restaurant.bannerImage ? (
          <Image
            src={restaurant.bannerImage}
            alt={`Banner ${restaurant.name}`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${restaurant.primaryColor} 0%, ${restaurant.secondaryColor} 100%)`,
            }}
          />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3">
              {restaurant.logo && (
                <Image
                  src={restaurant.logo}
                  alt={restaurant.name}
                  width={56}
                  height={56}
                  className="rounded-xl border-2 border-white object-cover shadow-lg"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-lg sm:text-2xl">
                  {restaurant.name}
                </h1>
                {restaurant.description && (
                  <p className="mt-0.5 text-sm text-white/90 drop-shadow line-clamp-1">
                    {restaurant.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 overflow-x-auto px-4 py-3 text-sm scrollbar-none">
          <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{restaurant.estimatedTime} min</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>
              {restaurant.deliveryFee > 0
                ? formatCurrency(restaurant.deliveryFee)
                : "Entrega grátis"}
            </span>
          </div>
          {restaurant.minimumOrder > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="shrink-0 text-muted-foreground">
                Pedido mín. {formatCurrency(restaurant.minimumOrder)}
              </div>
            </>
          )}
          <Separator orientation="vertical" className="h-4" />
          <Badge
            className={cn(
              "shrink-0 text-[10px]",
              isOpen
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            )}
          >
            {isOpen ? "Aberto agora" : "Fechado"}
          </Badge>
        </div>
      </div>

      {/* Category Navigation */}
      {activeCategories.length > 0 && (
        <div className="sticky top-16 z-30 border-b bg-white shadow-sm">
          <div className="mx-auto max-w-4xl">
            <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
              {activeCategories.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-full text-xs font-medium hover:bg-muted"
                  onClick={() => scrollToCategory(category.id)}
                >
                  {category.name}
                  <ChevronRight className="ml-0.5 h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Sections */}
      <div ref={menuRef} className="mx-auto max-w-4xl px-4 pb-32 pt-6">
        {activeCategories.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold text-muted-foreground">
              Nenhum item disponível no momento
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Volte mais tarde para conferir nosso cardápio
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeCategories.map((category) => (
              <section key={category.id} id={`category-${category.id}`}>
                <h2 className="mb-4 text-lg font-bold">{category.name}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {category.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Address */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4" />
                Endereço
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {restaurant.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {restaurant.city} - {restaurant.state}
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Phone className="h-4 w-4" />
                Contato
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {formatPhone(restaurant.phone)}
              </p>
              <a
                href={`https://wa.me/55${restaurant.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                style={{ color: "var(--restaurant-primary)" }}
              >
                WhatsApp
                <ChevronRight className="h-3 w-3" />
              </a>
            </div>

            {/* Opening Hours */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                Horários
              </h3>
              <div className="mt-1.5 space-y-0.5">
                {Object.entries(restaurant.openingHours).map(([day, hours]) => {
                  const dayNames: Record<string, string> = {
                    monday: "Seg",
                    tuesday: "Ter",
                    wednesday: "Qua",
                    thursday: "Qui",
                    friday: "Sex",
                    saturday: "Sáb",
                    sunday: "Dom",
                  }
                  return (
                    <div
                      key={day}
                      className="flex justify-between text-sm text-muted-foreground"
                    >
                      <span>{dayNames[day] || day}</span>
                      <span>
                        {hours.open} - {hours.close}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <p className="text-center text-xs text-muted-foreground">
            Powered by{" "}
            <span className="font-semibold" style={{ color: "var(--restaurant-primary)" }}>
              PedeFácil
            </span>
          </p>
        </div>
      </footer>

      {/* Floating Cart Button */}
      <FloatingCartButton />
    </div>
  )
}
