import type { NextApiRequest, NextApiResponse } from "next";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
}

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { prompt } = req.body as {
    prompt?: string;
  };

  if (!prompt) {
    return res.status(400).json({
      error: "No prompt in the request",
    });
  }

  try {
    const result = streamText({
      model: google("gemini-3.1-flash-lite"),
      prompt,
    });

    result.pipeTextStreamToResponse(res);
  } catch (error) {
    console.error("Generation error:", error);

    return res.status(500).json({
      error: "Failed to generate email",
    });
  }
}