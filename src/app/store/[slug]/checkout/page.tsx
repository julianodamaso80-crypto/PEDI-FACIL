"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  MapPin,
  ShoppingBag,
  Loader2,
} from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useRestaurant } from "@/contexts/restaurant-context"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

const checkoutSchema = z
  .object({
    name: z.string().min(2, "Nome é obrigatório"),
    phone: z.string().min(14, "Telefone inválido"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    orderType: z.enum(["DELIVERY", "PICKUP"]),
    address: z.string().optional(),
    complement: z.string().optional(),
    reference: z.string().optional(),
    paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),
    changeFor: z.number().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.orderType === "DELIVERY") {
        return !!data.address && data.address.trim().length > 0
      }
      return true
    },
    {
      message: "Endereço é obrigatório para entrega",
      path: ["address"],
    }
  )

type CheckoutFormValues = z.infer<typeof checkoutSchema>

function formatPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 7)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { cart, clearCart } = useCart()
  const restaurant = useRestaurant()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      orderType: "DELIVERY",
      address: "",
      complement: "",
      reference: "",
      paymentMethod: "PIX",
      notes: "",
    },
  })

  const orderType = watch("orderType")
  const paymentMethod = watch("paymentMethod")

  // Redirect if cart is empty
  if (cart.items.length === 0) {
    if (typeof window !== "undefined") {
      router.replace(`/store/${slug}`)
    }
    return null
  }

  const deliveryFee = orderType === "DELIVERY" ? restaurant.deliveryFee : 0
  const subtotal = cart.subtotal
  const discount = cart.discount
  const total = subtotal + deliveryFee - discount

  async function onSubmit(data: CheckoutFormValues) {
    setIsSubmitting(true)

    try {
      const payload = {
        slug,
        customer: {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
        },
        orderType: data.orderType,
        deliveryAddress:
          data.orderType === "DELIVERY"
            ? [data.address, data.complement, data.reference]
                .filter(Boolean)
                .join(" - ")
            : undefined,
        deliveryNotes: data.notes || undefined,
        paymentMethod: data.paymentMethod,
        changeFor:
          data.paymentMethod === "CASH" ? data.changeFor : undefined,
        couponCode: cart.couponCode || undefined,
        items: cart.items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          unitPrice: item.selectedSize
            ? item.selectedSize.price
            : item.menuItem.price,
          totalPrice: item.totalPrice,
          notes: item.notes || undefined,
          extras:
            item.selectedExtras.length > 0
              ? item.selectedExtras
              : undefined,
          size: item.selectedSize?.name || undefined,
        })),
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar pedido")
      }

      const result = await response.json()
      clearCart()
      router.push(`/store/${slug}/order/${result.id}`)
    } catch (error) {
      toast({
        title: "Erro ao enviar pedido",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente em instantes",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentMethods = [
    {
      value: "PIX" as const,
      label: "PIX",
      icon: QrCode,
      show: restaurant.acceptsPix,
    },
    {
      value: "CREDIT_CARD" as const,
      label: "Crédito",
      icon: CreditCard,
      show: restaurant.acceptsCard,
    },
    {
      value: "DEBIT_CARD" as const,
      label: "Débito",
      icon: Smartphone,
      show: restaurant.acceptsCard,
    },
    {
      value: "CASH" as const,
      label: "Dinheiro",
      icon: Banknote,
      show: restaurant.acceptsCash,
    },
  ].filter((m) => m.show)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Finalizar Pedido</h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-32 lg:pb-6 lg:grid lg:grid-cols-5 lg:gap-8 lg:space-y-0"
      >
        {/* Form Fields */}
        <div className="space-y-6 lg:col-span-3">
          {/* Personal Data */}
          <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-base">Dados pessoais</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                {...register("phone", {
                  onChange: (e) => {
                    const formatted = formatPhoneMask(e.target.value)
                    setValue("phone", formatted, { shouldValidate: true })
                  },
                })}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
          </section>

          {/* Order Type */}
          <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-base">Tipo de pedido</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue("orderType", "DELIVERY")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  orderType === "DELIVERY"
                    ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)]/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <MapPin
                  className={cn(
                    "w-6 h-6",
                    orderType === "DELIVERY"
                      ? "text-[var(--restaurant-primary)]"
                      : "text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    orderType === "DELIVERY"
                      ? "text-[var(--restaurant-primary)]"
                      : "text-gray-600"
                  )}
                >
                  Entrega
                </span>
              </button>

              <button
                type="button"
                onClick={() => setValue("orderType", "PICKUP")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  orderType === "PICKUP"
                    ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)]/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <ShoppingBag
                  className={cn(
                    "w-6 h-6",
                    orderType === "PICKUP"
                      ? "text-[var(--restaurant-primary)]"
                      : "text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    orderType === "PICKUP"
                      ? "text-[var(--restaurant-primary)]"
                      : "text-gray-600"
                  )}
                >
                  Retirada
                </span>
              </button>
            </div>

            {/* Delivery Address */}
            {orderType === "DELIVERY" && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço completo *</Label>
                  <Input
                    id="address"
                    placeholder="Rua, número, bairro"
                    {...register("address")}
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    placeholder="Apto, bloco, etc."
                    {...register("complement")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Referência</Label>
                  <Input
                    id="reference"
                    placeholder="Ponto de referência"
                    {...register("reference")}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-base">Forma de pagamento</h2>

            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setValue("paymentMethod", method.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      paymentMethod === method.value
                        ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)]/5"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-6 h-6",
                        paymentMethod === method.value
                          ? "text-[var(--restaurant-primary)]"
                          : "text-gray-400"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        paymentMethod === method.value
                          ? "text-[var(--restaurant-primary)]"
                          : "text-gray-600"
                      )}
                    >
                      {method.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {paymentMethod === "CASH" && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="changeFor">
                  Precisa de troco para quanto?
                </Label>
                <Input
                  id="changeFor"
                  type="number"
                  step="0.01"
                  min={total}
                  placeholder="Ex: 50.00"
                  {...register("changeFor", { valueAsNumber: true })}
                />
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-base">Observações</h2>
            <Textarea
              placeholder="Alguma observação sobre o pedido?"
              rows={3}
              {...register("notes")}
            />
          </section>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4 lg:sticky lg:top-20">
            <h2 className="font-semibold text-base">Resumo do pedido</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.quantity}x {item.menuItem.name}
                    </p>
                    {item.selectedSize && (
                      <p className="text-xs text-gray-500">
                        {item.selectedSize.name}
                      </p>
                    )}
                    {item.selectedExtras.length > 0 && (
                      <p className="text-xs text-gray-500">
                        + {item.selectedExtras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa de entrega</span>
                <span>
                  {orderType === "PICKUP"
                    ? "Grátis"
                    : deliveryFee > 0
                      ? formatCurrency(deliveryFee)
                      : "Grátis"}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatCurrency(Math.max(total, 0))}</span>
              </div>
            </div>

            {/* Desktop Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full hidden lg:flex text-white font-semibold py-6"
              style={{ backgroundColor: restaurant.primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                `Confirmar Pedido - ${formatCurrency(Math.max(total, 0))}`
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 lg:hidden">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-white font-semibold py-6"
            style={{ backgroundColor: restaurant.primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              `Confirmar Pedido - ${formatCurrency(Math.max(total, 0))}`
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
