import { getWeeklyProgress } from "../services/dashboard.service.js";
import type { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboard.service.js";

export async function getStats(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const stats = await getDashboardStats(req.userId);

    return res.status(200).json({
      message: "Dashboard stats fetched successfully",
      stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      message: "Failed to fetch dashboard stats",
    });
  }
}

export async function getProgress(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const progress = await getWeeklyProgress(req.userId);

    return res.status(200).json({
      message: "Weekly progress fetched successfully",
      progress,
    });
  } catch (error) {
    console.error("Get weekly progress error:", error);

    return res.status(500).json({
      message: "Failed to fetch weekly progress",
    });
  }
}
