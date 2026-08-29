import { Request, Response } from "express";
import {
  createInterview,
  createInterviewQuestion,
  getInterviewContext,
  saveInterviewAnswer,
} from "../services/interview.service.js";
import {
  generateFirstQuestion,
  generateNextQuestion,
} from "../services/ai/ai.service.js";

export async function startInterview(req: Request, res: Response) {
  try {
    const { role, difficulty, interviewType, duration } = req.body;

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

    const interview = await createInterview({
      userId: req.userId,
      role,
      difficulty,
      interviewType,
      duration: Number(duration),
    });

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

    return res.status(500).json({
      message: "Failed to start interview",
    });
  }
}

export async function submitInterviewAnswer(req: Request, res: Response) {
  try {
    const interviewId = Number(req.params.interviewId);
    const { answer } = req.body;

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

    if (!answer || typeof answer !== "string") {
      return res.status(400).json({
        message: "Answer is required",
      });
    }

    // 1. Save candidate answer
    await saveInterviewAnswer(interviewId, req.userId, answer.trim());

    // 2. Get complete interview context
    const context = await getInterviewContext(interviewId, req.userId);

    // 3. Ask Gemini for the next question
    const nextQuestion = await generateNextQuestion(context);

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
    });
  } catch (error) {
    console.error("Submit answer and generate next question failed:", error);

    if (error instanceof Error) {
      if (
        error.message === "Active interview not found" ||
        error.message === "Interview not found"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "No unanswered question found") {
        return res.status(400).json({
          message: error.message,
        });
      }
    }

    return res.status(500).json({
      message: "Failed to process interview answer",
    });
  }
}
