import prisma from "../lib/prisma.js";

interface CreateInterviewData {
  userId: number;
  role: string;
  difficulty: string;
  interviewType: string;
  duration: number;
}

interface CreateQuestionData {
  interviewId: number;
  question: string;
  type: "TECHNICAL" | "BEHAVIORAL" | "SITUATIONAL" | "FOLLOW_UP";
  questionNumber: number;
}

export async function createInterview(data: CreateInterviewData) {
  const interview = await (prisma as any).interview.create({
    data: {
      userId: data.userId,
      role: data.role,
      difficulty: data.difficulty,
      interviewType: data.interviewType,
      duration: data.duration,
    },
  });

  return interview;
}

export async function createInterviewQuestion(data: CreateQuestionData) {
  const question = await prisma.interviewQuestion.create({
    data: {
      interviewId: data.interviewId,
      questionNumber: data.questionNumber,
      question: data.question,
      type: data.type,
    },
  });

  return question;
}

export async function saveInterviewAnswer(
  interviewId: number,
  userId: number,
  answer: string,
) {
  const interview = await prisma.interview.findFirst({
    where: {
      id: interviewId,
      userId,
      status: "ACTIVE",
    },
  });

  if (!interview) {
    throw new Error("Active interview not found");
  }

  const question = await prisma.interviewQuestion.findFirst({
    where: {
      interviewId,
      answer: null,
    },
    orderBy: {
      questionNumber: "desc",
    },
  });

  if (!question) {
    throw new Error("No unanswered question found");
  }

  const updatedQuestion = await prisma.interviewQuestion.update({
    where: {
      id: question.id,
    },
    data: {
      answer,
    },
  });

  return updatedQuestion;
}

export async function getInterviewContext(interviewId: number, userId: number) {
  const interview = await prisma.interview.findFirst({
    where: {
      id: interviewId,
      userId,
    },
    include: {
      questions: {
        where: {
          answer: {
            not: null,
          },
        },
        orderBy: {
          questionNumber: "asc",
        },
        select: {
          question: true,
          answer: true,
          type: true,
        },
      },
    },
  });

  if (!interview) {
    throw new Error("Interview not found");
  }

  return {
    role: interview.role,
    difficulty: interview.difficulty,
    interviewType: interview.interviewType,
    duration: interview.duration,
    conversation: interview.questions.map((question) => ({
      question: question.question,
      answer: question.answer!,
      type: question.type,
    })),
  };
}
