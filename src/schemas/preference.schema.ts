import { z } from "zod";

export const interviewPreferenceSchema = z.object({
  role: z.string().min(1, "Role is required"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  interviewType: z.enum(["Technical", "Behavioral", "HR", "Mixed"]),
  duration: z
    .number()
    .int()
    .refine(
      (value) => [10, 20, 30].includes(value),
      "Duration must be 10, 20, or 30 minutes",
    ),
  rememberHistory: z.boolean(),
  recommendations: z.boolean(),
});

export type InterviewPreferenceInput = z.infer<
  typeof interviewPreferenceSchema
>;
