import { z } from "zod";

export const emailClassificationSchema = z.object({
  intent: z.enum([
    "inquiry",
    "complaint",
    "invoice",
    "follow-up",
  ]),

  urgency: z.enum([
    "low",
    "medium",
    "high",
  ]),
});

export type EmailClassification =
  z.infer<typeof emailClassificationSchema>;