import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { getMe } from "./merchants.controller";

const router = Router();

router.get("/getMe", authGuard, getMe);

export default router;