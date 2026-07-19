import { Response } from "express";
import { AuthRequest } from "../../middleware/authGuard";
import { findPaymentByIdForMerchant } from "../payments/payments.queries";
import { listNotificationsForPayment } from "./notifications.queries";

export async function getNotificationsController(req: AuthRequest, res: Response) {
  const merchantId = req.merchantId!;
  const paymentId = req.params.id as string;

 
  const payment = await findPaymentByIdForMerchant(paymentId, merchantId);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }

  const notifications = await listNotificationsForPayment(paymentId);
  return res.json(notifications);
}