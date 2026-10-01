import type { NextApiRequest, NextApiResponse } from "next";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { emailClassificationSchema } from "../../schemas/emailClassification";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { email } = req.body as {
    email?: string;
  };

  if (!email || typeof email !== "string") {
    return res.status(400).json({
      error: "A valid email is required",
    });
  }

  try {
    const result = await generateText({
      model: google("gemini-3.1-flash-lite"),

      output: Output.object({
        schema: emailClassificationSchema,
      }),

      prompt: `
Classify the following business email.

Intent definitions:
- inquiry: asking for information, clarification, availability, or an answer
- complaint: expressing dissatisfaction, reporting a problem, or requesting resolution
- invoice: primarily concerning invoices, billing, charges, or payment
- follow-up: continuing or checking progress on an earlier conversation or request

Urgency definitions:
- low: no significant time pressure
- medium: should be handled reasonably soon
- high: explicitly time-sensitive or requires prompt action

Email:
${email}
`,
    });

    return res.status(200).json(result.output);
  } catch (error) {
    console.error("Classification error:", error);

    return res.status(500).json({
      error: "Failed to classify email",
    });
  }
}