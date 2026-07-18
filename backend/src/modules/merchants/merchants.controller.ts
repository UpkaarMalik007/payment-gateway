import { Response } from "express";
import { AuthRequest } from "../../middleware/authGuard";
import { findMerchantById } from "./merchants.queries";

export async function getMe(req: AuthRequest, res: Response) {
  const merchantId = req.merchantId!;

  const merchant = await findMerchantById(merchantId);
  if (!merchant) {
    return res.status(404).json({ error: "Merchant not found" });
  }

  return res.json(merchant);
}