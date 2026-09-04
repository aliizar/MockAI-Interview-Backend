import { Request, Response } from "express";
import { getUserNotifications } from "../services/notification.service.js";

export async function getNotifications(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const notifications = await getUserNotifications(req.userId);

    return res.status(200).json({
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);

    return res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
}
