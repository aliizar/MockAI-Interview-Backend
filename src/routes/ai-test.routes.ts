import { Router } from "express";
import { testNextQuestion } from "../controllers/ai-test.controller.js";

const router = Router();

router.get("/next-question", testNextQuestion);

export default router;
