import Groq from "groq-sdk";
import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_1,
});

const analysisSchema = z.object({
  atsScore: z.number().min(0).max(100),
  grammarScore: z.number().min(0).max(100),
  missingSkillsCount: z.number().int().min(0),
  keywordCount: z.number().int().min(0),
  formattingSuggestions: z.array(z.string()),
  grammarReview: z.array(z.string()),
  missingSkills: z.array(z.string()),
  recommendedKeywords: z.array(z.string()),
  projects: z.array(
    z.object({
      name: z.string(),
      rating: z.enum(["Excellent", "Good", "Average", "Needs Improvement"]),
      feedback: z.string(),
    }),
  ),
  recommendation: z.string(),
});

export async function processResume(
  file: Express.Multer.File,
  targetRole: string,
) {
  const uploadedFile = await mistral.files.upload({
    file: {
      fileName: file.originalname,
      content: file.buffer,
    },
    purpose: "ocr",
  });

  const signedUrl = await mistral.files.getSignedUrl({
    fileId: uploadedFile.id,
    expiry: 1,
  });

  const ocrResponse = await mistral.ocr.process({
    model: "mistral-ocr-latest",
    document: {
      type: "document_url",
      documentUrl: signedUrl.url,
    },
  });

  const extractedText = ocrResponse.pages
    .map((page) => page.markdown)
    .join("\n\n");

  const aiResponse = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    reasoning_effort: "low",
    messages: [
      {
        role: "system",
        content: `
You are a professional resume analyzer and ATS specialist.

Analyze the provided resume specifically for the target job role.

Evaluate:

* ATS compatibility
* Grammar and writing quality
* Missing technical skills
* Important keywords
* Resume formatting
* Projects and their relevance
* Overall quality

Be realistic and evidence-based.

Do not invent experience, skills, projects, certifications, or education.

Only identify a skill as missing if it would reasonably strengthen the resume for the target role.

For ATS scoring, consider:

* Presence of relevant technical skills
* Relevant keywords for the target role
* Clear section headings
* Readability
* Standard resume structure
* Relevant project or work experience
* Potential ATS parsing issues

For grammar review:

* Identify actual grammar, spelling, wording, or clarity problems.
* Do not invent grammar mistakes.

For formatting suggestions:

* Identify actual formatting or structure improvements.
* Do not criticize formatting that cannot be determined from the extracted resume text.

For projects:

* Analyze every project found in the resume.
* Rate each project as exactly one of:
  "Excellent"
  "Good"
  "Average"
  "Needs Improvement"
* Judge the project based on its relevance to the target role, technical depth, clarity, and demonstrated skills.

For missing skills:

* Compare the resume against reasonable expectations for the target role.
* Only include skills that are genuinely useful for that role and are not already demonstrated in the resume.

For recommended keywords:

* Suggest relevant keywords that would improve ATS matching for the target role.
* Do not simply repeat every skill already present in the resume.

Scores must be between 0 and 100.

Return exactly ONE JSON object.

The root value MUST be an object, never an array.

Every field defined in the schema must be present.

The "recommendation" field must be a single string value.

Do not output JSON fragments.
Do not output multiple JSON values.
Do not wrap the object inside an array.
Do not add any text before or after the JSON object.

Follow the provided JSON schema exactly.
`,
      },
      {
        role: "user",
        content: `
Target Job Role:
${targetRole}

Resume:
${extractedText}
`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            atsScore: {
              type: "number",
              minimum: 0,
              maximum: 100,
            },
            grammarScore: {
              type: "number",
              minimum: 0,
              maximum: 100,
            },
            missingSkillsCount: {
              type: "integer",
              minimum: 0,
            },
            keywordCount: {
              type: "integer",
              minimum: 0,
            },
            formattingSuggestions: {
              type: "array",
              items: {
                type: "string",
              },
            },
            grammarReview: {
              type: "array",
              items: {
                type: "string",
              },
            },
            missingSkills: {
              type: "array",
              items: {
                type: "string",
              },
            },
            recommendedKeywords: {
              type: "array",
              items: {
                type: "string",
              },
            },
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  rating: {
                    type: "string",
                    enum: ["Excellent", "Good", "Average", "Needs Improvement"],
                  },
                  feedback: {
                    type: "string",
                  },
                },
                required: ["name", "rating", "feedback"],
                additionalProperties: false,
              },
            },
            recommendation: {
              type: "string",
            },
          },
          required: [
            "atsScore",
            "grammarScore",
            "missingSkillsCount",
            "keywordCount",
            "formattingSuggestions",
            "grammarReview",
            "missingSkills",
            "recommendedKeywords",
            "projects",
            "recommendation",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = aiResponse.choices[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("Invalid AI response");
  }

  const parsedResponse = JSON.parse(content);
  const analysis = analysisSchema.parse(parsedResponse);

  return {
    filename: file.originalname,
    pages: ocrResponse.pages.length,
    analysis,
  };
}
