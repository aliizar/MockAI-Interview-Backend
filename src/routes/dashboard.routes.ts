import { Router } from "express";
import { getStats , getProgress } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/stats", authenticate, getStats);
router.get("/progress", authenticate, getProgress);
export default router;
