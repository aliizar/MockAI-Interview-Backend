import express from "express";
import {
  changePasswordController,
  forgotPasswordController,
  getMe,
  login,
  register,
  resetPasswordController,
  verifyEmailController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get("/verify-email", verifyEmailController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);
router.patch("/change-password", authenticate, changePasswordController);
export default router;
