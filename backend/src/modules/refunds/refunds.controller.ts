import { Response } from "express";
import { AuthRequest } from "../../middleware/authGuard";
import { findPaymentByIdForMerchant } from "../payments/payments.queries";
import { getTotalRefunded, createRefundWithStatusUpdate, listRefundsForPayment } from "./refunds.queries";

export async function createRefundController(req: AuthRequest, res: Response) {
  const merchantId = req.merchantId!;
  const paymentId = req.params.id as string;
  const { amount, reason } = req.body;


  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Refund amount must be a positive number", field: "amount" });
  }
  if (reason && reason.length > 500) {
    return res.status(400).json({ error: "Reason must be under 500 characters", field: "reason" });
  }

  
  const payment = await findPaymentByIdForMerchant(paymentId, merchantId);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }

  // status check — matches the "status" column on the payments table above
  if (payment.status !== "completed" && payment.status !== "partially_refunded") {
    return res.status(400).json({ error: `Cannot refund a payment with status "${payment.status}"` });
  }


  const refundAmountPaise = Math.round(amount * 100);

  const alreadyRefunded = await getTotalRefunded(paymentId);
  const remaining = payment.amount - alreadyRefunded;

  if (refundAmountPaise > remaining) {
    return res.status(400).json({
      error: `Refund amount exceeds remaining refundable balance of ${remaining / 100}`,
      field: "amount",
    });
  }

  const newStatus = refundAmountPaise === remaining ? "refunded" : "partially_refunded";

  
  const refund = await createRefundWithStatusUpdate(paymentId, refundAmountPaise, reason, newStatus);

  // TODO once Phase 5 is built: enqueue a "payment.refunded" notification job here

  return res.status(201).json({ refund, newPaymentStatus: newStatus });
}

export async function listRefundsController(req: AuthRequest, res: Response) {
  const merchantId = req.merchantId!;
  const paymentId = req.params.id as string;

  const payment = await findPaymentByIdForMerchant(paymentId, merchantId);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }

  const refunds = await listRefundsForPayment(paymentId);
  return res.json(refunds);
}