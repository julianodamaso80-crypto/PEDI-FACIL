import {
  PrismaClient,
  Role,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "" })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Iniciando seed...")

  // ==================== 1. SUPER ADMIN ====================
  const admin = await prisma.user.upsert({
    where: { email: "admin@pedefacil.com.br" },
    update: {},
    create: {
      name: "Admin PedeFácil",
      email: "admin@pedefacil.com.br",
      // TODO: Em produção, hash a senha com bcrypt
      password: "admin123",
      role: Role.SUPER_ADMIN,
    },
  })
  console.log(`✅ Super Admin criado: ${admin.email}`)

  // ==================== 2. RESTAURANT OWNER ====================
  const owner = await prisma.user.upsert({
    where: { email: "jose@pizzariadojose.com.br" },
    update: {},
    create: {
      name: "José da Silva",
      email: "jose@pizzariadojose.com.br",
      // TODO: Em produção, hash a senha com bcrypt
      password: "123456",
      role: Role.RESTAURANT_OWNER,
    },
  })
  console.log(`✅ Restaurant Owner criado: ${owner.email}`)

  // ==================== 3. RESTAURANT ====================
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "pizzariadojose" },
    update: {},
    create: {
      name: "Pizzaria do José",
      slug: "pizzariadojose",
      description:
        "A melhor pizzaria da cidade! Pizzas artesanais com ingredientes selecionados.",
      phone: "11999999999",
      whatsapp: "5511999999999",
      email: "contato@pizzariadojose.com.br",
      address: "Rua das Flores, 123 - Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01001-000",
      primaryColor: "#FF6B00",
      secondaryColor: "#1A1A2E",
      deliveryFee: 5.99,
      minimumOrder: 30,
      estimatedTime: 45,
      acceptsPix: true,
      acceptsCard: true,
      acceptsCash: true,
      commissionRate: 0.07,
      openingHours: {
        monday: { open: "18:00", close: "23:00" },
        tuesday: { open: "18:00", close: "23:00" },
        wednesday: { open: "18:00", close: "23:00" },
        thursday: { open: "18:00", close: "23:00" },
        friday: { open: "18:00", close: "23:00" },
        saturday: { open: "18:00", close: "23:00" },
        sunday: { open: "18:00", close: "22:00" },
      },
      ownerId: owner.id,
    },
  })
  console.log(`✅ Restaurante criado: ${restaurant.name}`)

  // ==================== 4. MENU CATEGORIES & ITEMS ====================

  // Helper para criar categoria + itens
  async function createCategory(
    name: string,
    sortOrder: number,
    items: Array<{
      name: string
      description: string
      price: number
      isPopular?: boolean
      sizes?: object
      extras?: object
      sortOrder: number
    }>
  ) {
    const category = await prisma.menuCategory.create({
      data: {
        name,
        sortOrder,
        restaurantId: restaurant.id,
      },
    })

    const createdItems = []
    for (const item of items) {
      const created = await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          isPopular: item.isPopular ?? false,
          sizes: item.sizes ?? undefined,
          extras: item.extras ?? undefined,
          sortOrder: item.sortOrder,
          categoryId: category.id,
          restaurantId: restaurant.id,
        },
      })
      createdItems.push(created)
    }

    return { category, items: createdItems }
  }

  const pizzaSizes = [
    { name: "P", price: 29.9 },
    { name: "M", price: 39.9 },
    { name: "G", price: 49.9 },
  ]

  const pizzaEspecialSizes = [
    { name: "P", price: 35.9 },
    { name: "M", price: 45.9 },
    { name: "G", price: 59.9 },
  ]

  const pizzaDoceSizes = [
    { name: "P", price: 29.9 },
    { name: "M", price: 39.9 },
    { name: "G", price: 49.9 },
  ]

  const pizzaExtras = [
    { name: "Borda recheada", price: 8.0 },
    { name: "Queijo extra", price: 5.0 },
  ]

  // Pizzas Tradicionais
  const tradicionais = await createCategory("Pizzas Tradicionais", 1, [
    {
      name: "Margherita",
      description:
        "Molho de tomate, mussarela, manjericão fresco e azeite de oliva",
      price: 39.9,
      isPopular: true,
      sizes: pizzaSizes,
      extras: pizzaExtras,
      sortOrder: 1,
    },
    {
      name: "Calabresa",
      description: "Calabresa fatiada, cebola e mussarela",
      price: 39.9,
      isPopular: true,
      sizes: pizzaSizes,
      extras: pizzaExtras,
      sortOrder: 2,
    },
    {
      name: "Portuguesa",
      description:
        "Presunto, ovos, cebola, ervilha, azeitona e mussarela",
      price: 42.9,
      isPopular: false,
      sizes: pizzaSizes,
      extras: pizzaExtras,
      sortOrder: 3,
    },
    {
      name: "Quatro Queijos",
      description: "Mussarela, provolone, parmesão e gorgonzola",
      price: 44.9,
      isPopular: true,
      sizes: pizzaSizes,
      extras: pizzaExtras,
      sortOrder: 4,
    },
  ])

  // Pizzas Especiais
  const especiais = await createCategory("Pizzas Especiais", 2, [
    {
      name: "Frango com Catupiry",
      description: "Frango desfiado com catupiry original e milho",
      price: 45.9,
      isPopular: true,
      sizes: pizzaEspecialSizes,
      extras: pizzaExtras,
      sortOrder: 1,
    },
    {
      name: "Lombo Canadense",
      description: "Lombo canadense, mussarela e catupiry",
      price: 48.9,
      isPopular: false,
      sizes: pizzaEspecialSizes,
      extras: pizzaExtras,
      sortOrder: 2,
    },
    {
      name: "Camarão",
      description:
        "Camarões salteados no azeite, alho, tomate cereja e rúcula",
      price: 59.9,
      isPopular: false,
      sizes: [
        { name: "P", price: 35.9 },
        { name: "M", price: 49.9 },
        { name: "G", price: 65.9 },
      ],
      extras: pizzaExtras,
      sortOrder: 3,
    },
    {
      name: "Pepperoni",
      description: "Pepperoni importado com mussarela e orégano",
      price: 46.9,
      isPopular: true,
      sizes: pizzaEspecialSizes,
      extras: pizzaExtras,
      sortOrder: 4,
    },
  ])

  // Pizzas Doces
  const doces = await createCategory("Pizzas Doces", 3, [
    {
      name: "Chocolate com Morango",
      description: "Chocolate ao leite com morangos frescos e granulado",
      price: 39.9,
      isPopular: true,
      sizes: pizzaDoceSizes,
      sortOrder: 1,
    },
    {
      name: "Romeu e Julieta",
      description: "Goiabada cremosa com queijo minas derretido",
      price: 37.9,
      isPopular: false,
      sizes: pizzaDoceSizes,
      sortOrder: 2,
    },
    {
      name: "Banana com Canela",
      description: "Banana caramelizada, canela e leite condensado",
      price: 35.9,
      isPopular: false,
      sizes: pizzaDoceSizes,
      sortOrder: 3,
    },
  ])

  // Bebidas
  const bebidas = await createCategory("Bebidas", 4, [
    {
      name: "Coca-Cola 2L",
      description: "Refrigerante Coca-Cola 2 litros",
      price: 14.9,
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: "Guaraná 2L",
      description: "Refrigerante Guaraná Antarctica 2 litros",
      price: 12.9,
      isPopular: false,
      sortOrder: 2,
    },
    {
      name: "Suco de Laranja",
      description: "Suco de laranja natural 500ml",
      price: 9.9,
      isPopular: false,
      sortOrder: 3,
    },
    {
      name: "Água Mineral",
      description: "Água mineral sem gás 500ml",
      price: 4.9,
      isPopular: false,
      sortOrder: 4,
    },
    {
      name: "Cerveja Heineken 600ml",
      description: "Cerveja Heineken long neck 600ml",
      price: 16.9,
      isPopular: true,
      sortOrder: 5,
    },
  ])

  // Porções
  const porcoes = await createCategory("Porções", 5, [
    {
      name: "Batata Frita",
      description: "Porção de batata frita crocante com cheddar e bacon",
      price: 28.9,
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: "Bolinho de Bacalhau",
      description: "12 unidades de bolinho de bacalhau artesanal",
      price: 34.9,
      isPopular: false,
      sortOrder: 2,
    },
    {
      name: "Isca de Frango",
      description: "Porção de iscas de frango empanadas com molho especial",
      price: 29.9,
      isPopular: false,
      sortOrder: 3,
    },
    {
      name: "Pão de Alho",
      description: "Pão de alho gratinado com queijo (6 unidades)",
      price: 18.9,
      isPopular: false,
      sortOrder: 4,
    },
  ])

  // Coletar todos os itens do menu para uso nos pedidos
  const allMenuItems = [
    ...tradicionais.items,
    ...especiais.items,
    ...doces.items,
    ...bebidas.items,
    ...porcoes.items,
  ]

  console.log(
    `✅ ${5} categorias e ${allMenuItems.length} itens de menu criados`
  )

  // ==================== 5. CUSTOMERS ====================
  const customersData = [
    {
      name: "Maria Oliveira",
      phone: "11987654321",
      email: "maria@email.com",
      address: "Rua Augusta, 500 - Consolação, São Paulo",
      birthday: new Date("1990-03-15"),
      loyaltyPoints: 85,
      totalOrders: 12,
      totalSpent: 520.5,
    },
    {
      name: "Carlos Santos",
      phone: "11976543210",
      email: "carlos@email.com",
      address: "Av. Paulista, 1000 - Bela Vista, São Paulo",
      birthday: new Date("1985-07-22"),
      loyaltyPoints: 150,
      totalOrders: 20,
      totalSpent: 980.0,
    },
    {
      name: "Ana Souza",
      phone: "11965432109",
      email: "ana@email.com",
      address: "Rua Oscar Freire, 300 - Jardins, São Paulo",
      birthday: null,
      loyaltyPoints: 30,
      totalOrders: 5,
      totalSpent: 210.8,
    },
    {
      name: "Pedro Lima",
      phone: "11954321098",
      email: null,
      address: "Rua da Consolação, 800 - Centro, São Paulo",
      birthday: new Date("1992-11-05"),
      loyaltyPoints: 200,
      totalOrders: 25,
      totalSpent: 1350.0,
    },
    {
      name: "Fernanda Costa",
      phone: "11943210987",
      email: "fernanda@email.com",
      address: "Rua Haddock Lobo, 150 - Cerqueira César, São Paulo",
      birthday: null,
      loyaltyPoints: 60,
      totalOrders: 8,
      totalSpent: 390.0,
    },
    {
      name: "Lucas Pereira",
      phone: "11932109876",
      email: null,
      address: "Av. Brigadeiro Faria Lima, 2000 - Pinheiros, São Paulo",
      birthday: new Date("1988-01-30"),
      loyaltyPoints: 120,
      totalOrders: 15,
      totalSpent: 720.5,
    },
    {
      name: "Juliana Almeida",
      phone: "11921098765",
      email: "juliana@email.com",
      address: "Rua dos Pinheiros, 600 - Pinheiros, São Paulo",
      birthday: null,
      loyaltyPoints: 45,
      totalOrders: 6,
      totalSpent: 280.0,
    },
    {
      name: "Rafael Mendes",
      phone: "11910987654",
      email: "rafael@email.com",
      address: "Rua Bela Cintra, 400 - Jardins, São Paulo",
      birthday: new Date("1995-09-12"),
      loyaltyPoints: 10,
      totalOrders: 2,
      totalSpent: 95.0,
    },
    {
      name: "Beatriz Rocha",
      phone: "11909876543",
      email: null,
      address: "Av. Rebouças, 1200 - Pinheiros, São Paulo",
      birthday: new Date("1993-06-18"),
      loyaltyPoints: 175,
      totalOrders: 22,
      totalSpent: 1100.0,
    },
    {
      name: "Thiago Ferreira",
      phone: "11998765432",
      email: "thiago@email.com",
      address: "Rua Teodoro Sampaio, 700 - Pinheiros, São Paulo",
      birthday: null,
      loyaltyPoints: 55,
      totalOrders: 7,
      totalSpent: 340.0,
    },
  ]

  const customers = []
  for (const data of customersData) {
    const customer = await prisma.customer.upsert({
      where: {
        phone_restaurantId: {
          phone: data.phone,
          restaurantId: restaurant.id,
        },
      },
      update: {},
      create: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        birthday: data.birthday,
        loyaltyPoints: data.loyaltyPoints,
        totalOrders: data.totalOrders,
        totalSpent: data.totalSpent,
        lastOrderAt: new Date(
          Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
        ),
        restaurantId: restaurant.id,
      },
    })
    customers.push(customer)
  }
  console.log(`✅ ${customers.length} clientes criados`)

  // ==================== 6. ORDERS ====================
  const statuses: OrderStatus[] = [
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.PREPARING,
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.READY,
    OrderStatus.CANCELLED,
  ]

  const paymentMethods: PaymentMethod[] = [
    PaymentMethod.PIX,
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.CASH,
    PaymentMethod.DEBIT_CARD,
  ]

  // Verificar se já existem pedidos para este restaurante
  const existingOrders = await prisma.order.count({
    where: { restaurantId: restaurant.id },
  })

  if (existingOrders === 0) {
    for (let i = 1; i <= 30; i++) {
      const customer = customers[i % customers.length]
      const status = statuses[i % statuses.length]
      const paymentMethod = paymentMethods[i % paymentMethods.length]
      const daysAgo = 30 - i
      const orderDate = new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000
      )

      // Determinar paymentStatus baseado no status do pedido
      let paymentStatus: PaymentStatus
      if (status === OrderStatus.CANCELLED) {
        paymentStatus = PaymentStatus.REFUNDED
      } else if (
        status === OrderStatus.PENDING ||
        (status === OrderStatus.CONFIRMED && paymentMethod === PaymentMethod.CASH)
      ) {
        paymentStatus = PaymentStatus.PENDING
      } else {
        paymentStatus = PaymentStatus.PAID
      }

      // Selecionar 1-4 itens aleatórios do menu
      const numItems = 1 + Math.floor(Math.random() * 4)
      const selectedItems: Array<{
        menuItem: (typeof allMenuItems)[0]
        quantity: number
        size: string | null
        extras: object | null
      }> = []

      for (let j = 0; j < numItems; j++) {
        const menuItem =
          allMenuItems[Math.floor(Math.random() * allMenuItems.length)]
        const quantity = 1 + Math.floor(Math.random() * 3)

        // Determinar tamanho se for pizza
        let size: string | null = null
        if (
          menuItem.categoryId === tradicionais.category.id ||
          menuItem.categoryId === especiais.category.id ||
          menuItem.categoryId === doces.category.id
        ) {
          const sizes = ["P", "M", "G"]
          size = sizes[Math.floor(Math.random() * sizes.length)]
        }

        // Adicionar extras aleatoriamente para pizzas
        let extras: object | null = null
        if (size && Math.random() > 0.6) {
          extras = [{ name: "Borda recheada", price: 8.0 }]
        }

        selectedItems.push({ menuItem, quantity, size, extras })
      }

      // Calcular subtotal
      let subtotal = 0
      const orderItemsData = selectedItems.map((item) => {
        let unitPrice = item.menuItem.price
        // Ajustar preço por tamanho
        if (item.size === "P") unitPrice = unitPrice * 0.75
        if (item.size === "G") unitPrice = unitPrice * 1.25

        let extraTotal = 0
        if (item.extras) {
          extraTotal = (item.extras as Array<{ price: number }>).reduce(
            (sum, e) => sum + e.price,
            0
          )
        }

        const totalPrice =
          (unitPrice + extraTotal) * item.quantity
        subtotal += totalPrice

        return {
          menuItem: { connect: { id: item.menuItem.id } },
          quantity: item.quantity,
          unitPrice: parseFloat(unitPrice.toFixed(2)),
          totalPrice: parseFloat(totalPrice.toFixed(2)),
          size: item.size,
          extras: item.extras ?? undefined,
          notes: null,
        }
      })

      subtotal = parseFloat(subtotal.toFixed(2))
      const deliveryFee = 5.99
      const total = parseFloat((subtotal + deliveryFee).toFixed(2))
      const commissionAmount = parseFloat((total * 0.07).toFixed(2))

      await prisma.order.create({
        data: {
          orderNumber: i,
          status,
          type: OrderType.DELIVERY,
          subtotal,
          deliveryFee,
          discount: 0,
          total,
          commissionAmount,
          paymentMethod,
          paymentStatus,
          deliveryAddress: customer.address ?? "Endereço não informado",
          estimatedTime: 45,
          customerId: customer.id,
          restaurantId: restaurant.id,
          createdAt: orderDate,
          items: {
            create: orderItemsData,
          },
        },
      })
    }
    console.log(`✅ 30 pedidos criados`)
  } else {
    console.log(
      `⏭️  Pedidos já existem (${existingOrders}), pulando criação`
    )
  }

  // ==================== 7. LOYALTY CONFIG ====================
  await prisma.loyaltyConfig.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      isActive: true,
      pointsPerReal: 1,
      rewardThreshold: 100,
      rewardType: "DISCOUNT_PERCENT",
      rewardValue: 10,
      restaurantId: restaurant.id,
    },
  })
  console.log(`✅ Configuração de fidelidade criada`)

  // ==================== RESUMO ====================
  console.log("\n📊 Resumo do seed:")
  console.log("  - 1 Super Admin")
  console.log("  - 1 Restaurant Owner")
  console.log("  - 1 Restaurante (Pizzaria do José)")
  console.log("  - 5 Categorias de menu")
  console.log("  - 20 Itens de menu")
  console.log("  - 10 Clientes")
  console.log("  - 30 Pedidos com itens")
  console.log("  - 1 Configuração de fidelidade")
  console.log("\n🎉 Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
