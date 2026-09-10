import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  chat,
  deleteConversation,
  getChatHistory,
  getConversation,
} from "../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/chat", authenticate, chat);
router.get("/history", authenticate, getChatHistory);
router.get("/history/:conversationId", authenticate, getConversation);
router.delete("/history/:conversationId", authenticate, deleteConversation);

export default router;
