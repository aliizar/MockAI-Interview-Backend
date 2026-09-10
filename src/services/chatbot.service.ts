import Groq from "groq-sdk";
import prisma from "../lib/prisma.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_1,
});

export async function processChat(
  userId: number,
  message: string,
  conversationId?: number,
) {
  let conversation;

  if (conversationId) {
    conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }
  } else {
    conversation = await prisma.chatConversation.create({
      data: {
        userId,
        title: message.slice(0, 50),
      },
    });
  }

  const previousMessages = await prisma.chatMessage.findMany({
    where: {
      conversationId: conversation.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const messages = [
    {
      role: "system" as const,
      content: `
You are InterviewAI's AI career and interview assistant.

Help users with:
- Technical interview preparation
- Behavioral and HR interview preparation
- Resume and ATS questions
- Career guidance
- Job preparation
- Software development questions
- Frontend and backend development
- General interview-related questions

Be helpful, accurate, concise, and professional.

Use the conversation history to understand context and provide relevant follow-up answers.

Do not invent information about the user's experience, skills, resume, or career.

If you do not know something, say so clearly.
      `.trim(),
    },
    ...previousMessages.map((chatMessage) => ({
      role:
        chatMessage.role === "USER"
          ? ("user" as const)
          : ("assistant" as const),
      content: chatMessage.content,
    })),
  ];

  const aiResponse = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    reasoning_effort: "low",
    messages,
  });

  const reply = aiResponse.choices[0]?.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Invalid AI response");
  }

  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: reply,
    },
  });

  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: reply!,
    },
  });

  await prisma.chatConversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  return {
    conversationId: conversation.id,
    reply,
  };

  return {
    conversationId: conversation.id,
    reply,
  };
}

export async function getChatHistory(userId: number) {
  return prisma.chatConversation.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });
}

export async function getConversation(userId: number, conversationId: number) {
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
}

export async function deleteConversation(
  userId: number,
  conversationId: number,
) {
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  await prisma.chatConversation.delete({
    where: {
      id: conversationId,
    },
  });
}
