import { NextResponse } from "next/server";
import { DecisionInputSchema } from "@/lib/api/decision/input.schema";
import { runPipeline } from "@/lib/pipeline/orchestrator";

/**
 * POST /api/decision
 * SaaS-grade decision endpoint
 */

export async function POST(req: Request) {
  try {
    const raw = await req.json();

    // 1. STRICT INPUT VALIDATION (NO PARTIALS)
    const input = DecisionInputSchema.parse(raw);

    // 2. RUN PIPELINE
    const result = await runPipeline(input);

    // 3. RETURN SAFE OUTPUT ONLY
    return NextResponse.json(
      {
        success: true,
        data: {
          decision: result.decision,
          ranking: result.ranking,
          score: result.score,
          risk: result.risk,
          compliance: result.compliance,
          explanation: result.explanation,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DECISION_FAILED",
          message: err?.message ?? "Unknown error",
        },
      },
      { status: 400 }
    );
  }
}
