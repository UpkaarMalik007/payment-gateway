import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { getNotificationsController } from "./notifications.controller";

const router = Router();


router.get("/payments/:id/notifications", authGuard, getNotificationsController);

export default router;