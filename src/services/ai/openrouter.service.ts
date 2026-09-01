import { interviewEvaluationSchema } from "../../schemas/interview-evaluation.schema.js";
import { EvaluationContext } from "../../types/interview-evaluator-types.js";
export async function evaluateInterviewWithOpenRouter(
  context: EvaluationContext,
) {
  const conversation = context.conversation
    .map(
      (item) => `
Question ${item.questionNumber}
Type: ${item.type}

Question:
${item.question}

Candidate Answer:
${item.answer}
`,
    )
    .join("\n");

  const basePrompt = `
You are an expert professional interview evaluator.

Evaluate the candidate's COMPLETE interview performance.

INTERVIEW INFORMATION

Role: ${context.role}
Difficulty: ${context.difficulty}
Interview Type: ${context.interviewType}
Duration: ${context.duration} minutes

COMPLETE INTERVIEW

${conversation}

EVALUATION RULES

Evaluate every answered question individually.

For each question:
- Give a score from 0 to 10.
- Decimals are allowed.
- Provide specific and useful feedback.
- Evaluate the answer according to its question type.
- Consider previous questions and answers when evaluating FOLLOW_UP questions.

TECHNICAL questions:
Evaluate correctness, depth of knowledge, practical understanding, and accuracy.

BEHAVIORAL questions:
Evaluate communication, clarity, experience, reasoning, ownership, and how the candidate handled the situation.

SITUATIONAL questions:
Evaluate decision-making, reasoning, trade-offs, and practical approach.

FOLLOW_UP questions:
Evaluate the answer in the context of the previous discussion.

Overall evaluation:
- overallScore represents the complete interview performance.
- technicalScore evaluates technical knowledge.
- communicationScore evaluates communication.
- problemSolvingScore evaluates reasoning and problem-solving.
- Scores MUST be between 0 and 10.
- Be realistic and do not give high scores simply because an answer exists.
- Do not invent information that the candidate did not provide.

IMPORTANT OUTPUT RULES

Return ONLY valid JSON.

Do NOT return:
- Markdown
- Code fences
- Explanations before the JSON
- Explanations after the JSON
- Additional fields

Use EXACTLY this structure:

{
  "overallScore": 0,
  "technicalScore": 0,
  "communicationScore": 0,
  "problemSolvingScore": 0,
  "strengths": [],
  "weaknesses": [],
  "feedback": "",
  "recommendations": [],
  "questionEvaluations": [
    {
      "questionNumber": 1,
      "score": 0,
      "feedback": ""
    }
  ]
}

questionEvaluations MUST contain exactly one evaluation for EVERY answered question.

questionNumber MUST match the original question number.

Return ONLY the JSON object.
`;

  const maxAttempts = 2;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let prompt = basePrompt;

      if (attempt > 1) {
        prompt = `
Your previous evaluation response failed validation.

You MUST correct the response and return the COMPLETE evaluation again.

Validation error:
${String(lastError)}

IMPORTANT:
- Return ONLY valid JSON.
- Follow the exact field names.
- Do not add fields.
- Do not remove fields.
- Scores must be numbers from 0 to 10.
- questionEvaluations must contain every answered question.

${basePrompt}
`;
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-v4-flash",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional interview evaluation system. Return only valid JSON.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `OpenRouter API error: ${response.status} ${JSON.stringify(data)}`,
        );
      }

      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("OpenRouter returned an empty evaluation");
      }

      const parsed = JSON.parse(content);

      const validationResult = interviewEvaluationSchema.safeParse(parsed);

      if (!validationResult.success) {
        lastError = validationResult.error;

        console.error(
          `Evaluation validation failed on attempt ${attempt}:`,
          validationResult.error.issues,
        );

        continue;
      }

      return validationResult.data;
    } catch (error) {
      lastError = error;

      console.error(`OpenRouter evaluation attempt ${attempt} failed:`, error);
    }
  }

  throw new Error(
    `OpenRouter evaluation failed after ${maxAttempts} attempts: ${String(lastError)}`,
  );
}
