// Restaurant with all relations loaded
export type RestaurantWithMenu = {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  bannerImage: string | null
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  isOpen: boolean
  openingHours: Record<string, { open: string; close: string }>
  minimumOrder: number
  deliveryFee: number
  deliveryRadius: number
  estimatedTime: number
  acceptsPix: boolean
  acceptsCard: boolean
  acceptsCash: boolean
  primaryColor: string
  secondaryColor: string
  categories: CategoryWithItems[]
}

export type CategoryWithItems = {
  id: string
  name: string
  description: string | null
  image: string | null
  sortOrder: number
  isActive: boolean
  items: MenuItemType[]
}

export type MenuItemType = {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  isAvailable: boolean
  isPopular: boolean
  extras: Extra[] | null
  sizes: Size[] | null
}

export type Extra = {
  name: string
  price: number
}

export type Size = {
  name: string
  price: number
}

// Cart types
export type CartItem = {
  id: string // unique cart item id
  menuItem: MenuItemType
  quantity: number
  selectedSize: Size | null
  selectedExtras: Extra[]
  notes: string
  totalPrice: number // calculated
}

export type Cart = {
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  couponCode: string | null
}

// Checkout types
export type CheckoutFormData = {
  name: string
  phone: string
  email?: string
  orderType: "DELIVERY" | "PICKUP"
  address?: string
  complement?: string
  reference?: string
  paymentMethod: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH"
  changeFor?: number
  notes?: string
}

// Order status for tracking
export type OrderStatusType =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"

export type OrderTrackingData = {
  id: string
  orderNumber: number
  status: OrderStatusType
  type: "DELIVERY" | "PICKUP"
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  pixQrCode: string | null
  pixCopyPaste: string | null
  deliveryAddress: string | null
  estimatedTime: number | null
  createdAt: string
  items: {
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    notes: string | null
    extras: Extra[] | null
    size: string | null
    menuItem: {
      name: string
      image: string | null
    }
  }[]
  restaurant: {
    name: string
    phone: string
    whatsapp: string
  }
}
