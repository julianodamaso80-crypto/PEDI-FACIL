"use client"

import { useState } from "react"
import { cn, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Award,
  Save,
  Crown,
  Trophy,
  Star,
  Gift,
} from "lucide-react"

// ==================== TYPES ====================

interface LoyaltyConfig {
  id: string
  isActive: boolean
  pointsPerReal: number
  rewardThreshold: number
  rewardType: string
  rewardValue: number
  restaurantId: string
}

interface TopCustomer {
  id: string
  name: string
  phone: string
  loyaltyPoints: number
  totalOrders: number
  totalSpent: number
}

interface LoyaltyPanelProps {
  restaurantId: string
  initialConfig: LoyaltyConfig | null
  initialTopCustomers: TopCustomer[]
}

const REWARD_TYPES = [
  { value: "DISCOUNT_PERCENT", label: "Desconto %" },
  { value: "DISCOUNT_FIXED", label: "Desconto Fixo R$" },
  { value: "FREE_ITEM", label: "Item Gratis" },
]

function getRewardLabel(type: string) {
  return REWARD_TYPES.find((t) => t.value === type)?.label || type
}

function getRankIcon(index: number) {
  if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />
  if (index === 1) return <Trophy className="w-5 h-5 text-gray-300" />
  if (index === 2) return <Trophy className="w-5 h-5 text-amber-600" />
  return <Star className="w-4 h-4 text-gray-600" />
}

// ==================== COMPONENT ====================

export function LoyaltyPanel({
  restaurantId,
  initialConfig,
  initialTopCustomers,
}: LoyaltyPanelProps) {
  const [config, setConfig] = useState<LoyaltyConfig | null>(initialConfig)
  const [topCustomers] = useState<TopCustomer[]>(initialTopCustomers)
  const [saving, setSaving] = useState(false)

  const [isActive, setIsActive] = useState(config?.isActive ?? true)
  const [pointsPerReal, setPointsPerReal] = useState(
    config?.pointsPerReal?.toString() || "1"
  )
  const [rewardThreshold, setRewardThreshold] = useState(
    config?.rewardThreshold?.toString() || "100"
  )
  const [rewardType, setRewardType] = useState(
    config?.rewardType || "DISCOUNT_PERCENT"
  )
  const [rewardValue, setRewardValue] = useState(
    config?.rewardValue?.toString() || "10"
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          isActive,
          pointsPerReal: Number(pointsPerReal),
          rewardThreshold: Number(rewardThreshold),
          rewardType,
          rewardValue: Number(rewardValue),
        }),
      })

      if (!res.ok) throw new Error("Erro ao salvar")
      const saved = await res.json()
      setConfig(saved)
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Award className="h-6 w-6 text-orange-400" />
          Programa de Fidelidade
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure as regras de pontos e recompensas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Configuracao</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {isActive ? "Ativo" : "Inativo"}
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <div className={cn(!isActive && "opacity-50 pointer-events-none")}>
            <div className="space-y-4">
              {/* Points per Real */}
              <div className="space-y-2">
                <Label className="text-gray-300">Pontos por Real gasto</Label>
                <Input
                  type="number"
                  value={pointsPerReal}
                  onChange={(e) => setPointsPerReal(e.target.value)}
                  min={1}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  A cada R$ 1,00 gasto, o cliente ganha {pointsPerReal || 1}{" "}
                  ponto{Number(pointsPerReal) !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Reward threshold */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Recompensa a cada X pontos
                </Label>
                <Input
                  type="number"
                  value={rewardThreshold}
                  onChange={(e) => setRewardThreshold(e.target.value)}
                  min={1}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  A cada {rewardThreshold || 100} pontos acumulados, o cliente
                  ganha uma recompensa
                </p>
              </div>

              {/* Reward type */}
              <div className="space-y-2">
                <Label className="text-gray-300">Tipo de Recompensa</Label>
                <Select value={rewardType} onValueChange={setRewardType}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {REWARD_TYPES.map((t) => (
                      <SelectItem
                        key={t.value}
                        value={t.value}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reward value */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Valor da Recompensa
                  {rewardType === "DISCOUNT_PERCENT"
                    ? " (%)"
                    : rewardType === "DISCOUNT_FIXED"
                      ? " (R$)"
                      : ""}
                </Label>
                <Input
                  type="number"
                  value={rewardValue}
                  onChange={(e) => setRewardValue(e.target.value)}
                  min={1}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-400">
              <Gift className="w-4 h-4" />
              Resumo do programa
            </div>
            <p className="text-sm text-gray-300">
              A cada <strong className="text-white">R$ 1,00</strong> gasto, o
              cliente ganha{" "}
              <strong className="text-yellow-400">
                {pointsPerReal || 1} ponto{Number(pointsPerReal) !== 1 ? "s" : ""}
              </strong>
              . Ao acumular{" "}
              <strong className="text-yellow-400">
                {rewardThreshold || 100} pontos
              </strong>
              , recebe{" "}
              <strong className="text-green-400">
                {rewardType === "DISCOUNT_PERCENT"
                  ? `${rewardValue}% de desconto`
                  : rewardType === "DISCOUNT_FIXED"
                    ? `R$ ${rewardValue} de desconto`
                    : "um item gratis"}
              </strong>
              .
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Configuracao"}
          </Button>
        </div>

        {/* Top customers ranking */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Ranking de Clientes
          </h2>

          {topCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">Nenhum cliente com pontos ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3 transition-colors",
                    index === 0
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : index < 3
                        ? "bg-gray-800/50"
                        : "bg-gray-800/30"
                  )}
                >
                  <div className="flex items-center justify-center w-8 h-8 shrink-0">
                    {getRankIcon(index)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">
                      {customer.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {customer.totalOrders} pedidos /{" "}
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-yellow-400">
                      {customer.loyaltyPoints}
                    </p>
                    <p className="text-xs text-gray-500">pontos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
