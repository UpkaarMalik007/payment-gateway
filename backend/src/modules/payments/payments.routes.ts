import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { createPaymentController, listPaymentsController, getPaymentController, getPaymentShareLink } from "./payments.controller";
import { getPublicPayment, completePayment } from "./pay.controller";

const router = Router();


router.post("/payments", authGuard, createPaymentController);
router.get("/payments", authGuard, listPaymentsController);
router.get("/payments/:id", authGuard, getPaymentController);
router.get("/payments/:id/share", authGuard, getPaymentShareLink);
router.get("/pay/:id", getPublicPayment);
router.post("/pay/:id/complete", completePayment);

export default router;