import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { CartProvider } from "@/contexts/cart-context"
import { RestaurantProvider } from "@/contexts/restaurant-context"
import type { RestaurantWithMenu } from "@/types"

export const dynamic = "force-dynamic"

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  })

  if (!restaurant) {
    notFound()
  }

  const restaurantData: RestaurantWithMenu = {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description,
    logo: restaurant.logo,
    bannerImage: restaurant.bannerImage,
    phone: restaurant.phone,
    whatsapp: restaurant.whatsapp,
    email: restaurant.email,
    address: restaurant.address,
    city: restaurant.city,
    state: restaurant.state,
    zipCode: restaurant.zipCode,
    isOpen: restaurant.isOpen,
    openingHours: restaurant.openingHours as RestaurantWithMenu["openingHours"],
    minimumOrder: restaurant.minimumOrder,
    deliveryFee: restaurant.deliveryFee,
    deliveryRadius: restaurant.deliveryRadius,
    estimatedTime: restaurant.estimatedTime,
    acceptsPix: restaurant.acceptsPix,
    acceptsCard: restaurant.acceptsCard,
    acceptsCash: restaurant.acceptsCash,
    primaryColor: restaurant.primaryColor,
    secondaryColor: restaurant.secondaryColor,
    categories: restaurant.categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.image,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      items: cat.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        isAvailable: item.isAvailable,
        isPopular: item.isPopular,
        extras: item.extras as RestaurantWithMenu["categories"][0]["items"][0]["extras"],
        sizes: item.sizes as RestaurantWithMenu["categories"][0]["items"][0]["sizes"],
      })),
    })),
  }

  return (
    <div
      style={
        {
          "--restaurant-primary": restaurant.primaryColor,
          "--restaurant-secondary": restaurant.secondaryColor,
        } as React.CSSProperties
      }
    >
      <RestaurantProvider restaurant={restaurantData}>
        <CartProvider
          restaurantSlug={restaurant.slug}
          initialDeliveryFee={restaurant.deliveryFee}
        >
          {children}
        </CartProvider>
      </RestaurantProvider>
    </div>
  )
}
