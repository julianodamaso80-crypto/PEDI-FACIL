// Mercado Pago PIX Integration
// Docs: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post

const MP_API_URL = "https://api.mercadopago.com"

interface CreatePixPaymentParams {
  amount: number
  description: string
  orderId: string
  customerEmail: string
  accessToken: string // restaurant's MP access token
}

interface PixPaymentResult {
  paymentId: string
  qrCode: string // base64 image
  qrCodeText: string // copy-paste code
  status: string
}

export async function createPixPayment(
  params: CreatePixPaymentParams
): Promise<PixPaymentResult> {
  const { amount, description, orderId, customerEmail, accessToken } = params

  const response = await fetch(`${MP_API_URL}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": orderId, // prevent duplicate payments
    },
    body: JSON.stringify({
      transaction_amount: amount,
      description,
      payment_method_id: "pix",
      payer: {
        email: customerEmail,
      },
      external_reference: orderId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/mercadopago`,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Mercado Pago error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()

  return {
    paymentId: String(data.id),
    qrCode:
      data.point_of_interaction?.transaction_data?.qr_code_base64 || "",
    qrCodeText:
      data.point_of_interaction?.transaction_data?.qr_code || "",
    status: data.status,
  }
}

export async function checkPaymentStatus(
  paymentId: string,
  accessToken: string
) {
  const response = await fetch(`${MP_API_URL}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to check payment status")
  }

  const data = await response.json()
  return {
    status: data.status as string, // "approved", "pending", "rejected", etc.
    statusDetail: data.status_detail as string,
  }
}

// Process webhook notification from Mercado Pago
export async function processWebhook(
  paymentId: string,
  accessToken: string
) {
  const payment = await checkPaymentStatus(paymentId, accessToken)
  return {
    isApproved: payment.status === "approved",
    status: payment.status,
    statusDetail: payment.statusDetail,
  }
}
