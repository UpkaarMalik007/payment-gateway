import { Router } from "express";
import { register, login, refresh, logout } from "./auth.controller";
import {authGuard} from "../../middleware/authGuard"


const router = Router();


router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authGuard, logout);

export default router;