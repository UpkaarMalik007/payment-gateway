import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { createPaymentController, listPaymentsController, getPaymentController } from "./payments.controller";
import { getPublicPayment, completePayment } from "./pay.controller";

const router = Router();

// merchant-only, protected
router.post("/payments", authGuard, createPaymentController);
router.get("/payments", authGuard, listPaymentsController);
router.get("/payments/:id", authGuard, getPaymentController);

// public, no auth
router.get("/pay/:id", getPublicPayment);
router.post("/pay/:id/complete", completePayment);

export default router;