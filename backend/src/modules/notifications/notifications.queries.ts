import { pool } from "../../config/db";

// called by: the BullMQ worker, on every job attempt (first attempt creates, retries update)
export async function upsertNotificationAttempt(paymentId: string, eventType: string) {
  const existing = await pool.query(
    `SELECT * FROM notifications WHERE payment_id = $1 AND event_type = $2`,
    [paymentId, eventType]
  );

  if (existing.rows[0]) {
    const result = await pool.query(
      `UPDATE notifications SET attempt_count = attempt_count + 1, last_attempt_at = now()
       WHERE id = $1 RETURNING *`,
      [existing.rows[0].id]
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO notifications (payment_id, event_type, status, attempt_count, last_attempt_at)
     VALUES ($1, $2, 'pending', 1, now()) RETURNING *`,
    [paymentId, eventType]
  );
  return result.rows[0];
}

// called by: the BullMQ worker, right after attemptDelivery() resolves
export async function updateNotificationStatus(id: string, status: string) {
  await pool.query(`UPDATE notifications SET status = $1 WHERE id = $2`, [status, id]);
}


export async function listNotificationsForPayment(paymentId: string) {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE payment_id = $1 ORDER BY created_at DESC`,
    [paymentId]
  );
  return result.rows;
}