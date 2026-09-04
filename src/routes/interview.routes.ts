import { Router } from "express";
import {
  getDetails,
  getHistory,
  manuallyEndInterview,
  startInterview,
  submitInterviewAnswer,
} from "../controllers/interview.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { evaluateInterview } from "../controllers/interview-evaluation.controller.js";

const router = Router();

router.post("/start", authenticate, startInterview);
router.post("/:interviewId/answer", authenticate, submitInterviewAnswer);
router.post("/:id/evaluate", authenticate, evaluateInterview);
router.get("/history", authenticate, getHistory);
router.get("/:id", authenticate, getDetails);
router.post("/:id/end", authenticate, manuallyEndInterview);
export default router;
