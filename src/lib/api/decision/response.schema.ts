import { z } from "zod";

export const DecisionResponseSchema = z.object({
  decision: z.enum(["APPROVE", "REVIEW", "REJECT"]),
  compositeScore: z.number(),

  breakdown: z.object({
    financialScore: z.number(),
    complianceScore: z.number(),
    riskScore: z.number(),
  }),

  metadata: z.object({
    region: z.string().nullable(),
    county: z.string().nullable(),
    type: z.string().nullable(),
  }),
});

export type DecisionResponse = z.infer<typeof DecisionResponseSchema>;
