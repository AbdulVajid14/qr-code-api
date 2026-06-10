import express from "express";
import {
  createQR,
  getAllQR,
  getOneQR,
  updateQR,
  deleteQR,
  redirectQR,
} from "../controllers/qr.Controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public — QR scan redirect (no auth)
router.get("/qr/:key", redirectQR);

// Protected CRUD
router.post("/api/qr",       requireAuth, createQR);
router.get("/api/qr",        requireAuth, getAllQR);
router.get("/api/qr/:key",   requireAuth, getOneQR);
router.put("/api/qr/:key",   requireAuth, updateQR);
router.delete("/api/qr/:key",requireAuth, deleteQR);

export default router;