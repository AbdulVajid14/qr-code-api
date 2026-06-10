import express from "express";
import { googleLogin, getMe } from "../controllers/auth.Controller.js";
import { requireAuth } from "../middleware/auth.js";
 
const router = express.Router();
 
router.post("/google", googleLogin);
router.get("/me", requireAuth, getMe);
 
export default router;