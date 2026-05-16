import { NextResponse } from "next/server";
import { orchestrateFarmDecision } from "@/lib/engine/orchestrator";
import { EMPTY_FARM_RESPONSE } from "@/lib/contracts/farmDecisionContract";

/**
 * 🧠 FARM LOAN DECISION API ROUTE
 * Phase 5–6 orchestrated + contract-safe version
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = orchestrateFarmDecision(body);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("applyEngine error:", err);

    return NextResponse.json(
      {
        ...EMPTY_FARM_RESPONSE,
        system: {
          pipelineVersion: "phase-6-fallback",
          status: "fallback",
        },
      },
      {
        status: 200, // keep UI stable, never break frontend
      }
    );
  }
}
