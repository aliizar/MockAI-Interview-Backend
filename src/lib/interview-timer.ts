export type InterviewStage = "NORMAL" | "FINAL" | "EXPIRED";

interface InterviewTimerInput {
    remainingSeconds: number;
    duration: number;
}

export interface InterviewTimer {
    remainingSeconds: number;
    stage: InterviewStage;
    isExpired: boolean;
    isFinalStage: boolean;
}

export function getInterviewTimer({
    remainingSeconds,
    duration,
}: InterviewTimerInput): InterviewTimer {
    const durationSeconds = duration * 60;

    const safeRemainingSeconds = Math.max(
        0,
        Math.min(remainingSeconds, durationSeconds),
    );

    const isExpired = safeRemainingSeconds <= 0;

    // Last 2 minutes are considered the final stage.
    const finalStageSeconds = Math.min(120, durationSeconds);

    const isFinalStage =
        !isExpired &&
        safeRemainingSeconds <= finalStageSeconds;

    let stage: InterviewStage = "NORMAL";

    if (isExpired) {
        stage = "EXPIRED";
    } else if (isFinalStage) {
        stage = "FINAL";
    }

    return {
        remainingSeconds: safeRemainingSeconds,
        stage,
        isExpired,
        isFinalStage,
    };
}