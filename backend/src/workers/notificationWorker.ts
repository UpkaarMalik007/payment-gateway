import { Worker } from "bullmq";
import axios from "axios";
import { upsertNotificationAttempt, updateNotificationStatus } from "../modules/notifications/notifications.queries";

const connection = { url: process.env.REDIS_URL! };

async function attemptDelivery(paymentId: string, eventType: string): Promise<boolean> {
  try {
    const response = await axios.post(`http://localhost:${process.env.PORT}/internal/webhook-receiver`, {
      event: eventType,
      paymentId,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    const { paymentId, eventType } = job.data;

    const notification = await upsertNotificationAttempt(paymentId, eventType);
    const delivered = await attemptDelivery(paymentId, eventType);

    await updateNotificationStatus(notification.id, delivered ? "delivered" : "failed");

    if (!delivered) {
      throw new Error("Webhook delivery failed"); // tells BullMQ to schedule a retry
    }
  },
  { connection }
);

notificationWorker.on("failed", (job, err) => {
  console.log(`Notification job ${job?.id} failed: ${err.message}`);
});

notificationWorker.on("completed", (job) => {
  console.log(`Notification job ${job.id} delivered successfully`);
});