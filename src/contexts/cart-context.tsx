"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { Cart, CartItem, Extra, MenuItemType, Size } from "@/types"

type CartContextType = {
  cart: Cart
  addItem: (params: {
    menuItem: MenuItemType
    quantity: number
    selectedSize: Size | null
    selectedExtras: Extra[]
    notes: string
  }) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  setDeliveryFee: (fee: number) => void
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

function getStorageKey(slug: string) {
  return `pedefacil-cart-${slug}`
}

function calculateItemTotal(
  menuItem: MenuItemType,
  quantity: number,
  selectedSize: Size | null,
  selectedExtras: Extra[]
): number {
  const basePrice = selectedSize ? selectedSize.price : menuItem.price
  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0)
  return (basePrice + extrasTotal) * quantity
}

function calculateCartTotals(
  items: CartItem[],
  deliveryFee: number,
  discount: number
): Pick<Cart, "subtotal" | "total"> {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const total = Math.max(subtotal + deliveryFee - discount, 0)
  return { subtotal, total }
}

const emptyCart: Cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  couponCode: null,
}

export function CartProvider({
  children,
  restaurantSlug,
  initialDeliveryFee = 0,
}: {
  children: React.ReactNode
  restaurantSlug: string
  initialDeliveryFee?: number
}) {
  const [cart, setCart] = useState<Cart>(() => {
    if (typeof window === "undefined") return { ...emptyCart, deliveryFee: initialDeliveryFee }

    try {
      const stored = localStorage.getItem(getStorageKey(restaurantSlug))
      if (stored) {
        const parsed = JSON.parse(stored) as Cart
        return { ...parsed, deliveryFee: initialDeliveryFee }
      }
    } catch {
      // ignore corrupt data
    }

    return { ...emptyCart, deliveryFee: initialDeliveryFee }
  })

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(getStorageKey(restaurantSlug), JSON.stringify(cart))
    } catch {
      // storage full or unavailable
    }
  }, [cart, restaurantSlug])

  const addItem = useCallback(
    ({
      menuItem,
      quantity,
      selectedSize,
      selectedExtras,
      notes,
    }: {
      menuItem: MenuItemType
      quantity: number
      selectedSize: Size | null
      selectedExtras: Extra[]
      notes: string
    }) => {
      setCart((prev) => {
        const totalPrice = calculateItemTotal(menuItem, quantity, selectedSize, selectedExtras)

        const newItem: CartItem = {
          id: typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(),
          menuItem,
          quantity,
          selectedSize,
          selectedExtras,
          notes,
          totalPrice,
        }

        const items = [...prev.items, newItem]
        const { subtotal, total } = calculateCartTotals(items, prev.deliveryFee, prev.discount)

        return { ...prev, items, subtotal, total }
      })
    },
    []
  )

  const removeItem = useCallback((cartItemId: string) => {
    setCart((prev) => {
      const items = prev.items.filter((item) => item.id !== cartItemId)
      const { subtotal, total } = calculateCartTotals(items, prev.deliveryFee, prev.discount)
      return { ...prev, items, subtotal, total }
    })
  }, [])

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity < 1) return

    setCart((prev) => {
      const items = prev.items.map((item) => {
        if (item.id !== cartItemId) return item
        const totalPrice = calculateItemTotal(
          item.menuItem,
          quantity,
          item.selectedSize,
          item.selectedExtras
        )
        return { ...item, quantity, totalPrice }
      })
      const { subtotal, total } = calculateCartTotals(items, prev.deliveryFee, prev.discount)
      return { ...prev, items, subtotal, total }
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart((prev) => ({ ...emptyCart, deliveryFee: prev.deliveryFee }))
  }, [])

  const applyCoupon = useCallback((code: string, discount: number) => {
    setCart((prev) => {
      const { subtotal, total } = calculateCartTotals(prev.items, prev.deliveryFee, discount)
      return { ...prev, couponCode: code, discount, subtotal, total }
    })
  }, [])

  const removeCoupon = useCallback(() => {
    setCart((prev) => {
      const { subtotal, total } = calculateCartTotals(prev.items, prev.deliveryFee, 0)
      return { ...prev, couponCode: null, discount: 0, subtotal, total }
    })
  }, [])

  const setDeliveryFee = useCallback((fee: number) => {
    setCart((prev) => {
      const { subtotal, total } = calculateCartTotals(prev.items, fee, prev.discount)
      return { ...prev, deliveryFee: fee, subtotal, total }
    })
  }, [])

  const itemCount = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items]
  )

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      applyCoupon,
      removeCoupon,
      setDeliveryFee,
      itemCount,
    }),
    [cart, addItem, removeItem, updateQuantity, clearCart, applyCoupon, removeCoupon, setDeliveryFee, itemCount]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
