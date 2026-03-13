import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DollarSign } from "lucide-react"

interface CommissionsPageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function CommissionsPage({
  searchParams,
}: CommissionsPageProps) {
  const { period = "this-month" } = await searchParams

  // Calculate date range
  const now = new Date()
  let startDate: Date
  let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  switch (period) {
    case "last-month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      break
    case "this-month":
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
  }

  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      commissionRate: true,
      orders: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          total: true,
          commissionAmount: true,
        },
      },
      _count: {
        select: {
          orders: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const report = restaurants.map((r: any) => ({
    id: r.id,
    name: r.name,
    commissionRate: r.commissionRate,
    ordersCount: r._count.orders,
    totalRevenue: r.orders.reduce((sum: number, o: any) => sum + o.total, 0),
    totalCommission: r.orders.reduce((sum: number, o: any) => sum + o.commissionAmount, 0),
  }))

  const totals = report.reduce(
    (acc: any, r: any) => ({
      orders: acc.orders + r.ordersCount,
      revenue: acc.revenue + r.totalRevenue,
      commission: acc.commission + r.totalCommission,
    }),
    { orders: 0, revenue: 0, commission: 0 }
  )

  const periodLabel = period === "last-month" ? "Mês Passado" : "Este Mês"
  const periodMonth =
    period === "last-month"
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString(
          "pt-BR",
          { month: "long", year: "numeric" }
        )
      : now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comissões</h1>
          <p className="text-sm text-gray-400 mt-1 capitalize">{periodMonth}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/superadmin/commissions?period=this-month"
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              period === "this-month" || !period
                ? "bg-orange-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Este Mês
          </a>
          <a
            href="/superadmin/commissions?period=last-month"
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              period === "last-month"
                ? "bg-orange-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Mês Passado
          </a>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            Total de Comissões - {periodLabel}
          </CardTitle>
          <DollarSign className="h-5 w-5 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(totals.commission)}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            De {totals.orders} pedidos com receita total de{" "}
            {formatCurrency(totals.revenue)}
          </p>
        </CardContent>
      </Card>

      {/* Commission Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/50">
                <TableHead className="text-gray-400">Restaurante</TableHead>
                <TableHead className="text-gray-400 text-right">Pedidos</TableHead>
                <TableHead className="text-gray-400 text-right">Receita</TableHead>
                <TableHead className="text-gray-400 text-right">Taxa</TableHead>
                <TableHead className="text-gray-400 text-right">Comissão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.map((r: any) => (
                <TableRow
                  key={r.id}
                  className="border-gray-700 hover:bg-gray-700/50"
                >
                  <TableCell className="text-white font-medium">
                    {r.name}
                  </TableCell>
                  <TableCell className="text-gray-300 text-right">
                    {r.ordersCount}
                  </TableCell>
                  <TableCell className="text-gray-300 text-right">
                    {formatCurrency(r.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-gray-300 text-right">
                    {(r.commissionRate * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-white font-medium text-right">
                    {formatCurrency(r.totalCommission)}
                  </TableCell>
                </TableRow>
              ))}
              {report.length === 0 && (
                <TableRow className="border-gray-700">
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-8"
                  >
                    Nenhum dado para o período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {report.length > 0 && (
              <TableFooter className="bg-gray-800/50 border-gray-700">
                <TableRow className="border-gray-700 hover:bg-gray-700/50">
                  <TableCell className="text-white font-bold">Total</TableCell>
                  <TableCell className="text-white font-bold text-right">
                    {totals.orders}
                  </TableCell>
                  <TableCell className="text-white font-bold text-right">
                    {formatCurrency(totals.revenue)}
                  </TableCell>
                  <TableCell className="text-gray-400 text-right">-</TableCell>
                  <TableCell className="text-orange-400 font-bold text-right">
                    {formatCurrency(totals.commission)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
