import { Router } from "express";
import { getNotifications } from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getNotifications);

export default router;