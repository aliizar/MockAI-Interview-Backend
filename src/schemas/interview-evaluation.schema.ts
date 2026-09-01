import { z } from "zod";

export const interviewQuestionEvaluationSchema = z.object({
  questionNumber: z.number().int().positive(),
  score: z.number().min(0).max(10),
  feedback: z.string().min(1),
});

export const interviewEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(10),
  technicalScore: z.number().min(0).max(10),
  communicationScore: z.number().min(0).max(10),
  problemSolvingScore: z.number().min(0).max(10),

  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),

  feedback: z.string().min(1),
  recommendations: z.array(z.string()),

  questionEvaluations: z.array(interviewQuestionEvaluationSchema),
});

export type InterviewEvaluation = z.infer<typeof interviewEvaluationSchema>;
