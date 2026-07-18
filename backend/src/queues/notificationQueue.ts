import { Queue } from "bullmq";

const connection = { url: process.env.REDIS_URL! };

export const notificationQueue = new Queue("notifications", { connection });