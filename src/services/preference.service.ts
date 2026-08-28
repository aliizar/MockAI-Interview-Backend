import prisma from "../lib/prisma.js";
import type { InterviewPreferenceInput } from "../schemas/preference.schema.js";

export const getInterviewPreferences = async (userId: number) => {
  let preferences = await prisma.interviewPreference.findUnique({
    where: {
      userId,
    },
  });

  if (!preferences) {
    preferences = await prisma.interviewPreference.create({
      data: {
        userId,
      },
    });
  }

  return preferences;
};

export const updateInterviewPreferences = async (
  userId: number,
  data: InterviewPreferenceInput,
) => {
  const preferences = await prisma.interviewPreference.upsert({
    where: {
      userId,
    },
    update: {
      role: data.role,
      difficulty: data.difficulty,
      interviewType: data.interviewType,
      duration: data.duration,
      rememberHistory: data.rememberHistory,
      recommendations: data.recommendations,
    },
    create: {
      userId,
      role: data.role,
      difficulty: data.difficulty,
      interviewType: data.interviewType,
      duration: data.duration,
      rememberHistory: data.rememberHistory,
      recommendations: data.recommendations,
    },
  });

  return preferences;
};
