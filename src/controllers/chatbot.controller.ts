import { Request, Response } from "express";
import { chatSchema } from "../schemas/chatbot.schema.js";
import {
  deleteConversation as deleteConversationService,
  getChatHistory as getChatHistoryService,
  getConversation as getConversationService,
  processChat,
} from "../services/chatbot.service.js";

export async function chat(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { conversationId, message } = chatSchema.parse(req.body);

    const result = await processChat(req.userId, message, conversationId);

    return res.status(200).json({
      message: "Chat response generated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Failed to process chat:", error);

    return res.status(500).json({
      message: "Failed to process chat",
    });
  }
}

export async function getChatHistory(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const conversations = await getChatHistoryService(req.userId);

    return res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error("Failed to fetch chat history:", error);

    return res.status(500).json({
      message: "Failed to fetch chat history",
    });
  }
}

export async function getConversation(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const conversationId = Number(req.params.conversationId);

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await getConversationService(
      req.userId,
      conversationId,
    );

    return res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error("Failed to fetch conversation:", error);

    return res.status(500).json({
      message: "Failed to fetch conversation",
    });
  }
}

export async function deleteConversation(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const conversationId = Number(req.params.conversationId);

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    await deleteConversationService(req.userId, conversationId);

    return res.status(200).json({
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete conversation:", error);

    return res.status(500).json({
      message: "Failed to delete conversation",
    });
  }
}
