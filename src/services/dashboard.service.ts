import prisma from "../lib/prisma.js";
import { startOfWeek } from "date-fns";
const WEEKLY_PRACTICE_GOAL = 5;

function getStartOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getStartOfWeek(date: Date) {
  const start = getStartOfDay(date);
  const day = start.getDay();

  // Convert Sunday = 0 to Monday-based week.
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  start.setDate(start.getDate() - daysSinceMonday);

  return start;
}

function getStartOfPreviousWeek(date: Date) {
  const startOfWeek = getStartOfWeek(date);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  return startOfWeek;
}

function calculateAverageScore(interviews: { overallScore: number | null }[]) {
  const scoredInterviews = interviews.filter(
    (interview) => interview.overallScore !== null,
  );

  if (scoredInterviews.length === 0) {
    return null;
  }

  const total = scoredInterviews.reduce(
    (sum, interview) => sum + (interview.overallScore ?? 0),
    0,
  );

  return total / scoredInterviews.length;
}

function calculateImprovement(
  currentScore: number | null,
  previousScore: number | null,
) {
  if (currentScore === null || previousScore === null) {
    return null;
  }

  if (previousScore === 0) {
    return null;
  }

  return ((currentScore - previousScore) / previousScore) * 100;
}

function calculateInterviewStreak(interviewDates: Date[]) {
  if (interviewDates.length === 0) {
    return 0;
  }

  const uniqueDays = new Set(
    interviewDates.map((date) => getStartOfDay(date).getTime()),
  );

  const sortedDays = Array.from(uniqueDays)
    .sort((a, b) => b - a)
    .map((time) => new Date(time));

  const today = getStartOfDay(new Date());
  const latestDay = sortedDays[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const latestIsToday = latestDay.getTime() === today.getTime();
  const latestIsYesterday = latestDay.getTime() === yesterday.getTime();

  if (!latestIsToday && !latestIsYesterday) {
    return 0;
  }

  let streak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const previousDay = sortedDays[i - 1];
    const currentDay = sortedDays[i];

    const differenceInDays =
      (previousDay.getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24);

    if (differenceInDays !== 1) {
      break;
    }

    streak++;
  }

  return streak;
}

export async function getDashboardStats(userId: number) {
  const now = new Date();

  const startOfWeek = getStartOfWeek(now);
  const startOfPreviousWeek = getStartOfPreviousWeek(now);

  const [
    currentWeekInterviews,
    previousWeekInterviews,
    latestInterview,
    practiceInterviews,
    streakInterviews,
  ] = await Promise.all([
    prisma.interview.findMany({
      where: {
        userId,
        status: "COMPLETED",
        overallScore: {
          not: null,
        },
        startedAt: {
          gte: startOfWeek,
        },
      },
      select: {
        overallScore: true,
      },
    }),

    prisma.interview.findMany({
      where: {
        userId,
        status: "COMPLETED",
        overallScore: {
          not: null,
        },
        startedAt: {
          gte: startOfPreviousWeek,
          lt: startOfWeek,
        },
      },
      select: {
        overallScore: true,
      },
    }),

    prisma.interview.findFirst({
      where: {
        userId,
        status: "COMPLETED",
        overallScore: {
          not: null,
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        role: true,
        overallScore: true,
        startedAt: true,
      },
    }),

    prisma.interview.findMany({
      where: {
        userId,
        status: "COMPLETED",
        startedAt: {
          gte: startOfWeek,
        },
      },
      select: {
        id: true,
      },
    }),

    prisma.interview.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        startedAt: true,
      },
    }),
  ]);

  const currentWeekScore = calculateAverageScore(currentWeekInterviews);
  const previousWeekScore = calculateAverageScore(previousWeekInterviews);

  const improvement = calculateImprovement(currentWeekScore, previousWeekScore);

  const interviewStreak = calculateInterviewStreak(
    streakInterviews.map((interview) => interview.startedAt),
  );

  return {
    overallScore: {
      value: currentWeekScore,
      improvement,
    },

    lastInterview: latestInterview
      ? {
          id: latestInterview.id,
          score: latestInterview.overallScore,
          role: latestInterview.role,
          startedAt: latestInterview.startedAt,
        }
      : null,

    interviewStreak,

    practiceGoal: {
      completed: practiceInterviews.length,
      target: WEEKLY_PRACTICE_GOAL,
    },
  };
}

export async function getWeeklyProgress(userId: number) {
  const start = startOfWeek(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const interviews = await prisma.interview.findMany({
    where: {
      userId,
      status: "COMPLETED",
      overallScore: {
        not: null,
      },
      endedAt: {
        gte: start,
        lt: end,
      },
    },
    select: {
      overallScore: true,
      endedAt: true,
    },
    orderBy: {
      endedAt: "asc",
    },
  });

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return days.map((day, index) => {
    const dayInterviews = interviews.filter((interview) => {
      if (!interview.endedAt) {
        return false;
      }

      const date = interview.endedAt.getDay();
      const dayIndex = date === 0 ? 6 : date - 1;

      return dayIndex === index;
    });

    if (dayInterviews.length === 0) {
      return {
        day,
        score: null,
      };
    }

    const total = dayInterviews.reduce(
      (sum, interview) => sum + (interview.overallScore ?? 0),
      0,
    );

    const average = total / dayInterviews.length;

    return {
      day,
      score: Math.round(average * 10),
    };
  });
}
