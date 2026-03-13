import type { OrderStatus, OrderType } from "@/generated/prisma"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para Entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PREPARING: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  READY: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  OUT_FOR_DELIVERY: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  DELIVERED: "bg-green-500/20 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartao de Credito",
  DEBIT_CARD: "Cartao de Debito",
  CASH: "Dinheiro",
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Reembolsado",
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
}

export function getNextStatus(
  currentStatus: string,
  orderType: string
): string | null {
  switch (currentStatus) {
    case "PENDING":
      return "CONFIRMED"
    case "CONFIRMED":
      return "PREPARING"
    case "PREPARING":
      return "READY"
    case "READY":
      return orderType === "DELIVERY" ? "OUT_FOR_DELIVERY" : "DELIVERED"
    case "OUT_FOR_DELIVERY":
      return "DELIVERED"
    default:
      return null
  }
}

export function getStatusActionLabel(
  currentStatus: string,
  orderType: string
): string | null {
  switch (currentStatus) {
    case "PENDING":
      return "Confirmar"
    case "CONFIRMED":
      return "Preparando"
    case "PREPARING":
      return "Pronto"
    case "READY":
      return orderType === "DELIVERY" ? "Saiu para Entrega" : "Entregue"
    case "OUT_FOR_DELIVERY":
      return "Entregue"
    default:
      return null
  }
}

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method
}

export function getPaymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] || status
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "agora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min atras`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atras`
  const days = Math.floor(hours / 24)
  return `${days}d atras`
}
