"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Megaphone,
  Plus,
  Send,
  Pencil,
  Trash2,
  Zap,
  Mail,
  MessageSquare,
  BarChart3,
  CalendarClock,
  Target,
} from "lucide-react"

// ==================== TYPES ====================

interface Campaign {
  id: string
  name: string
  type: string
  message: string
  channel: string
  targetDaysInactive: number | null
  targetMinOrders: number | null
  targetBirthday: boolean
  couponCode: string | null
  discountPercent: number | null
  discountFixed: number | null
  totalSent: number
  totalConverted: number
  isActive: boolean
  isAutomated: boolean
  scheduledAt: string | null
  lastRunAt: string | null
  createdAt: string
}

interface MarketingPanelProps {
  restaurantId: string
  restaurantName: string
  initialCampaigns: Campaign[]
}

const CAMPAIGN_TYPES = [
  { value: "REACTIVATION", label: "Reativacao" },
  { value: "BIRTHDAY", label: "Aniversario" },
  { value: "PROMOTION", label: "Promocao" },
  { value: "NEW_ITEM", label: "Novo Item" },
  { value: "LOYALTY_REWARD", label: "Recompensa Fidelidade" },
]

const CHANNELS = [
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "SMS", label: "SMS", icon: Zap },
]

function getTypeLabel(type: string) {
  return CAMPAIGN_TYPES.find((t) => t.value === type)?.label || type
}

function getTypeBadgeColor(type: string) {
  switch (type) {
    case "REACTIVATION":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "BIRTHDAY":
      return "bg-pink-500/20 text-pink-400 border-pink-500/30"
    case "PROMOTION":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    case "NEW_ITEM":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "LOYALTY_REWARD":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
}

function getChannelLabel(channel: string) {
  return CHANNELS.find((c) => c.value === channel)?.label || channel
}

const emptyForm = {
  name: "",
  type: "PROMOTION",
  message: "",
  channel: "WHATSAPP",
  targetDaysInactive: "",
  targetMinOrders: "",
  targetBirthday: false,
  couponCode: "",
  discountPercent: "",
  discountFixed: "",
  isAutomated: false,
  scheduledAt: "",
}

// ==================== COMPONENT ====================

export function MarketingPanel({
  restaurantId,
  restaurantName,
  initialCampaigns,
}: MarketingPanelProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  // ---- Open create dialog ----
  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  // ---- Open edit dialog ----
  const openEdit = (campaign: Campaign) => {
    setEditingId(campaign.id)
    setForm({
      name: campaign.name,
      type: campaign.type,
      message: campaign.message,
      channel: campaign.channel,
      targetDaysInactive: campaign.targetDaysInactive?.toString() || "",
      targetMinOrders: campaign.targetMinOrders?.toString() || "",
      targetBirthday: campaign.targetBirthday,
      couponCode: campaign.couponCode || "",
      discountPercent: campaign.discountPercent?.toString() || "",
      discountFixed: campaign.discountFixed?.toString() || "",
      isAutomated: campaign.isAutomated,
      scheduledAt: campaign.scheduledAt
        ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
        : "",
    })
    setDialogOpen(true)
  }

  // ---- Save (create or update) ----
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        type: form.type,
        message: form.message,
        channel: form.channel,
        restaurantId,
        targetDaysInactive: form.targetDaysInactive
          ? Number(form.targetDaysInactive)
          : null,
        targetMinOrders: form.targetMinOrders
          ? Number(form.targetMinOrders)
          : null,
        targetBirthday: form.targetBirthday,
        couponCode: form.couponCode || null,
        discountPercent: form.discountPercent
          ? Number(form.discountPercent)
          : null,
        discountFixed: form.discountFixed
          ? Number(form.discountFixed)
          : null,
        isAutomated: form.isAutomated,
        scheduledAt: form.scheduledAt || null,
      }

      if (editingId) {
        const res = await fetch(`/api/campaigns/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Erro ao atualizar")
        const updated = await res.json()
        setCampaigns((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c))
        )
      } else {
        const res = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Erro ao criar")
        const created = await res.json()
        setCampaigns((prev) => [created, ...prev])
      }

      setDialogOpen(false)
    } catch (error) {
      console.error("Erro ao salvar campanha:", error)
    } finally {
      setSaving(false)
    }
  }

  // ---- Delete ----
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error("Erro ao excluir campanha:", error)
    }
  }

  // ---- Toggle active ----
  const toggleActive = async (campaign: Campaign) => {
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !campaign.isActive }),
      })
      if (!res.ok) throw new Error("Erro ao atualizar")
      const updated = await res.json()
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? updated : c))
      )
    } catch (error) {
      console.error("Erro ao alterar status:", error)
    }
  }

  // ---- Send campaign ----
  const handleSend = async (id: string) => {
    setSending(id)
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" })
      if (!res.ok) throw new Error("Erro ao enviar")
      const result = await res.json()
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, totalSent: result.totalSent, lastRunAt: result.lastRunAt }
            : c
        )
      )
    } catch (error) {
      console.error("Erro ao enviar campanha:", error)
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-orange-400" />
            Marketing
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {campaigns.length} campanha{campaigns.length !== 1 ? "s" : ""} criada{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Campaign Cards */}
      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-12 text-center">
          <Megaphone className="h-12 w-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">Nenhuma campanha criada</p>
          <p className="text-gray-600 text-sm mt-1">
            Crie sua primeira campanha de marketing
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className={cn(
                "rounded-xl border bg-gray-900/80 p-5 space-y-4 transition-colors",
                campaign.isActive
                  ? "border-gray-800"
                  : "border-gray-800/50 opacity-60"
              )}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-white text-lg">
                    {campaign.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs border",
                        getTypeBadgeColor(campaign.type)
                      )}
                    >
                      {getTypeLabel(campaign.type)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-700 text-gray-400"
                    >
                      {getChannelLabel(campaign.channel)}
                    </Badge>
                    {campaign.isAutomated && (
                      <Badge
                        variant="outline"
                        className="text-xs border-purple-500/30 text-purple-400 bg-purple-500/10"
                      >
                        <CalendarClock className="w-3 h-3 mr-1" />
                        Automatica
                      </Badge>
                    )}
                  </div>
                </div>
                <Switch
                  checked={campaign.isActive}
                  onCheckedChange={() => toggleActive(campaign)}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    <strong className="text-white">{campaign.totalSent}</strong>{" "}
                    enviados
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>
                    <strong className="text-green-400">
                      {campaign.totalConverted}
                    </strong>{" "}
                    conversoes
                  </span>
                </div>
              </div>

              {campaign.lastRunAt && (
                <p className="text-xs text-gray-600">
                  Ultimo envio:{" "}
                  {new Date(campaign.lastRunAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => openEdit(campaign)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => handleDelete(campaign.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Excluir
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={sending === campaign.id}
                  onClick={() => handleSend(campaign.id)}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {sending === campaign.id ? "Enviando..." : "Enviar Agora"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== Campaign Dialog ==================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              {editingId ? "Editar Campanha" : "Nova Campanha"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-gray-300">Nome da Campanha</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Promoção de Verão"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label className="text-gray-300">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm({ ...form, type: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {CAMPAIGN_TYPES.map((t) => (
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

            {/* Channel */}
            <div className="space-y-2">
              <Label className="text-gray-300">Canal</Label>
              <Select
                value={form.channel}
                onValueChange={(value) =>
                  setForm({ ...form, channel: value })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {CHANNELS.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="text-white hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label className="text-gray-300">Mensagem</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Olá {nome}! Temos uma oferta especial para você..."
                rows={4}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Variaveis disponiveis:{" "}
                <code className="text-orange-400">{"{nome}"}</code>,{" "}
                <code className="text-orange-400">{"{cupom}"}</code>,{" "}
                <code className="text-orange-400">{"{restaurante}"}</code>
              </p>
            </div>

            {/* Segmentation */}
            <div className="space-y-3">
              <Label className="text-gray-300 text-sm font-semibold uppercase tracking-wider">
                Segmentacao
              </Label>

              {form.type === "REACTIVATION" && (
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">
                    Clientes inativos ha X dias
                  </Label>
                  <Input
                    type="number"
                    value={form.targetDaysInactive}
                    onChange={(e) =>
                      setForm({ ...form, targetDaysInactive: e.target.value })
                    }
                    placeholder="30"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              )}

              {form.type === "BIRTHDAY" && (
                <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                  <Switch
                    checked={form.targetBirthday}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, targetBirthday: checked })
                    }
                  />
                  <span className="text-sm text-gray-300">
                    Enviar automaticamente no aniversario do cliente
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">
                  Minimo de pedidos do cliente
                </Label>
                <Input
                  type="number"
                  value={form.targetMinOrders}
                  onChange={(e) =>
                    setForm({ ...form, targetMinOrders: e.target.value })
                  }
                  placeholder="0"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Coupon */}
            <div className="space-y-3">
              <Label className="text-gray-300 text-sm font-semibold uppercase tracking-wider">
                Cupom
              </Label>
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">
                  Codigo do cupom
                </Label>
                <Input
                  value={form.couponCode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      couponCode: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="PROMO10"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">Desconto %</Label>
                  <Input
                    type="number"
                    value={form.discountPercent}
                    onChange={(e) =>
                      setForm({ ...form, discountPercent: e.target.value })
                    }
                    placeholder="10"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">
                    Desconto R$
                  </Label>
                  <Input
                    type="number"
                    value={form.discountFixed}
                    onChange={(e) =>
                      setForm({ ...form, discountFixed: e.target.value })
                    }
                    placeholder="5.00"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Automation */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                <Switch
                  checked={form.isAutomated}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isAutomated: checked })
                  }
                />
                <span className="text-sm text-gray-300">
                  Campanha automatica
                </span>
              </div>

              {!form.isAutomated && (
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">
                    Agendar para
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) =>
                      setForm({ ...form, scheduledAt: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !form.message}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving
                ? "Salvando..."
                : editingId
                  ? "Salvar Alteracoes"
                  : "Criar Campanha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
