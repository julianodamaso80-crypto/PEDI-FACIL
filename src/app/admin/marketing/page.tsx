import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { MarketingPanel } from "@/components/admin/marketing-panel"

export const dynamic = "force-dynamic"

export default async function MarketingPage() {
  const restaurant = await prisma.restaurant.findFirst({
    select: { id: true, name: true },
  })

  if (!restaurant) {
    redirect("/")
  }

  const campaigns = await prisma.campaign.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
  })

  // Serialize dates to strings for the client component
  const serializedCampaigns = JSON.parse(JSON.stringify(campaigns))

  return (
    <MarketingPanel
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      initialCampaigns={serializedCampaigns}
    />
  )
}
