import { z } from "zod";

/**
 * 🧠 STRICT INPUT CONTRACT
 * This is the ONLY allowed shape for /decision
 */

export const DecisionRequestSchema = z.object({
  userId: z.string(),
  name: z.string(),

  location: z.object({
    state: z.string().nullable(),
    county: z.string().nullable(),
    region: z.string().nullable(),
    country: z.string().default("US"),
  }),

  financials: z.object({
    revenue: z.number().nonnegative(),
    expenses: z.number().nonnegative(),
  }),

  metadata: z.object({
    type: z.string().nullable(),
    acres: z.number().nonnegative(),
  }),
});

export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;
