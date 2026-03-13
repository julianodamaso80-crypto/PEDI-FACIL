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
import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function RestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true } },
      _count: { select: { orders: true } },
      orders: {
        select: { total: true, commissionAmount: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Restaurantes</h1>
        <Link
          href="/superadmin/restaurants/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Criar Restaurante
        </Link>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/50">
                <TableHead className="text-gray-400">Nome</TableHead>
                <TableHead className="text-gray-400">Slug</TableHead>
                <TableHead className="text-gray-400">Email do Dono</TableHead>
                <TableHead className="text-gray-400">Pedidos</TableHead>
                <TableHead className="text-gray-400">Receita</TableHead>
                <TableHead className="text-gray-400">Comissão</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.map((restaurant: any) => {
                const totalRevenue = restaurant.orders.reduce(
                  (sum: number, o: any) => sum + o.total,
                  0
                )
                const totalCommission = restaurant.orders.reduce(
                  (sum: number, o: any) => sum + o.commissionAmount,
                  0
                )
                return (
                  <TableRow
                    key={restaurant.id}
                    className="border-gray-700 hover:bg-gray-700/50"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/superadmin/restaurants/${restaurant.id}`}
                        className="text-white hover:text-orange-400 transition-colors"
                      >
                        {restaurant.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {restaurant.slug}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {restaurant.owner.email}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {restaurant._count.orders}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatCurrency(totalRevenue)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatCurrency(totalCommission)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          restaurant.isOpen
                            ? "bg-green-600/20 text-green-400 border-green-600/30"
                            : "bg-red-600/20 text-red-400 border-red-600/30"
                        }
                      >
                        {restaurant.isOpen ? "Aberto" : "Fechado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(restaurant.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                )
              })}
              {restaurants.length === 0 && (
                <TableRow className="border-gray-700">
                  <TableCell
                    colSpan={8}
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
    </div>
  )
}
