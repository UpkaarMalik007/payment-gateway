import { apiClient } from "./client";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface CreatePaymentResponse {
  payment: Payment;
  payLink: string;
  qrCode: string;
  expiresAt: string;
}

export async function createPayment(data: {
  amount: number;
  customerName: string;
  customerEmail: string;
}): Promise<CreatePaymentResponse> {
  const idempotencyKey = crypto.randomUUID();
  const res = await apiClient.post("/payments", data, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return res.data;
}

export async function listPayments(status?: string): Promise<Payment[]> {
  const query = status ? `?status=${status}` : "";
  const res = await apiClient.get(`/payments${query}`);
  return res.data;
}

export async function getPayment(id: string): Promise<Payment> {
  const res = await apiClient.get(`/payments/${id}`);
  return res.data;
}