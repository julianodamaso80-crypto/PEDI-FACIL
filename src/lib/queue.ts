import { Queue } from "bullmq"

// Redis connection config - uses URL string instead of IORedis instance to avoid version conflicts
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
}

// Queues
export function getNotificationQueue() {
  return new Queue("notifications", { connection: redisConnection })
}

export function getCampaignQueue() {
  return new Queue("campaigns", { connection: redisConnection })
}

// Job types
export type NotificationJob = {
  type: "order_confirmation" | "order_status_update" | "order_notification"
  data: Record<string, unknown>
}

export type CampaignJob = {
  type: "reactivation" | "birthday" | "manual"
  campaignId?: string
  restaurantId: string
}

// Helper to add notification jobs
export async function queueNotification(job: NotificationJob) {
  try {
    const queue = getNotificationQueue()
    await queue.add(job.type, job, { removeOnComplete: 100, removeOnFail: 50 })
  } catch (error) {
    console.error("[Queue] Failed to queue notification, falling back to direct send:", error)
  }
}

export async function queueCampaign(job: CampaignJob) {
  try {
    const queue = getCampaignQueue()
    await queue.add(job.type, job, { removeOnComplete: 50, removeOnFail: 20 })
  } catch (error) {
    console.error("[Queue] Failed to queue campaign:", error)
  }
}
