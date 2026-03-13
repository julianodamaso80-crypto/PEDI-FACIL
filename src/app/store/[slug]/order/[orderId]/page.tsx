"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Package,
  Truck,
  Home,
  Copy,
  Check,
  MessageCircle,
  Loader2,
} from "lucide-react"
import type { OrderTrackingData, OrderStatusType } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const STATUS_CONFIG: Record<
  OrderStatusType,
  { label: string; color: string; bgColor: string }
> = {
  PENDING: {
    label: "Pendente",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  CONFIRMED: {
    label: "Confirmado",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  PREPARING: {
    label: "Preparando",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  READY: {
    label: "Pronto",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  OUT_FOR_DELIVERY: {
    label: "Saiu para Entrega",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  DELIVERED: {
    label: "Entregue",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  CANCELLED: {
    label: "Cancelado",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
}

const DELIVERY_STEPS: {
  status: OrderStatusType
  label: string
  icon: React.ElementType
}[] = [
  { status: "PENDING", label: "Pedido Recebido", icon: Clock },
  { status: "CONFIRMED", label: "Confirmado", icon: CheckCircle2 },
  { status: "PREPARING", label: "Preparando", icon: ChefHat },
  { status: "READY", label: "Pronto", icon: Package },
  { status: "OUT_FOR_DELIVERY", label: "Saiu para Entrega", icon: Truck },
  { status: "DELIVERED", label: "Entregue", icon: Home },
]

const PICKUP_STEPS = DELIVERY_STEPS.filter(
  (s) => s.status !== "OUT_FOR_DELIVERY"
)

const STATUS_ORDER: OrderStatusType[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
]

function getStatusIndex(status: OrderStatusType): number {
  return STATUS_ORDER.indexOf(status)
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
}

export default function OrderTrackingPage() {
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<OrderTrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error("Pedido não encontrado")
      const data = await response.json()
      setOrder(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedido")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  async function copyPixCode() {
    if (!order?.pixCopyPaste) return
    try {
      await navigator.clipboard.writeText(order.pixCopyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // fallback
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center shadow-sm max-w-sm w-full">
          <p className="text-gray-600">{error || "Pedido não encontrado"}</p>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status]
  const steps =
    order.type === "PICKUP" ? PICKUP_STEPS : DELIVERY_STEPS
  const currentIndex = getStatusIndex(order.status)
  const isCancelled = order.status === "CANCELLED"

  const whatsappMessage = encodeURIComponent(
    `Olá! Gostaria de saber sobre meu pedido #${order.orderNumber}`
  )
  const whatsappUrl = `https://wa.me/${order.restaurant.whatsapp.replace(/\D/g, "")}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                Pedido #{order.orderNumber}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {order.restaurant.name}
              </p>
            </div>
            <Badge
              className={cn(
                "text-sm px-3 py-1 font-medium",
                statusConfig.bgColor,
                statusConfig.color
              )}
              variant="outline"
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Estimated Time */}
        {order.estimatedTime &&
          !isCancelled &&
          order.status !== "DELIVERED" && (
            <div className="bg-white rounded-xl p-5 shadow-sm text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Tempo estimado
                </span>
              </div>
              <p className="text-2xl font-bold">
                {order.estimatedTime} min
              </p>
            </div>
          )}

        {/* Status Timeline */}
        {!isCancelled && (
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-base mb-5">
              Acompanhe seu pedido
            </h2>
            <div className="space-y-0">
              {steps.map((step, index) => {
                const stepIndex = getStatusIndex(step.status)
                const isCompleted = stepIndex <= currentIndex
                const isCurrent = step.status === order.status
                const isLast = index === steps.length - 1
                const Icon = step.icon

                return (
                  <div key={step.status} className="flex gap-4">
                    {/* Circle and Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                          isCurrent
                            ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)] text-white"
                            : isCompleted
                              ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)]/10 text-[var(--restaurant-primary)]"
                              : "border-gray-200 bg-gray-50 text-gray-300"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {!isLast && (
                        <div
                          className={cn(
                            "w-0.5 h-8 transition-all",
                            isCompleted && stepIndex < currentIndex
                              ? "bg-[var(--restaurant-primary)]"
                              : "bg-gray-200"
                          )}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="pt-2 pb-4">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isCurrent
                            ? "text-[var(--restaurant-primary)]"
                            : isCompleted
                              ? "text-gray-800"
                              : "text-gray-400"
                        )}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Cancelled Message */}
        {isCancelled && (
          <section className="bg-red-50 rounded-xl p-5 shadow-sm border border-red-200">
            <p className="text-red-700 font-medium text-center">
              Este pedido foi cancelado.
            </p>
          </section>
        )}

        {/* PIX Payment */}
        {order.paymentMethod === "PIX" &&
          order.paymentStatus === "PENDING" &&
          !isCancelled && (
            <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="font-semibold text-base">Pagamento PIX</h2>

              {order.pixCopyPaste && (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 break-all text-sm text-gray-700 font-mono">
                    {order.pixCopyPaste}
                  </div>
                  <Button
                    onClick={copyPixCode}
                    variant="outline"
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar código Pix
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-yellow-600 bg-yellow-50 rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  Aguardando pagamento...
                </span>
              </div>
            </section>
          )}

        {/* Order Items */}
        <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-base">Itens do pedido</h2>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {item.quantity}x {item.menuItem.name}
                  </p>
                  {item.size && (
                    <p className="text-xs text-gray-500">{item.size}</p>
                  )}
                  {item.extras &&
                    Array.isArray(item.extras) &&
                    item.extras.length > 0 && (
                      <p className="text-xs text-gray-500">
                        +{" "}
                        {(item.extras as { name: string; price: number }[])
                          .map((e) => e.name)
                          .join(", ")}
                      </p>
                    )}
                  {item.notes && (
                    <p className="text-xs text-gray-400 italic">
                      {item.notes}
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa de entrega</span>
              <span>
                {order.deliveryFee > 0
                  ? formatCurrency(order.deliveryFee)
                  : "Grátis"}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto</span>
                <span>- {formatCurrency(order.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <section className="bg-white rounded-xl p-5 shadow-sm space-y-2">
            <h2 className="font-semibold text-base">Endereço de entrega</h2>
            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          </section>
        )}

        {/* Payment Method */}
        <section className="bg-white rounded-xl p-5 shadow-sm space-y-2">
          <h2 className="font-semibold text-base">Pagamento</h2>
          <p className="text-sm text-gray-600">
            {PAYMENT_METHOD_LABELS[order.paymentMethod] ||
              order.paymentMethod}
          </p>
        </section>

        {/* Restaurant Contact */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-base mb-3">
            Falar com o restaurante
          </h2>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-medium transition-colors w-full justify-center"
          >
            <MessageCircle className="w-5 h-5" />
            Chamar no WhatsApp
          </a>
        </section>
      </div>
    </div>
  )
}
