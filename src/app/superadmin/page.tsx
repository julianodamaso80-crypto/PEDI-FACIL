import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Store,
  ShoppingCart,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

export default async function SuperAdminDashboard() {
  // Fetch platform-wide stats
  const [
    totalRestaurants,
    totalOrders,
    revenueAgg,
    commissionAgg,
    recentRestaurants,
    monthlyStats,
  ] = await Promise.all([
    prisma.restaurant.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.aggregate({ _sum: { commissionAmount: true } }),
    prisma.restaurant.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: { total: true },
        },
      },
    }),
    // Monthly stats: orders in last 6 months
    prisma.$queryRaw<
      { month: string; orders: bigint; revenue: number }[]
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*)::bigint as orders,
        COALESCE(SUM("total"), 0) as revenue
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `,
  ])

  const totalRevenue = revenueAgg._sum.total ?? 0
  const totalCommission = commissionAgg._sum.commissionAmount ?? 0

  const stats = [
    {
      title: "Restaurantes",
      value: totalRestaurants.toString(),
      icon: Store,
      color: "text-blue-400",
    },
    {
      title: "Pedidos Totais",
      value: totalOrders.toLocaleString("pt-BR"),
      icon: ShoppingCart,
      color: "text-green-400",
    },
    {
      title: "Receita Total",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-yellow-400",
    },
    {
      title: "Comissões",
      value: formatCurrency(totalCommission),
      icon: TrendingUp,
      color: "text-orange-400",
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Restaurants */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Restaurantes Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/50">
                <TableHead className="text-gray-400">Nome</TableHead>
                <TableHead className="text-gray-400">Slug</TableHead>
                <TableHead className="text-gray-400">Pedidos</TableHead>
                <TableHead className="text-gray-400">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRestaurants.map((restaurant: any) => {
                const revenue = restaurant.orders.reduce(
                  (sum: number, o: any) => sum + o.total,
                  0
                )
                return (
                  <TableRow
                    key={restaurant.id}
                    className="border-gray-700 hover:bg-gray-700/50"
                  >
                    <TableCell className="text-white font-medium">
                      <Link
                        href={`/superadmin/restaurants/${restaurant.id}`}
                        className="hover:text-orange-400 transition-colors"
                      >
                        {restaurant.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {restaurant.slug}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {restaurant._count.orders}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatCurrency(revenue)}
                    </TableCell>
                  </TableRow>
                )
              })}
              {recentRestaurants.length === 0 && (
                <TableRow className="border-gray-700">
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-8"
                  >
                    Nenhum restaurante cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Crescimento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/50">
                <TableHead className="text-gray-400">Mês</TableHead>
                <TableHead className="text-gray-400">Pedidos</TableHead>
                <TableHead className="text-gray-400">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyStats.map((stat: any) => (
                <TableRow
                  key={stat.month}
                  className="border-gray-700 hover:bg-gray-700/50"
                >
                  <TableCell className="text-white font-medium">
                    {stat.month}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {Number(stat.orders).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {formatCurrency(Number(stat.revenue))}
                  </TableCell>
                </TableRow>
              ))}
              {monthlyStats.length === 0 && (
                <TableRow className="border-gray-700">
                  <TableCell
                    colSpan={3}
                    className="text-center text-gray-500 py-8"
                  >
                    Sem dados ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
