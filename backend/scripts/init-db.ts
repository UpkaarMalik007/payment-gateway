import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();


const result = dotenv.config();


async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const sql = fs.readFileSync(
    path.join(__dirname, "../db/schema.sql"),
    "utf8"
  );

  try {
  await client.query(sql);
  console.log("Database initialized successfully.");
} catch (err) {
  console.error("SQL execution failed:");
  console.error(err);
}

  await client.end();
}

main().catch(console.error);