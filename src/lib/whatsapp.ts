// WhatsApp Business API Integration
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"
const MOCK_MODE = !process.env.WHATSAPP_TOKEN

// Generic send message function
async function sendWhatsAppMessage(to: string, message: string) {
  if (MOCK_MODE) {
    console.log(`[WhatsApp Mock] To: ${to}`)
    console.log(`[WhatsApp Mock] Message: ${message}`)
    return { success: true, mock: true }
  }

  const response = await fetch(
    `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error("WhatsApp API error:", error)
    throw new Error("Failed to send WhatsApp message")
  }

  return { success: true, mock: false }
}

// Format currency in BRL
function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

// Send order notification to the restaurant
export async function sendOrderNotification(
  restaurantWhatsapp: string,
  orderDetails: {
    orderNumber: number
    customerName: string
    total: number
    items: string
    paymentMethod: string
    orderType: string
    address?: string
  }
) {
  const {
    orderNumber,
    customerName,
    total,
    items,
    paymentMethod,
    orderType,
    address,
  } = orderDetails

  const typeLabel = orderType === "DELIVERY" ? "🛵 Entrega" : "🏪 Retirada"

  let message =
    `🔔 *Novo Pedido #${orderNumber}*\n\n` +
    `👤 Cliente: ${customerName}\n` +
    `📋 Tipo: ${typeLabel}\n` +
    `💳 Pagamento: ${paymentMethod}\n\n` +
    `📝 *Itens:*\n${items}\n\n` +
    `💰 *Total: ${formatBRL(total)}*`

  if (address) {
    message += `\n\n📍 *Endereço:*\n${address}`
  }

  return sendWhatsAppMessage(restaurantWhatsapp, message)
}

// Send order status update to the customer
export async function sendOrderStatusUpdate(
  customerPhone: string,
  status: string,
  orderNumber: number,
  restaurantName: string
) {
  const statusMessages: Record<string, string> = {
    CONFIRMED: `✅ Seu pedido #${orderNumber} foi *confirmado* pelo ${restaurantName}! Estamos preparando com carinho.`,
    PREPARING: `👨‍🍳 Seu pedido #${orderNumber} está sendo *preparado*! Já já fica pronto.`,
    READY: `🎉 Seu pedido #${orderNumber} está *pronto*! Aguardando retirada.`,
    OUT_FOR_DELIVERY: `🛵 Seu pedido #${orderNumber} *saiu para entrega*! Fique de olho na porta.`,
    DELIVERED: `✅ Pedido #${orderNumber} *entregue*! Obrigado por pedir no ${restaurantName}. Bom apetite! 🍕`,
    CANCELLED: `❌ Infelizmente, seu pedido #${orderNumber} foi *cancelado*. Entre em contato com o ${restaurantName} para mais informações.`,
  }

  const message =
    statusMessages[status] ||
    `📢 Atualização do pedido #${orderNumber}: ${status}`

  return sendWhatsAppMessage(customerPhone, message)
}

// Send reactivation message to inactive customer
export async function sendReactivationMessage(
  customerPhone: string,
  customerName: string,
  couponCode: string,
  restaurantName: string
) {
  const message =
    `Olá, ${customerName}! 👋\n\n` +
    `Sentimos sua falta no *${restaurantName}*! 😢\n\n` +
    `Preparamos um cupom especial para você voltar:\n` +
    `🎁 Use o código *${couponCode}* no seu próximo pedido!\n\n` +
    `Estamos esperando você! 🍽️`

  return sendWhatsAppMessage(customerPhone, message)
}

// Send birthday message to customer
export async function sendBirthdayMessage(
  customerPhone: string,
  customerName: string,
  offer: string,
  restaurantName: string
) {
  const message =
    `🎂 Parabéns, ${customerName}! 🎉\n\n` +
    `O *${restaurantName}* deseja um feliz aniversário! 🥳\n\n` +
    `Presente especial pra você:\n` +
    `🎁 ${offer}\n\n` +
    `Aproveite seu dia e faça um pedido especial! 🍕🎈`

  return sendWhatsAppMessage(customerPhone, message)
}

// Send order confirmation to customer
export async function sendOrderConfirmation(
  customerPhone: string,
  orderNumber: number,
  estimatedTime: number,
  restaurantName: string
) {
  const message =
    `🍕 *Pedido #${orderNumber} recebido!*\n\n` +
    `Obrigado por pedir no *${restaurantName}*!\n\n` +
    `⏱️ Tempo estimado: *${estimatedTime} minutos*\n\n` +
    `Você receberá atualizações sobre o status do seu pedido. 😊`

  return sendWhatsAppMessage(customerPhone, message)
}
