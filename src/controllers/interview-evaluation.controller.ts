import { Request, Response } from "express";
import {
  evaluateAndSaveInterview,
  markInterviewAsFailed,
} from "../services/interview.service.js";

export const evaluateInterview = async (req: Request, res: Response) => {
  try {
    const interviewId = Number(req.params.id);

    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(interviewId)) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const result = await evaluateAndSaveInterview(interviewId, req.userId);

    return res.status(200).json({
      message: "Interview evaluated and saved successfully",
      interview: result.savedInterview,
      evaluation: result.evaluation,
    });
  } catch (error) {
    console.error("Interview evaluation failed:", error);

    const interviewId = Number(req.params.id);

    if (req.userId && Number.isInteger(interviewId)) {
      await markInterviewAsFailed(interviewId, req.userId);
    }

    return res.status(500).json({
      message: "INTERVIEW_FAILED",
      error:
        "Sorry for the inconvenience. Your interview could not be completed. Please try again later.",
    });
  }
};
