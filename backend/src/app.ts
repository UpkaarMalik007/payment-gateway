import express, { Request, Response } from "express";
import { pool } from "./config/db";
import "./config/redis";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import merchantRoutes from "./modules/merchants/merchants.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import refundsRoutes from "./modules/refunds/refunds.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());

app.post("/internal/webhook-receiver", (req, res) => {
  console.log("Webhook received:", req.body);
  const shouldFail = Math.random() < 0.3; // ~30% simulated failure, so retries actually get exercised
  if (shouldFail) return res.status(500).send("Simulated failure");
  res.status(200).send("OK");
});

app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: (err as Error).message });
  }
});



// Routes
app.use("/auth", authRoutes);
app.use("/merchants", merchantRoutes);
app.use("/", paymentsRoutes);
app.use("/", refundsRoutes);
app.use("/", notificationsRoutes);


app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

export default app;