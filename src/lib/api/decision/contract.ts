import { z } from "zod";
import { runPipeline } from "@/lib/pipeline/orchestrator";

/**
 * ============================================
 * ENTERPRISE DECISION CONTRACT LAYER
 * SINGLE SOURCE OF TRUTH FOR API SAFETY
 * ============================================
 */

/**
 * VERSIONING (future-proofing SaaS evolution)
 */
export const API_VERSION = "v1";

/**
 * ============================================
 * INPUT CONTRACT (STRICT - NO SURPRISES)
 * ============================================
 */
export const DecisionRequestSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),

  location: z.object({
    state: z.string().nullable(),
    county: z.string().nullable(),
    region: z.string().nullable(),
    country: z.string().default("US"),
  }),

  financials: z.object({
    revenue: z.number().finite().nonnegative(),
    expenses: z.number().finite().nonnegative(),
  }),

  metadata: z.object({
    type: z.string().nullable(),
    acres: z.number().finite().nonnegative(),
  }),
});

export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;

/**
 * ============================================
 * OUTPUT CONTRACT (STRICT SaaS RESPONSE)
 * ============================================
 */
export const DecisionResponseSchema = z.object({
  apiVersion: z.literal(API_VERSION),

  success: z.boolean(),

  data: z.object({
    decision: z.enum(["APPROVE", "REVIEW", "REJECT"]),
    compositeScore: z.number(),

    breakdown: z.object({
      financialScore: z.number(),
      complianceScore: z.number(),
      riskScore: z.number(),
    }),

    ranking: z.object({
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
      adjustedScore: z.number(),
    }),

    metadata: z.object({
      region: z.string().nullable(),
      county: z.string().nullable(),
      type: z.string().nullable(),
    }),

    explanation: z.any(),
  }),

  trace: z.any().optional(),

  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

export type DecisionResponse = z.infer<typeof DecisionResponseSchema>;

/**
 * ============================================
 * ENTERPRISE SAFE ENTRY POINT
 * (ONLY WAY INTO PIPELINE)
 * ============================================
 */
export async function executeDecisionContract(rawInput: unknown) {
  try {
    /**
     * 1. STRICT INPUT VALIDATION
     */
    const input = DecisionRequestSchema.parse(rawInput);

    /**
     * 2. PIPELINE EXECUTION (UNCHANGED CORE LOGIC)
     */
    const result = await runPipeline(input);

    /**
     * 3. NORMALIZE OUTPUT INTO CONTRACT SHAPE
     */
    const response = {
      apiVersion: API_VERSION,
      success: true,

      data: {
        decision: result.decision.decision,
        compositeScore: result.decision.compositeScore,

        breakdown: result.decision.breakdown,

        ranking: result.ranking,

        metadata: result.decision.metadata,

        explanation: result.explanation,
      },

      trace: result.trace,
    };

    /**
     * 4. STRICT OUTPUT VALIDATION (CRITICAL SAFETY GATE)
     */
    return DecisionResponseSchema.parse(response);
  } catch (err: any) {
    /**
     * 5. GUARANTEED ERROR CONTRACT (NO RAW STACK LEAKS)
     */
    return DecisionResponseSchema.parse({
      apiVersion: API_VERSION,
      success: false,

      data: {
        decision: "REJECT",
        compositeScore: 0,

        breakdown: {
          financialScore: 0,
          complianceScore: 0,
          riskScore: 0,
        },

        ranking: {
          priority: "LOW",
          adjustedScore: 0,
        },

        metadata: {
          region: null,
          county: null,
          type: null,
        },

        explanation: {
          error: true,
        },
      },

      error: {
        code: "PIPELINE_FAILURE",
        message: err?.message ?? "Unknown error",
      },
    });
  }
}
