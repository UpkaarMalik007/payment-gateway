import { pool } from "../../config/db";


export async function getTotalRefunded(paymentId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM refunds WHERE payment_id = $1`,
    [paymentId]
  );
  return Number(result.rows[0].total);
}


export async function createRefundWithStatusUpdate(
  paymentId: string,
  amount: number,
  reason: string | undefined,
  newStatus: string
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const refundResult = await client.query(
      `INSERT INTO refunds (payment_id, amount, reason) VALUES ($1, $2, $3) RETURNING *`,
      [paymentId, amount, reason]
    );

    await client.query(
      `UPDATE payments SET status = $1, updated_at = now() WHERE id = $2`,
      [newStatus, paymentId]
    );

    await client.query("COMMIT");
    return refundResult.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


export async function listRefundsForPayment(paymentId: string) {
  const result = await pool.query(
    `SELECT * FROM refunds WHERE payment_id = $1 ORDER BY created_at DESC`,
    [paymentId]
  );
  return result.rows;
}