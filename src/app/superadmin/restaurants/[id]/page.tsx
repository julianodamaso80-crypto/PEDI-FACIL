import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface RestaurantDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RestaurantDetailPage({
  params,
}: RestaurantDetailPageProps) {
  const { id } = await params

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      _count: { select: { orders: true, customers: true, categories: true, items: true } },
      orders: {
        select: { total: true, commissionAmount: true },
      },
    },
  })

  if (!restaurant) {
    notFound()
  }

  const totalRevenue = restaurant.orders.reduce((sum: number, o: any) => sum + o.total, 0)
  const totalCommission = restaurant.orders.reduce(
    (sum: number, o: any) => sum + o.commissionAmount,
    0
  )

  const stats = [
    {
      title: "Pedidos",
      value: restaurant._count.orders.toLocaleString("pt-BR"),
      icon: ShoppingCart,
      color: "text-blue-400",
    },
    {
      title: "Receita Total",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      title: "Comissão Total",
      value: formatCurrency(totalCommission),
      icon: TrendingUp,
      color: "text-orange-400",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/superadmin/restaurants"
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
            <Badge
              className={
                restaurant.isOpen
                  ? "bg-green-600/20 text-green-400 border-green-600/30"
                  : "bg-red-600/20 text-red-400 border-red-600/30"
              }
            >
              {restaurant.isOpen ? "Aberto" : "Fechado"}
            </Badge>
          </div>
          <p className="text-sm text-gray-400 mt-1">/{restaurant.slug}</p>
        </div>
        <a
          href={`https://${restaurant.slug}.pedefacil.com.br`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700"
        >
          <ExternalLink className="h-4 w-4" />
          Visitar Loja
        </a>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Restaurant Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Informações do Restaurante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-white">{restaurant.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-400">Telefone / WhatsApp</p>
                <p className="text-sm text-white">
                  {restaurant.phone} / {restaurant.whatsapp}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-400">Endereço</p>
                <p className="text-sm text-white">
                  {restaurant.address}, {restaurant.city} - {restaurant.state},{" "}
                  {restaurant.zipCode}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Taxa de Comissão</p>
                <p className="text-white font-medium">
                  {(restaurant.commissionRate * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-gray-400">Pedido Mínimo</p>
                <p className="text-white font-medium">
                  {formatCurrency(restaurant.minimumOrder)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Taxa de Entrega</p>
                <p className="text-white font-medium">
                  {formatCurrency(restaurant.deliveryFee)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Tempo Estimado</p>
                <p className="text-white font-medium">
                  {restaurant.estimatedTime} min
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Categorias</p>
                <p className="text-white font-medium">{restaurant._count.categories}</p>
              </div>
              <div>
                <p className="text-gray-400">Itens do Menu</p>
                <p className="text-white font-medium">{restaurant._count.items}</p>
              </div>
              <div>
                <p className="text-gray-400">Clientes</p>
                <p className="text-white font-medium">{restaurant._count.customers}</p>
              </div>
              <div>
                <p className="text-gray-400">Criado em</p>
                <p className="text-white font-medium">
                  {new Date(restaurant.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Informações do Proprietário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-400">Nome</p>
                <p className="text-sm text-white">{restaurant.owner.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-white">{restaurant.owner.email}</p>
              </div>
            </div>
            {restaurant.owner.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-400">Telefone</p>
                  <p className="text-sm text-white">{restaurant.owner.phone}</p>
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-gray-700 text-sm">
              <p className="text-gray-400">Cadastrado em</p>
              <p className="text-white font-medium">
                {new Date(restaurant.owner.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
