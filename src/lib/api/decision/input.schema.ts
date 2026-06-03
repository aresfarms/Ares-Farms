import { z } from "zod";

export const DecisionInputSchema = z.object({
  userId: z.string(),
  name: z.string(),

  location: z.object({
    state: z.string().nullable(),
    county: z.string().nullable(),
    region: z.string().nullable(),
    country: z.string().default("US"),
  }),

  financials: z.object({
    revenue: z.number(),
    expenses: z.number(),
  }),

  metadata: z.object({
    type: z.string().nullable(),
    acres: z.number(),
  }),
});

export type DecisionInput = z.infer<typeof DecisionInputSchema>;
