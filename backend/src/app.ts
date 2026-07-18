import express, { Request, Response } from "express";
import { pool } from "./config/db";
import "./config/redis";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: (err as Error).message });
  }
});



// Routes
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

export default app;