import { NextResponse } from "next/server";
import { rankingEngine } from "@/lib/engine/rankingEngine";

/**
 * 📊 PHASE 8 — PORTFOLIO RANKING API
 * Multi-farm comparison endpoint
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    /**
     * EXPECTED INPUT:
     * {
     *   farms: FarmDecisionResponse[]
     * }
     */
    const farms = body?.farms || [];

    const result = rankingEngine(farms);

    return NextResponse.json({
      success: true,
      ...result,
      system: {
        pipelineVersion: "phase-8-ranking",
        status: "portfolio",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        ranked: [],
        portfolio: {
          averageSba: 0,
          averageRisk: 0,
          averageSurvivability: 0,
          totalApplicants: 0,
        },
        system: {
          pipelineVersion: "phase-8-fallback",
          status: "fallback",
        },
        error: err?.message || "Ranking engine error",
      },
      { status: 200 }
    );
  }
}
