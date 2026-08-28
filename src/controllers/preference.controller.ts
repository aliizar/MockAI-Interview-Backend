import { Request, Response } from "express";
import {
  getInterviewPreferences,
  updateInterviewPreferences,
} from "../services/preference.service.js";
import { interviewPreferenceSchema } from "../schemas/preference.schema.js";

export const getPreferences = async (req: Request, res: Response) => {
  try {
    const preferences = await getInterviewPreferences(req.userId!);

    return res.status(200).json({
      preferences,
    });
  } catch (error) {
    console.error("GET PREFERENCES ERROR:");
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong while fetching preferences",
    });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const validation = interviewPreferenceSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid preference data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const preferences = await updateInterviewPreferences(
      req.userId!,
      validation.data,
    );

    return res.status(200).json({
      message: "Interview preferences updated successfully",
      preferences,
    });
  } catch (error) {
    console.error("UPDATE PREFERENCES ERROR:");
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong while updating preferences",
    });
  }
};
