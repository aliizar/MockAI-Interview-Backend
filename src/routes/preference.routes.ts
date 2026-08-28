import express from "express";
import {
  getPreferences,
  updatePreferences,
} from "../controllers/preference.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, getPreferences);
router.put("/", authenticate, updatePreferences);

export default router;
