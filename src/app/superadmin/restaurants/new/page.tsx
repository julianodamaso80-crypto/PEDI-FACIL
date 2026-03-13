"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function NewRestaurantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [ownerName, setOwnerName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [ownerPassword, setOwnerPassword] = useState("")

  const [restaurantName, setRestaurantName] = useState("")
  const [slug, setSlug] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")

  function handleNameChange(name: string) {
    setRestaurantName(name)
    setSlug(slugify(name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/superadmin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: { name: ownerName, email: ownerEmail, password: ownerPassword },
          restaurant: {
            name: restaurantName,
            slug,
            phone,
            whatsapp,
            email,
            address,
            city,
            state,
            zipCode,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao criar restaurante")
      }

      router.push("/superadmin/restaurants")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClasses =
    "bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-orange-500 focus-visible:border-orange-500"

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link
          href="/superadmin/restaurants"
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Criar Restaurante</h1>
      </div>

      {error && (
        <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Owner Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dados do Proprietário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Nome</Label>
              <Input
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nome completo"
                className={inputClasses}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <Input
                  required
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className={inputClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Senha</Label>
                <Input
                  required
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Senha de acesso"
                  className={inputClasses}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dados do Restaurante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Nome do Restaurante</Label>
                <Input
                  required
                  value={restaurantName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Nome do restaurante"
                  className={inputClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Slug (URL)</Label>
                <Input
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="meu-restaurante"
                  className={inputClasses}
                />
                <p className="text-xs text-gray-500">
                  {slug}.pedefacil.com.br
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Telefone</Label>
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={inputClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">WhatsApp</Label>
                <Input
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={inputClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Email do Restaurante</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@restaurante.com"
                  className={inputClasses}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Endereço</Label>
              <Input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, complemento"
                className={inputClasses}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Cidade</Label>
                <Input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                  className={inputClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Estado</Label>
                <Input
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">CEP</Label>
                <Input
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="00000-000"
                  className={inputClasses}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Criando..." : "Criar Restaurante"}
        </button>
      </form>
    </div>
  )
}
