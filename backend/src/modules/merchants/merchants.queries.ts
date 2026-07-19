import { pool } from "../../config/db";


export async function createMerchant(name: string, email: string, hashedPassword: string) {
  const result = await pool.query(
    `INSERT INTO merchants (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, hashedPassword]
  );
  return result.rows[0];
}


export async function findMerchantByEmail(email: string) {
  const result = await pool.query(`SELECT * FROM merchants WHERE email = $1`, [email]);
  return result.rows[0] || null;
}

export async function findMerchantById(id: string) {
  const result = await pool.query(
    `SELECT id, name, email, created_at FROM merchants WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}


export async function emailExists(email: string): Promise<boolean> {
  const result = await pool.query(`SELECT id FROM merchants WHERE email = $1`, [email]);
  return result.rows.length > 0;
}