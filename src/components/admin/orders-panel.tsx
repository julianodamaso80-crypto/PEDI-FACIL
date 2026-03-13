"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn, formatCurrency } from "@/lib/utils"
import { formatPhone } from "@/lib/utils"
import {
  getStatusLabel,
  getStatusColor,
  getNextStatus,
  getStatusActionLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  timeAgo,
} from "@/lib/order-helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock,
  Hash,
  MapPin,
  Phone,
  ShoppingBag,
  User,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Package,
  Truck,
  ChefHat,
  RefreshCw,
} from "lucide-react"

// ==================== TYPES ====================

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes: string | null
  extras: { name: string; price: number }[] | null
  size: string | null
  menuItem: {
    name: string
    image: string | null
  }
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
}

interface Order {
  id: string
  orderNumber: number
  status: string
  type: string
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  deliveryAddress: string | null
  deliveryNotes: string | null
  estimatedTime: number | null
  couponCode: string | null
  customerId: string
  customer: Customer
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

interface OrdersPanelProps {
  restaurantId: string
  initialOrders: Order[]
}

// ==================== CONSTANTS ====================

const STATUS_TABS = [
  { key: "ALL", label: "Todos" },
  { key: "PENDING", label: "Pendentes" },
  { key: "CONFIRMED", label: "Confirmados" },
  { key: "PREPARING", label: "Preparando" },
  { key: "OUT_FOR_DELIVERY", label: "Entrega" },
  { key: "DELIVERED", label: "Finalizados" },
  { key: "CANCELLED", label: "Cancelados" },
] as const

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <AlertTriangle className="w-4 h-4" />,
  CONFIRMED: <CheckCircle className="w-4 h-4" />,
  PREPARING: <ChefHat className="w-4 h-4" />,
  READY: <Package className="w-4 h-4" />,
  OUT_FOR_DELIVERY: <Truck className="w-4 h-4" />,
  DELIVERED: <CheckCircle className="w-4 h-4" />,
  CANCELLED: <XCircle className="w-4 h-4" />,
}

// ==================== COMPONENT ====================

export function OrdersPanel({ restaurantId, initialOrders }: OrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<string>("ALL")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const prevPendingCountRef = useRef(
    initialOrders.filter((o) => o.status === "PENDING").length
  )

  // ---- Fetch orders ----
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?restaurantId=${restaurantId}`)
      if (!res.ok) return
      const data: Order[] = await res.json()

      // Check for new pending orders (sound notification)
      const newPendingCount = data.filter((o) => o.status === "PENDING").length
      if (newPendingCount > prevPendingCountRef.current) {
        playNotificationSound()
      }
      prevPendingCountRef.current = newPendingCount

      setOrders(data)

      // Update selected order if it's open
      if (selectedOrder) {
        const updated = data.find((o) => o.id === selectedOrder.id)
        if (updated) setSelectedOrder(updated)
      }
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err)
    }
  }, [restaurantId, selectedOrder])

  // ---- Auto-refresh every 15s ----
  useEffect(() => {
    const interval = setInterval(fetchOrders, 15000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // ---- Manual refresh ----
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchOrders()
    setIsRefreshing(false)
  }

  // ---- Sound notification ----
  const playNotificationSound = () => {
    try {
      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.frequency.value = 800
      oscillator.type = "sine"
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.5)
    } catch {
      // Audio not supported
    }
  }

  // ---- Update order status ----
  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        await fetchOrders()
        if (newStatus === "CANCELLED") {
          setCancelDialogOpen(false)
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // ---- Filter orders by active tab ----
  const filteredOrders =
    activeTab === "ALL"
      ? orders
      : orders.filter((o) => o.status === activeTab)

  // ---- Count per status ----
  const countByStatus = (status: string) => {
    if (status === "ALL") return orders.length
    return orders.filter((o) => o.status === status).length
  }

  // ---- Items summary text ----
  const itemsSummary = (items: OrderItem[]) => {
    return items
      .map((item) => `${item.quantity}x ${item.menuItem.name}`)
      .join(", ")
  }

  // ---- Open order detail ----
  const openDetail = (order: Order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold">Pedidos</h1>
              <Badge
                variant="outline"
                className="border-orange-500/30 text-orange-400 bg-orange-500/10"
              >
                {orders.filter((o) => o.status === "PENDING").length} novos
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
              />
              Atualizar
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => {
              const count = countByStatus(tab.key)
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      isActive
                        ? "bg-orange-500/30 text-orange-300"
                        : "bg-gray-800 text-gray-500"
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm mt-1">
              {activeTab === "ALL"
                ? "Os pedidos aparecerão aqui quando clientes fizerem novos pedidos."
                : `Nenhum pedido com status "${STATUS_TABS.find((t) => t.key === activeTab)?.label}".`}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredOrders.map((order) => {
              const nextStatus = getNextStatus(order.status, order.type)
              const actionLabel = getStatusActionLabel(order.status, order.type)
              return (
                <div
                  key={order.id}
                  onClick={() => openDetail(order)}
                  className={cn(
                    "bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer transition-all hover:border-gray-700 hover:bg-gray-900/80",
                    order.status === "PENDING" &&
                      "border-yellow-500/30 bg-yellow-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-white">
                          #{String(order.orderNumber).padStart(2, "0")}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs border",
                            getStatusColor(order.status)
                          )}
                        >
                          {STATUS_ICON[order.status]}
                          <span className="ml-1">
                            {getStatusLabel(order.status)}
                          </span>
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-700 text-gray-400"
                        >
                          {order.type === "DELIVERY" ? "Entrega" : "Retirada"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{order.customer.name}</span>
                      </div>

                      <p className="text-sm text-gray-500 truncate">
                        {itemsSummary(order.items)}
                      </p>
                    </div>

                    {/* Right: Total, time, action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-lg font-bold text-green-400">
                        {formatCurrency(order.total)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(new Date(order.createdAt))}</span>
                      </div>
                      {nextStatus && actionLabel && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateStatus(order.id, nextStatus)
                          }}
                          disabled={updatingOrderId === order.id}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-7 px-3"
                        >
                          {updatingOrderId === order.id
                            ? "..."
                            : actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ==================== Order Detail Dialog ==================== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-xl">
                    Pedido #
                    {String(selectedOrder.orderNumber).padStart(2, "0")}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs border",
                      getStatusColor(selectedOrder.status)
                    )}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Customer info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Cliente
                  </h3>
                  <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{selectedOrder.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>
                        {formatPhone(selectedOrder.customer.phone)}
                      </span>
                    </div>
                    {selectedOrder.deliveryAddress && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span>{selectedOrder.deliveryAddress}</span>
                      </div>
                    )}
                    {selectedOrder.deliveryNotes && (
                      <p className="text-xs text-gray-400 pl-6">
                        Obs: {selectedOrder.deliveryNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order items */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Itens
                  </h3>
                  <div className="bg-gray-800/50 rounded-lg divide-y divide-gray-700/50">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-medium">
                              {item.quantity}x {item.menuItem.name}
                            </span>
                            {item.size && (
                              <span className="text-xs text-gray-400 ml-2">
                                ({item.size})
                              </span>
                            )}
                            {item.extras &&
                              Array.isArray(item.extras) &&
                              item.extras.length > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  +{" "}
                                  {item.extras
                                    .map((e) => e.name)
                                    .join(", ")}
                                </p>
                              )}
                            {item.notes && (
                              <p className="text-xs text-yellow-500/70 mt-0.5">
                                Obs: {item.notes}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-gray-300 shrink-0 ml-3">
                            {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Valores
                  </h3>
                  <div className="bg-gray-800/50 rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between text-gray-400">
                        <span>Taxa de entrega</span>
                        <span>
                          {formatCurrency(selectedOrder.deliveryFee)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Desconto</span>
                        <span>
                          -{formatCurrency(selectedOrder.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-white border-t border-gray-700 pt-1.5 mt-1.5">
                      <span>Total</span>
                      <span className="text-green-400">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Pagamento
                  </h3>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Metodo</span>
                      <span>
                        {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span>
                        {getPaymentStatusLabel(selectedOrder.paymentStatus)}
                      </span>
                    </div>
                    {selectedOrder.couponCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cupom</span>
                        <span className="text-orange-400">
                          {selectedOrder.couponCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time info */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    Pedido realizado{" "}
                    {timeAgo(new Date(selectedOrder.createdAt))}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
                  {(() => {
                    const nextStatus = getNextStatus(
                      selectedOrder.status,
                      selectedOrder.type
                    )
                    const actionLabel = getStatusActionLabel(
                      selectedOrder.status,
                      selectedOrder.type
                    )
                    if (!nextStatus || !actionLabel) return null
                    return (
                      <Button
                        onClick={() =>
                          updateStatus(selectedOrder.id, nextStatus)
                        }
                        disabled={updatingOrderId === selectedOrder.id}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {updatingOrderId === selectedOrder.id
                          ? "Atualizando..."
                          : actionLabel}
                      </Button>
                    )
                  })()}

                  {selectedOrder.status !== "DELIVERED" &&
                    selectedOrder.status !== "CANCELLED" && (
                      <>
                        {!cancelDialogOpen ? (
                          <Button
                            variant="outline"
                            onClick={() => setCancelDialogOpen(true)}
                            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 bg-transparent"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar Pedido
                          </Button>
                        ) : (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-3">
                            <p className="text-sm text-red-400 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Tem certeza que deseja cancelar este pedido?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCancelDialogOpen(false)}
                                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                              >
                                Nao
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateStatus(
                                    selectedOrder.id,
                                    "CANCELLED"
                                  )
                                }
                                disabled={updatingOrderId === selectedOrder.id}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                              >
                                {updatingOrderId === selectedOrder.id
                                  ? "Cancelando..."
                                  : "Sim, Cancelar"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
