import express, { Request, Response } from "express";
import { pool } from "./config/db";
import dotenv from "dotenv";
import "./config/redis";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import merchantRoutes from "./modules/merchants/merchants.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import refundsRoutes from "./modules/refunds/refunds.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import cors from "cors";

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, 
}));


// Routes
app.use("/auth", authRoutes);
app.use("/merchants", merchantRoutes);
app.use("/", paymentsRoutes);
app.use("/", refundsRoutes);
app.use("/", notificationsRoutes);
app.post("/internal/webhook-receiver", (req: Request, res: Response) => {
  console.log("Webhook received:", req.body);
  const shouldFail = Math.random() < 0.3; // 
  if (shouldFail) return res.status(500).send("Simulated failure");
  res.status(200).send("OK");
});


app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

export default app;