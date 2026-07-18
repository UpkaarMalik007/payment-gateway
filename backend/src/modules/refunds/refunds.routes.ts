import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { createRefundController, listRefundsController } from "./refunds.controller";

const router = Router();

router.post("/payments/:id/refunds", authGuard, createRefundController);
router.get("/payments/:id/refunds", authGuard, listRefundsController);

export default router;