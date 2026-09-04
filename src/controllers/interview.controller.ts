import { Request, Response } from "express";
import {
  createInterview,
  createInterviewQuestion,
  endInterview,
  evaluateAndSaveInterview,
  getInterviewContext,
  markInterviewAsFailed,
  saveInterviewAnswer,
} from "../services/interview.service.js";
import {
  generateFirstQuestion,
  generateNextQuestion,
} from "../services/ai/ai.service.js";
import prisma from "../lib/prisma.js";
import { getInterviewTimer } from "../lib/interview-timer.js";
import { getInterviewDetails } from "../services/interview.service.js";
import { getInterviewHistory } from "../services/interview.service.js";
export async function startInterview(req: Request, res: Response) {
  const { role, difficulty, interviewType, duration } = req.body;
  const interview = await createInterview({
    userId: req.userId!,
    role,
    difficulty,
    interviewType,
    duration: Number(duration),
  });
  const interviewId = interview.id;
  try {
    if (!role || !difficulty || !interviewType || !duration) {
      return res.status(400).json({
        message: "All interview setup fields are required",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const firstQuestion = await generateFirstQuestion({
      role,
      difficulty,
      interviewType,
      duration: Number(duration),
    });

    const question = await createInterviewQuestion({
      interviewId: interview.id,
      question: firstQuestion.question,
      type: firstQuestion.type,
      questionNumber: 1,
    });

    return res.status(201).json({
      message: "Interview started successfully",
      interview: {
        id: interview.id,
        role: interview.role,
        difficulty: interview.difficulty,
        interviewType: interview.interviewType,
        duration: interview.duration,
        startedAt: interview.startedAt,
        status: interview.status,
      },
      question: {
        id: question.id,
        questionNumber: question.questionNumber,
        question: question.question,
        type: question.type,
      },
    });
  } catch (error) {
    console.error("Start interview failed:", error);

    if (interviewId !== null && req.userId) {
      await markInterviewAsFailed(interviewId, req.userId);
    }

    return res.status(500).json({
      message: "INTERVIEW_FAILED",
      error:
        "Sorry for the inconvenience. Your interview could not be completed. Please try again later.",
    });
  }
}

export async function submitInterviewAnswer(req: Request, res: Response) {
  try {
    const interviewId = Number(req.params.interviewId);
    const { answer, remainingSeconds } = req.body;

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

    if (
      !answer ||
      typeof answer !== "string" ||
      !Number.isFinite(remainingSeconds) ||
      remainingSeconds < 0
    ) {
      return res.status(400).json({
        message: "Answer and valid remaining seconds are required",
      });
    }

    // 1. Save candidate answer
    await saveInterviewAnswer(interviewId, req.userId, answer.trim());

    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        userId: req.userId,
        status: "ACTIVE",
      },
    });

    if (!interview) {
      return res.status(404).json({
        message: "Active interview not found",
      });
    }

    const timer = getInterviewTimer({
      remainingSeconds,
      duration: interview.duration,
    });

    if (timer.isExpired) {
      const completedInterview = await prisma.interview.update({
        where: {
          id: interview.id,
        },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
        },
      });

      return res.status(200).json({
        message: "Interview completed",
        interviewEnded: true,
        interview: {
          id: completedInterview.id,
          status: completedInterview.status,
          endedAt: completedInterview.endedAt,
        },
      });
    }
    // 2. Get complete interview context
    const context = await getInterviewContext(interviewId, req.userId);

    // 3. Ask Gemini for the next question
    const nextQuestion = await generateNextQuestion(
      context,
      timer.remainingSeconds,
      timer.stage,
    );

    // 4. Determine the next question number
    const questionNumber = context.conversation.length + 1;

    // 5. Save the next question
    const question = await createInterviewQuestion({
      interviewId,
      question: nextQuestion.question,
      type: nextQuestion.type,
      questionNumber,
    });

    return res.status(200).json({
      message: "Answer saved and next question generated",
      question: {
        id: question.id,
        questionNumber: question.questionNumber,
        question: question.question,
        type: question.type,
      },
      remainingSeconds: timer.remainingSeconds,
    });
  } catch (error) {
    console.error("Submit answer and generate next question failed:", error);

    const interviewId = Number(req.params.interviewId);

    if (req.userId && Number.isInteger(interviewId)) {
      await markInterviewAsFailed(interviewId, req.userId);
    }

    if (
      error instanceof Error &&
      error.message === "Active interview not found"
    ) {
      return res.status(404).json({
        message: "INTERVIEW_FAILED",
        error:
          "Sorry for the inconvenience. Your interview could not be completed. Please try again later.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "No unanswered question found"
    ) {
      return res.status(400).json({
        message: "INTERVIEW_FAILED",
        error:
          "Sorry for the inconvenience. Your interview could not be completed. Please try again later.",
      });
    }

    return res.status(500).json({
      message: "INTERVIEW_FAILED",
      error:
        "Sorry for the inconvenience. Your interview could not be completed. Please try again later.",
    });
  }
}
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const interviews = await getInterviewHistory(userId!);

    return res.status(200).json({
      message: "Interview history fetched successfully",
      interviews,
    });
  } catch (error) {
    console.error("Failed to fetch interview history:", error);

    return res.status(500).json({
      message: "Failed to fetch interview history",
    });
  }
};

export const getDetails = async (req: Request, res: Response) => {
  try {
    const interviewId = Number(req.params.id);
    const userId = req.userId;

    if (!Number.isInteger(interviewId)) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const interview = await getInterviewDetails(interviewId, userId!);

    return res.status(200).json({
      message: "Interview details fetched successfully",
      interview,
    });
  } catch (error) {
    console.error("Failed to fetch interview details:", error);

    if (error instanceof Error && error.message === "Interview not found") {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch interview details",
    });
  }
};

export async function manuallyEndInterview(req: Request, res: Response) {
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

    await endInterview(interviewId, req.userId);

    const result = await evaluateAndSaveInterview(interviewId, req.userId);

    return res.status(200).json({
      message: "Interview ended and evaluated successfully",
      interview: result.savedInterview,
      evaluation: result.evaluation,
    });
  } catch (error) {
    console.error("Manual interview end and evaluation failed:", error);

    const interviewId = Number(req.params.id);

    if (req.userId && Number.isInteger(interviewId)) {
      await markInterviewAsFailed(interviewId, req.userId);
    }

    if (
      error instanceof Error &&
      error.message === "Active interview not found"
    ) {
      return res.status(404).json({
        message: "Active interview not found",
      });
    }

    if (error instanceof Error && error.message === "No answered questions") {
      return res.status(400).json({
        message: "INTERVIEW_FAILED",
        error:
          "Sorry for the inconvenience. Your interview could not be completed. Please try again later.",
      });
    }

    return res.status(500).json({
      message: "INTERVIEW_FAILED",
      error:
        "Sorry for the inconvenience. Your interview could not be completed. Please try again later.",
    });
  }
}
