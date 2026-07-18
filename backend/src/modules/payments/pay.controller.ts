import { Request, Response } from "express";
import { findPaymentById, updatePaymentStatus } from "./payments.queries";
import { notificationQueue } from "../../queues/notificationQueue";

export async function getPublicPayment(req: Request, res: Response) {
  const payment = await findPaymentById(req.params.id as string);
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  // lazy expiry check
  if (payment.status === "pending" && new Date() > new Date(payment.expires_at)) {
    const expired = await updatePaymentStatus(payment.id, "expired");
    return res.json(sanitize(expired));
  }

  return res.json(sanitize(payment));
}

export async function completePayment(req: Request, res: Response) {
  const { outcome } = req.body;
  if (outcome !== "success" && outcome !== "failure") {
    return res.status(400).json({ error: "outcome must be 'success' or 'failure'" });
  }

  const payment = await findPaymentById(req.params.id as string);
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  if (new Date() > new Date(payment.expires_at)) {
    await updatePaymentStatus(payment.id, "expired");
    return res.status(400).json({ error: "This payment request has expired" });
  }

  if (payment.status !== "pending") {
    return res.status(400).json({ error: `Payment is already ${payment.status}` });
  }

  const newStatus = outcome === "failure" ? "failed" : "completed";
  const updated = await updatePaymentStatus(payment.id, newStatus);

  // TODO once Phase 5 is built: enqueue a notification job here
  // await notificationQueue.add("send-notification", { paymentId: updated.id, eventType: `payment.${newStatus}` });
  await notificationQueue.add(
  "send-notification",
  { paymentId: updated.id, eventType: `payment.${newStatus}` },
  { attempts: 5, backoff: { type: "exponential", delay: 3000 } }
);

  return res.json(sanitize(updated));
}

// only return fields the customer actually needs to see — nothing internal
function sanitize(payment: any) {
  return {
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    customerName: payment.customer_name,
    status: payment.status,
  };
}