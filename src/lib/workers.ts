/**
 * Queue Workers for PedeFácil
 *
 * IMPORTANT: Workers are meant to run in a separate process from the Next.js server.
 * Run this file with: npx tsx src/lib/workers.ts
 * Or add a script in package.json: "workers": "tsx src/lib/workers.ts"
 *
 * Workers process background jobs from the BullMQ queues (Redis-backed).
 */

import { Worker, Job } from "bullmq"
import { prisma } from "./db"
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderNotification,
  sendReactivationMessage,
  sendBirthdayMessage,
} from "./whatsapp"
import type { NotificationJob, CampaignJob } from "./queue"

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
}

// ==================== Notification Worker ====================

const notificationWorker = new Worker(
  "notifications",
  async (job: Job<NotificationJob>) => {
    const { type, data } = job.data

    console.log(`[NotificationWorker] Processing job ${job.id} - type: ${type}`)

    switch (type) {
      case "order_confirmation": {
        const { customerPhone, orderNumber, estimatedTime, restaurantName } =
          data as Record<string, string | number>
        await sendOrderConfirmation(
          customerPhone as string,
          orderNumber as number,
          estimatedTime as number,
          restaurantName as string
        )
        break
      }

      case "order_status_update": {
        const { customerPhone, status, orderNumber, restaurantName } =
          data as Record<string, string | number>
        await sendOrderStatusUpdate(
          customerPhone as string,
          status as string,
          orderNumber as number,
          restaurantName as string
        )
        break
      }

      case "order_notification": {
        const { restaurantWhatsapp, orderDetails } = data as {
          restaurantWhatsapp: string
          orderDetails: {
            orderNumber: number
            customerName: string
            total: number
            items: string
            paymentMethod: string
            orderType: string
            address?: string
          }
        }
        await sendOrderNotification(restaurantWhatsapp, orderDetails)
        break
      }

      default:
        console.warn(`[NotificationWorker] Unknown job type: ${type}`)
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
)

notificationWorker.on("completed", (job) => {
  console.log(`[NotificationWorker] Job ${job.id} completed`)
})

notificationWorker.on("failed", (job, err) => {
  console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message)
})

// ==================== Campaign Worker ====================

interface CustomerRecord {
  id: string
  name: string
  phone: string
  birthday: Date | null
  totalOrders: number
}

const campaignWorker = new Worker(
  "campaigns",
  async (job: Job<CampaignJob>) => {
    const { type, campaignId, restaurantId } = job.data

    console.log(`[CampaignWorker] Processing job ${job.id} - type: ${type}`)

    switch (type) {
      case "reactivation": {
        if (!campaignId) throw new Error("campaignId required")

        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: { restaurant: true },
        })

        if (!campaign || !campaign.isActive) return

        const daysInactive = campaign.targetDaysInactive || 30
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

        const inactiveCustomers: CustomerRecord[] = await prisma.customer.findMany({
          where: {
            restaurantId,
            lastOrderAt: { lt: cutoffDate },
          },
        })

        let sentCount = 0
        for (const customer of inactiveCustomers) {
          try {
            await sendReactivationMessage(
              customer.phone,
              customer.name,
              campaign.couponCode || "VOLTAPRACASA",
              campaign.restaurant.name
            )
            sentCount++
          } catch (err) {
            console.error(`[CampaignWorker] Failed to send to ${customer.phone}:`, err)
          }
        }

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { totalSent: { increment: sentCount }, lastRunAt: new Date() },
        })
        break
      }

      case "birthday": {
        if (!campaignId) throw new Error("campaignId required")

        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: { restaurant: true },
        })

        if (!campaign || !campaign.isActive) return

        const today = new Date()
        const month = today.getMonth() + 1
        const day = today.getDate()

        const customers: CustomerRecord[] = await prisma.customer.findMany({
          where: { restaurantId, birthday: { not: null } },
        })

        const birthdayCustomers = customers.filter((c: CustomerRecord) => {
          if (!c.birthday) return false
          const bday = new Date(c.birthday)
          return bday.getMonth() + 1 === month && bday.getDate() === day
        })

        let sentCount = 0
        const offer = campaign.discountPercent
          ? `${campaign.discountPercent}% de desconto`
          : campaign.discountFixed
            ? `R$ ${campaign.discountFixed.toFixed(2)} de desconto`
            : campaign.message

        for (const customer of birthdayCustomers) {
          try {
            await sendBirthdayMessage(
              customer.phone,
              customer.name,
              offer,
              campaign.restaurant.name
            )
            sentCount++
          } catch (err) {
            console.error(`[CampaignWorker] Failed to send to ${customer.phone}:`, err)
          }
        }

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { totalSent: { increment: sentCount }, lastRunAt: new Date() },
        })
        break
      }

      case "manual": {
        if (!campaignId) throw new Error("campaignId required")

        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: { restaurant: true },
        })

        if (!campaign) return

        const customers: CustomerRecord[] = await prisma.customer.findMany({
          where: {
            restaurantId,
            ...(campaign.targetMinOrders
              ? { totalOrders: { gte: campaign.targetMinOrders } }
              : {}),
          },
        })

        let sentCount = 0
        for (const customer of customers) {
          try {
            await sendReactivationMessage(
              customer.phone,
              customer.name,
              campaign.couponCode || "",
              campaign.restaurant.name
            )
            sentCount++
          } catch (err) {
            console.error(`[CampaignWorker] Failed to send to ${customer.phone}:`, err)
          }
        }

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { totalSent: { increment: sentCount }, lastRunAt: new Date() },
        })
        break
      }

      default:
        console.warn(`[CampaignWorker] Unknown job type: ${type}`)
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
)

campaignWorker.on("completed", (job) => {
  console.log(`[CampaignWorker] Job ${job.id} completed`)
})

campaignWorker.on("failed", (job, err) => {
  console.error(`[CampaignWorker] Job ${job?.id} failed:`, err.message)
})

// Graceful shutdown
async function shutdown() {
  console.log("[Workers] Shutting down...")
  await notificationWorker.close()
  await campaignWorker.close()
  process.exit(0)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

console.log("[Workers] Started notification and campaign workers")
