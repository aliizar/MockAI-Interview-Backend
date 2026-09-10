import { Request, Response } from "express";
import { processResume } from "../services/resume.service.js";

export async function analyzeResume(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Resume file is required",
      });
    }

    const { targetRole } = req.body;

    if (!targetRole) {
      return res.status(400).json({
        message: "Target role is required",
      });
    }

    const result = await processResume(req.file, targetRole);

    return res.status(200).json({
      message: "Resume analyzed successfully",
      resume: result,
    });
  } catch (error) {
    console.error("Failed to analyze resume:", error);

    return res.status(500).json({
      message: "Failed to analyze resume",
    });
  }
}
