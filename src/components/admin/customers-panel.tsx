"use client"

import { useCallback, useEffect, useState } from "react"
import { cn, formatCurrency, formatPhone } from "@/lib/utils"
import { getStatusLabel, getStatusColor, timeAgo } from "@/lib/order-helpers"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Award,
  Clock,
  Hash,
  Star,
  UserCheck,
  Crown,
  UserX,
  Cake,
} from "lucide-react"

// ==================== TYPES ====================

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  birthday: string | null
  totalOrders: number
  totalSpent: number
  loyaltyPoints: number
  lastOrderAt: string | null
  createdAt: string
}

interface Order {
  id: string
  orderNumber: number
  status: string
  type: string
  total: number
  createdAt: string
}

interface CustomersPanelProps {
  restaurantId: string
  initialCustomers: Customer[]
}

// ==================== HELPERS ====================

function getCustomerStatus(customer: Customer): {
  label: string
  className: string
  icon: React.ReactNode
} {
  const daysSinceLastOrder = customer.lastOrderAt
    ? Math.floor(
        (Date.now() - new Date(customer.lastOrderAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : Infinity

  if (daysSinceLastOrder >= 30) {
    return {
      label: "Inativo",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: <UserX className="w-3 h-3" />,
    }
  }
  if (customer.totalOrders >= 10) {
    return {
      label: "VIP",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: <Crown className="w-3 h-3" />,
    }
  }
  if (customer.totalOrders >= 3) {
    return {
      label: "Recorrente",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      icon: <UserCheck className="w-3 h-3" />,
    }
  }
  return {
    label: "Novo",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: <Star className="w-3 h-3" />,
  }
}

// ==================== COMPONENT ====================

export function CustomersPanel({
  restaurantId,
  initialCustomers,
}: CustomersPanelProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )
  const [detailOpen, setDetailOpen] = useState(false)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // ---- Search customers ----
  const searchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ restaurantId })
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim())
      }
      const res = await fetch(`/api/customers?${params.toString()}`)
      if (!res.ok) return
      const data: Customer[] = await res.json()
      setCustomers(data)
    } catch (err) {
      console.error("Erro ao buscar clientes:", err)
    }
  }, [restaurantId, searchQuery])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers()
    }, 400)
    return () => clearTimeout(timer)
  }, [searchCustomers])

  // ---- Fetch customer orders ----
  const fetchCustomerOrders = async (customerId: string) => {
    setLoadingOrders(true)
    setCustomerOrders([])
    try {
      const res = await fetch(
        `/api/orders?restaurantId=${restaurantId}&customerId=${customerId}`
      )
      if (!res.ok) return
      const data = await res.json()
      setCustomerOrders(data)
    } catch (err) {
      console.error("Erro ao buscar pedidos do cliente:", err)
    } finally {
      setLoadingOrders(false)
    }
  }

  // ---- Open customer detail ----
  const openDetail = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDetailOpen(true)
    fetchCustomerOrders(customer.id)
  }

  // ---- Stats summary ----
  const totalCustomers = customers.length
  const vipCount = customers.filter((c) => c.totalOrders >= 10).length
  const activeCount = customers.filter((c) => {
    if (!c.lastOrderAt) return false
    const days = Math.floor(
      (Date.now() - new Date(c.lastOrderAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return days < 30
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-400" />
            Clientes
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalCustomers} clientes cadastrados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-green-500/30 text-green-400 bg-green-500/10"
          >
            {activeCount} ativos
          </Badge>
          <Badge
            variant="outline"
            className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
          >
            <Crown className="w-3 h-3 mr-1" />
            {vipCount} VIPs
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
        />
      </div>

      {/* Customer Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Nome
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 hidden sm:table-cell">
                  Telefone
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-400">
                  Pedidos
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 hidden md:table-cell">
                  Gasto Total
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-400 hidden lg:table-cell">
                  Pontos
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400 hidden md:table-cell">
                  Ultimo Pedido
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {customers.map((customer) => {
                const status = getCustomerStatus(customer)
                return (
                  <tr
                    key={customer.id}
                    onClick={() => openDetail(customer)}
                    className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 font-medium text-xs">
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {customer.name}
                          </p>
                          <p className="text-xs text-gray-500 sm:hidden">
                            {formatPhone(customer.phone)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 hidden sm:table-cell">
                      {formatPhone(customer.phone)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300 font-medium">
                      {customer.totalOrders}
                    </td>
                    <td className="px-4 py-3 text-green-400 font-medium hidden md:table-cell">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="text-yellow-400 font-medium">
                        {customer.loyaltyPoints}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {customer.lastOrderAt
                        ? timeAgo(new Date(customer.lastOrderAt))
                        : "Nunca"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={cn("text-xs border", status.className)}
                      >
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                    </td>
                  </tr>
                )
              })}
              {customers.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhum cliente encontrado</p>
                    {searchQuery && (
                      <p className="text-sm mt-1">
                        Tente buscar com outros termos
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== Customer Detail Dialog ==================== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-bold">
                    {selectedCustomer.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <span className="text-lg">{selectedCustomer.name}</span>
                    <div className="mt-0.5">
                      {(() => {
                        const status = getCustomerStatus(selectedCustomer)
                        return (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs border",
                              status.className
                            )}
                          >
                            {status.icon}
                            <span className="ml-1">{status.label}</span>
                          </Badge>
                        )
                      })()}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Contact info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Informacoes
                  </h3>
                  <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{formatPhone(selectedCustomer.phone)}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                    {selectedCustomer.birthday && (
                      <div className="flex items-center gap-2 text-sm">
                        <Cake className="w-4 h-4 text-gray-500" />
                        <span>
                          {new Date(
                            selectedCustomer.birthday
                          ).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Estatisticas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <ShoppingBag className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-white">
                        {selectedCustomer.totalOrders}
                      </p>
                      <p className="text-xs text-gray-500">Pedidos</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-green-400">
                        {formatCurrency(selectedCustomer.totalSpent)}
                      </p>
                      <p className="text-xs text-gray-500">Gasto Total</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <Award className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-yellow-400">
                        {selectedCustomer.loyaltyPoints}
                      </p>
                      <p className="text-xs text-gray-500">Pontos</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-sm font-medium text-white">
                        {new Date(
                          selectedCustomer.createdAt
                        ).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-gray-500">Cliente desde</p>
                    </div>
                  </div>
                </div>

                {/* Order history */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Historico de Pedidos
                  </h3>
                  <div className="bg-gray-800/50 rounded-lg divide-y divide-gray-700/50">
                    {loadingOrders ? (
                      <div className="p-6 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2" />
                        Carregando pedidos...
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        Nenhum pedido encontrado
                      </div>
                    ) : (
                      customerOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Hash className="w-3.5 h-3.5 text-gray-500" />
                              <span className="font-medium text-white text-sm">
                                {String(order.orderNumber).padStart(2, "0")}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs border",
                                getStatusColor(order.status)
                              )}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-green-400 font-medium text-sm">
                              {formatCurrency(order.total)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {timeAgo(new Date(order.createdAt))}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
