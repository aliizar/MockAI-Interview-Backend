export type InterviewStage = "NORMAL" | "FINAL" | "EXPIRED";

interface InterviewTimerInput {
  startedAt: Date;
  duration: number;
}

export interface InterviewTimer {
  elapsedSeconds: number;
  remainingSeconds: number;
  stage: InterviewStage;
  isExpired: boolean;
  isFinalStage: boolean;
}

export function getInterviewTimer({
  startedAt,
  duration,
}: InterviewTimerInput): InterviewTimer {
  const now = Date.now();
  const startTime = startedAt.getTime();

  const durationSeconds = duration * 60;
  const elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));

  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

  const isExpired = remainingSeconds <= 0;

  // Last 2 minutes are considered the final stage.
  const finalStageSeconds = Math.min(120, durationSeconds);

  const isFinalStage = !isExpired && remainingSeconds <= finalStageSeconds;

  let stage: InterviewStage = "NORMAL";

  if (isExpired) {
    stage = "EXPIRED";
  } else if (isFinalStage) {
    stage = "FINAL";
  }

  return {
    elapsedSeconds,
    remainingSeconds,
    stage,
    isExpired,
    isFinalStage,
  };
}
