import { Request, Response } from "express";
import {
  getInterviewEvaluationContext,
  saveInterviewEvaluation,
} from "../services/interview.service.js";
import { evaluateInterviewWithOpenRouter } from "../services/ai/openrouter.service.js";

export const evaluateInterview = async (req: Request, res: Response) => {
  try {
    const interviewId = Number(req.params.id);

    if (!Number.isInteger(interviewId)) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const context = await getInterviewEvaluationContext(
      interviewId,
      req.userId!,
    );

    const evaluation = await evaluateInterviewWithOpenRouter(context);

    const savedInterview = await saveInterviewEvaluation(
      interviewId,
      req.userId!,
      evaluation,
    );

    return res.status(200).json({
      message: "Interview evaluated and saved successfully",
      interview: savedInterview,
      evaluation,
    });
  } catch (error) {
    console.error("Interview evaluation failed:", error);

    return res.status(500).json({
      message: "Failed to evaluate interview",
    });
  }
};
