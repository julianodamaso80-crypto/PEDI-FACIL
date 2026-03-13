"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Store,
  Palette,
  Clock,
  Truck,
  CreditCard,
  Info,
  Save,
  Globe,
} from "lucide-react"

// ==================== TYPES ====================

interface OpeningHours {
  [key: string]: { open: string; close: string; closed?: boolean }
}

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  bannerImage: string | null
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  isOpen: boolean
  openingHours: OpeningHours
  minimumOrder: number
  deliveryFee: number
  deliveryRadius: number
  estimatedTime: number
  acceptsPix: boolean
  acceptsCard: boolean
  acceptsCash: boolean
  primaryColor: string
  secondaryColor: string
  mpAccessToken: string | null
  commissionRate: number
}

interface SettingsPanelProps {
  initialData: Restaurant
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terca-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sabado" },
  { key: "sunday", label: "Domingo" },
]

// ==================== COMPONENT ====================

export function SettingsPanel({ initialData }: SettingsPanelProps) {
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState("")

  // ---- Restaurant Info Form ----
  const infoForm = useForm({
    defaultValues: {
      name: initialData.name,
      description: initialData.description || "",
      phone: initialData.phone,
      whatsapp: initialData.whatsapp,
      email: initialData.email,
      address: initialData.address,
      city: initialData.city,
      state: initialData.state,
      zipCode: initialData.zipCode,
    },
  })

  // ---- Appearance Form ----
  const appearanceForm = useForm({
    defaultValues: {
      logo: initialData.logo || "",
      bannerImage: initialData.bannerImage || "",
      primaryColor: initialData.primaryColor,
      secondaryColor: initialData.secondaryColor,
    },
  })

  // ---- Opening Hours ----
  const hours = (initialData.openingHours || {}) as OpeningHours
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day.key] = {
        open: hours[day.key]?.open || "08:00",
        close: hours[day.key]?.close || "22:00",
        closed: hours[day.key]?.closed || false,
      }
      return acc
    }, {} as OpeningHours)
  )

  // ---- Delivery Form ----
  const deliveryForm = useForm({
    defaultValues: {
      deliveryFee: initialData.deliveryFee,
      deliveryRadius: initialData.deliveryRadius,
      minimumOrder: initialData.minimumOrder,
      estimatedTime: initialData.estimatedTime,
    },
  })

  // ---- Payment Form ----
  const [mpAccessToken, setMpAccessToken] = useState(
    initialData.mpAccessToken || ""
  )
  const [acceptsPix, setAcceptsPix] = useState(initialData.acceptsPix)
  const [acceptsCard, setAcceptsCard] = useState(initialData.acceptsCard)
  const [acceptsCash, setAcceptsCash] = useState(initialData.acceptsCash)

  // ---- Save handler ----
  const saveSection = async (data: Record<string, unknown>) => {
    setSaving(true)
    setSavedMessage("")
    try {
      const res = await fetch("/api/restaurant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initialData.id, ...data }),
      })
      if (!res.ok) throw new Error("Erro ao salvar")
      setSavedMessage("Salvo com sucesso!")
      setTimeout(() => setSavedMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setSavedMessage("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const watchPrimary = appearanceForm.watch("primaryColor")
  const watchSecondary = appearanceForm.watch("secondaryColor")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-orange-400" />
            Configuracoes
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gerencie as configuracoes do seu restaurante
          </p>
        </div>
        {savedMessage && (
          <span
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-lg",
              savedMessage.includes("Erro")
                ? "text-red-400 bg-red-500/10"
                : "text-green-400 bg-green-500/10"
            )}
          >
            {savedMessage}
          </span>
        )}
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="bg-gray-900 border border-gray-800 p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="info"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 gap-1.5"
          >
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Dados</span>
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 gap-1.5"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Aparencia</span>
          </TabsTrigger>
          <TabsTrigger
            value="hours"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Horarios</span>
          </TabsTrigger>
          <TabsTrigger
            value="delivery"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 gap-1.5"
          >
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Entrega</span>
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 gap-1.5"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================== Dados do Restaurante ==================== */}
        <TabsContent value="info">
          <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-400" />
              Dados do Restaurante
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-gray-300">Nome</Label>
                <Input
                  {...infoForm.register("name")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-gray-300">Descricao</Label>
                <Textarea
                  {...infoForm.register("description")}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Telefone</Label>
                <Input
                  {...infoForm.register("phone")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">WhatsApp</Label>
                <Input
                  {...infoForm.register("whatsapp")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-gray-300">Email</Label>
                <Input
                  type="email"
                  {...infoForm.register("email")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-gray-300">Endereco</Label>
                <Input
                  {...infoForm.register("address")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Cidade</Label>
                <Input
                  {...infoForm.register("city")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Estado</Label>
                <Input
                  {...infoForm.register("state")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">CEP</Label>
                <Input
                  {...infoForm.register("zipCode")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <Button
              onClick={infoForm.handleSubmit((data) => saveSection(data))}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Dados"}
            </Button>
          </div>
        </TabsContent>

        {/* ==================== Aparencia ==================== */}
        <TabsContent value="appearance">
          <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-orange-400" />
              Aparencia
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-gray-300">URL do Logo</Label>
                <Input
                  {...appearanceForm.register("logo")}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-gray-300">URL do Banner</Label>
                <Input
                  {...appearanceForm.register("bannerImage")}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Cor Primaria</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    {...appearanceForm.register("primaryColor")}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <Input
                    {...appearanceForm.register("primaryColor")}
                    className="bg-gray-800 border-gray-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Cor Secundaria</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    {...appearanceForm.register("secondaryColor")}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <Input
                    {...appearanceForm.register("secondaryColor")}
                    className="bg-gray-800 border-gray-700 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                Preview
              </Label>
              <div
                className="rounded-lg p-6 flex items-center gap-4"
                style={{ backgroundColor: watchSecondary }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: watchPrimary }}
                >
                  P
                </div>
                <div>
                  <p className="font-bold text-white text-lg">
                    {infoForm.watch("name") || "Restaurante"}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: watchPrimary }}
                  >
                    Pedir agora
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={appearanceForm.handleSubmit((data) =>
                saveSection({
                  logo: data.logo || null,
                  bannerImage: data.bannerImage || null,
                  primaryColor: data.primaryColor,
                  secondaryColor: data.secondaryColor,
                })
              )}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Aparencia"}
            </Button>
          </div>
        </TabsContent>

        {/* ==================== Horarios ==================== */}
        <TabsContent value="hours">
          <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              Horario de Funcionamento
            </h2>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const dayHours = openingHours[day.key]
                const isClosed = dayHours?.closed

                return (
                  <div
                    key={day.key}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg p-3",
                      isClosed ? "bg-gray-800/30" : "bg-gray-800/50"
                    )}
                  >
                    <div className="flex items-center justify-between sm:w-40">
                      <span
                        className={cn(
                          "font-medium text-sm",
                          isClosed ? "text-gray-600" : "text-white"
                        )}
                      >
                        {day.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!isClosed}
                          onCheckedChange={(open) => {
                            setOpeningHours((prev) => ({
                              ...prev,
                              [day.key]: {
                                ...prev[day.key],
                                closed: !open,
                              },
                            }))
                          }}
                        />
                        <span className="text-xs text-gray-500">
                          {isClosed ? "Fechado" : "Aberto"}
                        </span>
                      </div>

                      {!isClosed && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={dayHours?.open || "08:00"}
                            onChange={(e) =>
                              setOpeningHours((prev) => ({
                                ...prev,
                                [day.key]: {
                                  ...prev[day.key],
                                  open: e.target.value,
                                },
                              }))
                            }
                            className="bg-gray-900 border-gray-700 text-white w-28"
                          />
                          <span className="text-gray-500 text-sm">ate</span>
                          <Input
                            type="time"
                            value={dayHours?.close || "22:00"}
                            onChange={(e) =>
                              setOpeningHours((prev) => ({
                                ...prev,
                                [day.key]: {
                                  ...prev[day.key],
                                  close: e.target.value,
                                },
                              }))
                            }
                            className="bg-gray-900 border-gray-700 text-white w-28"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <Button
              onClick={() => saveSection({ openingHours })}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Horarios"}
            </Button>
          </div>
        </TabsContent>

        {/* ==================== Entrega ==================== */}
        <TabsContent value="delivery">
          <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-400" />
              Entrega
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300">Taxa de Entrega (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...deliveryForm.register("deliveryFee", {
                    valueAsNumber: true,
                  })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Raio de Entrega (km)</Label>
                <Input
                  type="number"
                  step="0.1"
                  {...deliveryForm.register("deliveryRadius", {
                    valueAsNumber: true,
                  })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Pedido Minimo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...deliveryForm.register("minimumOrder", {
                    valueAsNumber: true,
                  })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">
                  Tempo Estimado (minutos)
                </Label>
                <Input
                  type="number"
                  {...deliveryForm.register("estimatedTime", {
                    valueAsNumber: true,
                  })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <Button
              onClick={deliveryForm.handleSubmit((data) => saveSection(data))}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Entrega"}
            </Button>
          </div>
        </TabsContent>

        {/* ==================== Pagamentos ==================== */}
        <TabsContent value="payments">
          <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-400" />
              Pagamentos
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Mercado Pago Access Token
                </Label>
                <Input
                  type="password"
                  value={mpAccessToken}
                  onChange={(e) => setMpAccessToken(e.target.value)}
                  placeholder="APP_USR-..."
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 font-mono"
                />
                <p className="text-xs text-gray-500">
                  Necessario para pagamentos via Pix e cartao
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-300 text-sm font-semibold uppercase tracking-wider">
                  Metodos Aceitos
                </Label>

                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Pix</span>
                  </div>
                  <Switch
                    checked={acceptsPix}
                    onCheckedChange={setAcceptsPix}
                  />
                </div>

                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Cartao</span>
                  </div>
                  <Switch
                    checked={acceptsCard}
                    onCheckedChange={setAcceptsCard}
                  />
                </div>

                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Dinheiro</span>
                  </div>
                  <Switch
                    checked={acceptsCash}
                    onCheckedChange={setAcceptsCash}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() =>
                saveSection({
                  mpAccessToken: mpAccessToken || null,
                  acceptsPix,
                  acceptsCard,
                  acceptsCash,
                })
              }
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Pagamentos"}
            </Button>
          </div>
        </TabsContent>

        {/* ==================== Sistema (Info) ==================== */}
        <TabsContent value="system">
          <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-orange-400" />
              Informacoes do Sistema
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Subdominio
                    </p>
                    <p className="text-xs text-gray-500">
                      Endereco da sua loja online
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-orange-400">
                    {initialData.slug}.pedefacil.com.br
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Taxa de Comissao
                    </p>
                    <p className="text-xs text-gray-500">
                      Percentual cobrado pela plataforma
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">
                    {(initialData.commissionRate * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
