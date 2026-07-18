import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  merchantId?: string;
}

export function authGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token is missing" });
  }

  const token = authHeader.replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "Access token missing" });

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { merchantId: string };
    req.merchantId = payload.merchantId;
    next();
  } catch {
    return res.status(401).json({ error: "Access token invalid or expired" });
  }
}