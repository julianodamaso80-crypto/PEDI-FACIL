"use client"

import { createContext, useContext } from "react"
import type { RestaurantWithMenu } from "@/types"

const RestaurantContext = createContext<RestaurantWithMenu | null>(null)

export function RestaurantProvider({
  children,
  restaurant,
}: {
  children: React.ReactNode
  restaurant: RestaurantWithMenu
}) {
  return (
    <RestaurantContext.Provider value={restaurant}>
      {children}
    </RestaurantContext.Provider>
  )
}

export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (!context) {
    throw new Error("useRestaurant must be used within a RestaurantProvider")
  }
  return context
}
