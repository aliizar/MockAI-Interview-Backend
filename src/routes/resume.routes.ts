import { Router } from "express";
import multer from "multer";

import { analyzeResume } from "../controllers/resume.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/analyze", authenticate, upload.single("file"), analyzeResume);

export default router;
