import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { createPaymentController, listPaymentsController, getPaymentController } from "./payments.controller";
import { getPublicPayment, completePayment } from "./pay.controller";

const router = Router();

console.log("payments.routes loaded");
router.get("/test", (req, res) => {
  res.send("Payments route is working");
});
// merchant-only, protected
router.post("/createPayments", authGuard, createPaymentController);
router.get("/getAllPayments", authGuard, listPaymentsController);
router.get("/payments/:id", authGuard, getPaymentController);

// public, no auth
router.get("/pay/:id", getPublicPayment);
router.post("/pay/:id/complete", completePayment);

export default router;