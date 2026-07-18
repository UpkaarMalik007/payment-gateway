import { pool } from "../../config/db";

// called by: POST /payments
export async function createPayment(data: {
  merchantId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  idempotencyKey: string;
  expiresAt: Date;
}) {
  const result = await pool.query(
    `INSERT INTO payments (merchant_id, amount, customer_name, customer_email, idempotency_key, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.merchantId, data.amount, data.customerName, data.customerEmail, data.idempotencyKey, data.expiresAt]
  );
  return result.rows[0];
}

// called by: POST /payments (when a duplicate idempotency key is caught, error code 23505)
export async function findPaymentByIdempotencyKey(key: string) {
  const result = await pool.query(`SELECT * FROM payments WHERE idempotency_key = $1`, [key]);
  return result.rows[0] || null;
}

// called by: GET /payments (merchant's own list, with optional status filter)
export async function listPaymentsForMerchant(merchantId: string, status?: string) {
  if (status) {
    const result = await pool.query(
      `SELECT * FROM payments WHERE merchant_id = $1 AND status = $2 ORDER BY created_at DESC`,
      [merchantId, status]
    );
    return result.rows;
  }
  const result = await pool.query(
    `SELECT * FROM payments WHERE merchant_id = $1 ORDER BY created_at DESC`,
    [merchantId]
  );
  return result.rows;
}

// called by: GET /payments/:id (merchant dashboard — deliberately scoped, this IS the IDOR protection)
export async function findPaymentByIdForMerchant(id: string, merchantId: string) {
  const result = await pool.query(
    `SELECT * FROM payments WHERE id = $1 AND merchant_id = $2`,
    [id, merchantId]
  );
  return result.rows[0] || null;
}

// called by: GET /pay/:id and POST /pay/:id/complete (public — no merchant check, customer isn't logged in)
export async function findPaymentById(id: string) {
  const result = await pool.query(`SELECT * FROM payments WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

// called by: POST /pay/:id/complete, and internally whenever status changes (expiry, refunds)
export async function updatePaymentStatus(id: string, status: string) {
  const result = await pool.query(
    `UPDATE payments SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
}