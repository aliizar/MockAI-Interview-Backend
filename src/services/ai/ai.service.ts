import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}

if (!model) {
  throw new Error("GEMINI_MODEL is not defined");
}

const ai = new GoogleGenAI({
  apiKey,
});

interface InterviewContext {
  role: string;
  difficulty: string;
  interviewType: string;
  duration: number;
  conversation: {
    question: string;
    answer: string;
    type: string;
  }[];
}

interface InterviewSetup {
  role: string;
  difficulty: string;
  interviewType: string;
  duration: number;
}

export interface FirstQuestion {
  question: string;
  type: "TECHNICAL" | "BEHAVIORAL" | "SITUATIONAL";
}

export async function generateFirstQuestion(
  setup: InterviewSetup,
): Promise<FirstQuestion> {
  const prompt = `
You are an expert interviewer conducting a live job interview.

Interview details:
- Job Role: ${setup.role}
- Difficulty: ${setup.difficulty}
- Interview Type: ${setup.interviewType}
- Interview Duration: ${setup.duration} minutes

Generate exactly ONE opening interview question.

Requirements:
- The question must be relevant to the job role.
- Match the requested difficulty.
- Match the requested interview type.
- It must be suitable as the FIRST question of a live interview.
- It must not depend on any previous question or answer.
- Do not generate multiple questions.

Return the result using the requested JSON schema.
`;

  const response = await ai.models.generateContent({
    model: model!,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          question: {
            type: "string",
          },
          type: {
            type: "string",
            enum: ["TECHNICAL", "BEHAVIORAL", "SITUATIONAL"],
          },
        },
        required: ["question", "type"],
      },
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return JSON.parse(text) as FirstQuestion;
}

export async function generateNextQuestion(
  context: InterviewContext,
  remainingSeconds: number,
  stage: "NORMAL" | "FINAL" | "EXPIRED",
): Promise<FirstQuestion> {
  const conversation = context.conversation
    .map(
      (item, index) => `
Question ${index + 1}:
${item.question}

Candidate Answer:
${item.answer}

Question Type:
${item.type}
`,
    )
    .join("\n");

  const prompt = `
You are conducting a live job interview.

Interview details:

Job Role: ${context.role}
Difficulty: ${context.difficulty}
Interview Type: ${context.interviewType}
Interview Duration: ${context.duration} minutes
Time remaining: ${remainingSeconds} seconds
Interview stage: ${stage}
Here is the interview conversation so far:

${conversation}

Based on the candidate's previous answers, generate EXACTLY ONE
next interview question.

Rules:

- The question must be relevant to the candidate's previous answer.
- Continue the conversation naturally.
- Do not repeat a previous question.
- Use the candidate's answer to decide what to ask next.
- If the candidate mentioned a technology, project, concept,
  or experience, you may ask a deeper follow-up question about it.
- Match the requested interview difficulty.
- Keep the question appropriate for a live interview.
- Do not generate an answer.
- Do not generate multiple questions.

Interview timing rules:

If the interview stage is NORMAL:
- Continue the adaptive interview naturally.
- Ask a relevant question based on the candidate's previous answer.

If the interview stage is FINAL:
- This may be the final question of the interview.
- Ask ONE concise closing question.
- The question should be answerable within the remaining time.
- Do not start a long multi-part technical problem.
- The question does not have to be behavioral.
- Choose the most appropriate closing question based on the conversation.
- It can ask the candidate to reflect, summarize their approach,
  explain a key decision, or provide a final perspective.
- Do not mention the timer to the candidate.
- Do not say "this is your final question."

Return ONLY JSON using the requested schema.
`;

  const response = await ai.models.generateContent({
    model: model!,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          question: {
            type: "string",
          },
          type: {
            type: "string",
            enum: ["TECHNICAL", "BEHAVIORAL", "SITUATIONAL", "FOLLOW_UP"],
          },
        },
        required: ["question", "type"],
      },
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return JSON.parse(text) as FirstQuestion;
}
