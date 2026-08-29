import { Router } from "express";
import {
  startInterview,
  submitInterviewAnswer,
} from "../controllers/interview.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/start", authenticate, startInterview);
router.post("/:interviewId/answer", authenticate, submitInterviewAnswer);
export default router;
