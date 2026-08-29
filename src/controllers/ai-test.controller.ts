import { Request, Response } from "express";
import { generateNextQuestion } from "../services/ai/ai.service.js";

export async function testNextQuestion(_req: Request, res: Response) {
  try {
    const nextQuestion = await generateNextQuestion({
      role: "Frontend Developer",
      difficulty: "Intermediate",
      interviewType: "Mixed",
      duration: 30,
      conversation: [
        {
          question:
            "Welcome to the interview! To get started, could you briefly introduce yourself and walk me through a recent frontend project you worked on, highlighting a technical challenge you encountered while building the user interface?",
          answer:
            "I have worked with React for about two years. I have built several frontend applications using React, TypeScript, and Redux Toolkit.",
          type: "BEHAVIORAL",
        },
      ],
    });

    return res.status(200).json({
      message: "Next question generated successfully",
      question: nextQuestion,
    });
  } catch (error) {
    console.error("Next question test failed:", error);

    return res.status(500).json({
      message: "Next question generation failed",
    });
  }
}
