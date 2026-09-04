import prisma from "../lib/prisma.js";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "SUCCESS" | "ERROR" | "REMINDER";
  createdAt: Date;
}

export async function getUserNotifications(
  userId: number,
): Promise<Notification[]> {
  const latestCompleted = await prisma.interview.findFirst({
    where: {
      userId,
      status: "COMPLETED",
    },
    orderBy: {
      endedAt: "desc",
    },
    select: {
      id: true,
      role: true,
      overallScore: true,
      endedAt: true,
    },
  });

  const latestFailed = await prisma.interview.findFirst({
    where: {
      userId,
      status: "FAILED",
    },
    orderBy: {
      endedAt: "desc",
    },
    select: {
      id: true,
      role: true,
      endedAt: true,
    },
  });

  const notifications: Notification[] = [];

  // Latest failed interview
  if (latestFailed) {
    notifications.push({
      id: `failed-${latestFailed.id}`,
      title: "Interview Failed",
      message:
        "Your latest interview could not be completed. Please try again later.",
      type: "ERROR",
      createdAt: latestFailed.endedAt ?? new Date(),
    });
  }

  // Latest completed interview
  if (latestCompleted) {
    notifications.push({
      id: `completed-${latestCompleted.id}`,
      title: "Interview Completed",
      message:
        latestCompleted.overallScore !== null
          ? `Your ${latestCompleted.role} interview was completed with a score of ${Math.round(
              latestCompleted.overallScore,
            )}%.`
          : `Your ${latestCompleted.role} interview was completed successfully.`,
      type: "SUCCESS",
      createdAt: latestCompleted.endedAt ?? new Date(),
    });

    // ONE practice reminder
    const lastInterviewDate = latestCompleted.endedAt ?? new Date();

    const now = new Date();

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const daysSinceLastInterview = Math.floor(
      (now.getTime() - lastInterviewDate.getTime()) / millisecondsPerDay,
    );

    if (daysSinceLastInterview >= 2) {
      notifications.push({
        id: "practice-reminder",
        title: "Keep Practicing",
        message: `You haven't practiced an interview for ${daysSinceLastInterview} days.`,
        type: "REMINDER",
        createdAt: now,
      });
    }
  } else {
    // No completed interviews yet
    notifications.push({
      id: "start-practicing",
      title: "Start Practicing",
      message:
        "You haven't completed an interview yet. Start your first practice interview today.",
      type: "REMINDER",
      createdAt: new Date(),
    });
  }

  return notifications.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
