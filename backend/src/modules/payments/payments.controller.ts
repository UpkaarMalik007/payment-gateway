import { Response } from "express";
import QRCode from "qrcode";
import { AuthRequest } from "../../middleware/authGuard";

import {
  createPayment,
  findPaymentByIdempotencyKey,
  listPaymentsForMerchant,
  findPaymentByIdForMerchant,
} from "./payments.queries";


const EXPIRY_MINUTES = 15;

export async function createPaymentController(req: AuthRequest, res: Response) {
  const { amount, customerName, customerEmail } = req.body;
  const merchantId = req.merchantId!;

  // validation
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number", field: "amount" });
  }
  if (amount > 10_000_000) {
    return res.status(400).json({ error: "Amount exceeds maximum allowed", field: "amount" });
  }
  if (!customerName || customerName.length < 2) {
    return res.status(400).json({ error: "Customer name is required", field: "customerName" });
  }
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return res.status(400).json({ error: "Valid customer email is required", field: "customerEmail" });
  }

  const idempotencyKey = req.headers["idempotency-key"] as string;
  if (!idempotencyKey) {
    return res.status(400).json({ error: "Idempotency-Key header is required" });
  }

  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  try {
    const payment = await createPayment({
      merchantId,
      amount: Math.round(amount * 100), // rupees -> paise
      customerName,
      customerEmail,
      idempotencyKey,
      expiresAt,
    });

    const payLink = `${process.env.FRONTEND_URL}/pay/${payment.id}`;
    const qrCode = await QRCode.toDataURL(payLink);

    return res.status(201).json({ payment, payLink, qrCode, expiresAt: payment.expires_at });
  } catch (err: any) {
    if (err.code === "23505") {
      // duplicate idempotency key — return the original payment, not an error
      const existing = await findPaymentByIdempotencyKey(idempotencyKey);
      const payLink = `${process.env.FRONTEND_URL}/pay/${existing.id}`;
      const qrCode = await QRCode.toDataURL(payLink);
      return res.status(200).json({
        payment: existing,
        payLink,
        qrCode,
        expiresAt: existing.expires_at,
        note: "Duplicate request, returned existing payment",
      });
    }
    throw err;
  }
}

export async function listPaymentsController(req: AuthRequest, res: Response) {
  const merchantId = req.merchantId!;
  const status = req.query.status as string | undefined;

  const payments = await listPaymentsForMerchant(merchantId, status);
  return res.json(payments);
}

export async function getPaymentController(req: AuthRequest, res: Response) {
  const merchantId = req.merchantId!;
  const payment = await findPaymentByIdForMerchant(req.params.id as string, merchantId);

  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }
  return res.json(payment);
}