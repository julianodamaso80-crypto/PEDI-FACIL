import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { getStatusLabel, getStatusColor, timeAgo } from "@/lib/order-helpers"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  ShoppingBag,
  CalendarDays,
  Percent,
  TrendingUp,
  Hash,
  Clock,
  User,
  Trophy,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const restaurant = await prisma.restaurant.findFirst({
    select: { id: true, commissionRate: true },
  })

  if (!restaurant) {
    return (
      <div className="text-white">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-400">Nenhum restaurante encontrado.</p>
      </div>
    )
  }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Fetch all aggregations in parallel
  const [
    todayOrders,
    weekOrders,
    monthOrders,
    monthCommission,
    lastOrders,
    topItems,
    last30DaysData,
  ] = await Promise.all([
    // Today's orders
    prisma.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: startOfDay },
        status: { not: "CANCELLED" },
      },
      _count: true,
      _sum: { total: true },
    }),
    // This week's orders
    prisma.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: startOfWeek },
        status: { not: "CANCELLED" },
      },
      _count: true,
      _sum: { total: true },
    }),
    // This month's orders
    prisma.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
      _count: true,
      _sum: { total: true },
    }),
    // Commission this month
    prisma.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
      _sum: { commissionAmount: true },
    }),
    // Last 10 orders
    prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Top 5 best-selling items
    prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: {
        order: {
          restaurantId: restaurant.id,
          status: { not: "CANCELLED" },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    // Last 30 days daily sales
    prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: { not: "CANCELLED" },
      },
      select: { createdAt: true, total: true },
    }),
  ])

  // Resolve menu item names for top items
  const menuItemIds = topItems.map((item: { menuItemId: string }) => item.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true, name: true },
  })
  const menuItemMap = new Map(menuItems.map((m: { id: string; name: string }) => [m.id, m.name]))

  const topItemsWithNames = topItems.map((item: { menuItemId: string; _sum: { quantity: number | null } }) => ({
    name: menuItemMap.get(item.menuItemId) || "Item removido",
    quantity: item._sum.quantity || 0,
  }))

  // Build last 30 days chart data
  const dailySales = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split("T")[0]
    dailySales.set(key, 0)
  }
  for (const order of last30DaysData) {
    const key = new Date(order.createdAt).toISOString().split("T")[0]
    dailySales.set(key, (dailySales.get(key) || 0) + order.total)
  }
  const chartData = Array.from(dailySales.entries()).map(([date, total]) => ({
    date,
    total,
    label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }))
  const maxSale = Math.max(...chartData.map((d) => d.total), 1)

  const statCards = [
    {
      title: "Vendas Hoje",
      value: formatCurrency(todayOrders._sum.total || 0),
      count: `${todayOrders._count} pedidos`,
      icon: DollarSign,
      accent: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    {
      title: "Vendas Semana",
      value: formatCurrency(weekOrders._sum.total || 0),
      count: `${weekOrders._count} pedidos`,
      icon: CalendarDays,
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Vendas Mes",
      value: formatCurrency(monthOrders._sum.total || 0),
      count: `${monthOrders._count} pedidos`,
      icon: TrendingUp,
      accent: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    {
      title: "Comissao Plataforma",
      value: formatCurrency(monthCommission._sum.commissionAmount || 0),
      count: `${(restaurant.commissionRate * 100).toFixed(0)}% sobre vendas`,
      icon: Percent,
      accent: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-gray-400">
          Visao geral do seu restaurante
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              className={`border ${card.border} ${card.bg} bg-gray-900/80`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.accent}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.accent}`}>
                  {card.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{card.count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Chart - Last 30 days */}
      <Card className="border-gray-800 bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-400" />
            Vendas - Ultimos 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-40">
            {chartData.map((day) => {
              const heightPercent = maxSale > 0 ? (day.total / maxSale) * 100 : 0
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center group relative"
                >
                  <div className="w-full flex flex-col items-center justify-end h-32">
                    <div
                      className="w-full rounded-t bg-orange-500/80 hover:bg-orange-400 transition-colors min-h-[2px] relative"
                      style={{ height: `${Math.max(heightPercent, 1)}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                          <p className="text-white font-medium">
                            {formatCurrency(day.total)}
                          </p>
                          <p className="text-gray-400">{day.label}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Show label every 5 days */}
                  {chartData.indexOf(day) % 5 === 0 && (
                    <span className="text-[9px] text-gray-600 mt-1 whitespace-nowrap">
                      {day.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Last Orders */}
        <div className="lg:col-span-2">
          <Card className="border-gray-800 bg-gray-900/80">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-400" />
                Ultimos Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-3 text-left font-medium text-gray-400">
                        <div className="flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5" /> Pedido
                        </div>
                      </th>
                      <th className="pb-3 text-left font-medium text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" /> Cliente
                        </div>
                      </th>
                      <th className="pb-3 text-left font-medium text-gray-400">
                        Total
                      </th>
                      <th className="pb-3 text-left font-medium text-gray-400">
                        Status
                      </th>
                      <th className="pb-3 text-right font-medium text-gray-400">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-3.5 w-3.5" /> Quando
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {lastOrders.map((order: typeof lastOrders[number]) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-3 text-white font-medium">
                          #{String(order.orderNumber).padStart(2, "0")}
                        </td>
                        <td className="py-3 text-gray-300">
                          {order.customer.name}
                        </td>
                        <td className="py-3 text-green-400 font-medium">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs border ${getStatusColor(order.status)}`}
                          >
                            {getStatusLabel(order.status)}
                          </Badge>
                        </td>
                        <td className="py-3 text-right text-gray-500 text-xs">
                          {timeAgo(new Date(order.createdAt))}
                        </td>
                      </tr>
                    ))}
                    {lastOrders.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-gray-500"
                        >
                          Nenhum pedido encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Items */}
        <div>
          <Card className="border-gray-800 bg-gray-900/80">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Itens Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topItemsWithNames.map((item: { name: string; quantity: number }, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : index === 1
                            ? "bg-gray-400/20 text-gray-300"
                            : index === 2
                              ? "bg-orange-700/20 text-orange-400"
                              : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.name}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-300">
                      {item.quantity}x
                    </span>
                  </div>
                ))}
                {topItemsWithNames.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Nenhum item vendido ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
