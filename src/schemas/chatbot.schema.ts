import { z } from "zod";

export const chatSchema = z.object({
  conversationId: z.number().int().positive().optional(),
  message: z.string().trim().min(1, "Message is required"),
});

export type ChatInput = z.infer<typeof chatSchema>;
