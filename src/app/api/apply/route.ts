import { NextResponse } from "next/server";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId = "unknown",
      eventType = "PIPELINE_RUN",
      decision,
      compositeScore,
      riskScore,
      input,
      output,
      trace,
    } = body;

    // Basic validation (fail fast, deterministic behavior)
    if (!decision) {
      return NextResponse.json(
        { ok: false, error: "Missing decision" },
        { status: 400 }
      );
    }

    if (
      typeof compositeScore !== "number" ||
      typeof riskScore !== "number"
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid scores" },
        { status: 400 }
      );
    }

    // 🔒 ALL AUDIT WRITES NOW FLOW THROUGH CANONICAL WRITER
    const auditRecord = await writeAuditEvent({
      userId,
      eventType,
      decision,
      compositeScore,
      riskScore,
      input,
      output,
      trace,
    });

    return NextResponse.json({
      ok: true,
      auditId: auditRecord.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
