import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { SettingsPanel } from "@/components/admin/settings-panel"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const restaurant = await prisma.restaurant.findFirst()

  if (!restaurant) {
    redirect("/")
  }

  // Cast to satisfy the component's Restaurant interface (openingHours: JsonValue -> OpeningHours)
  return <SettingsPanel initialData={restaurant as any} />
}
