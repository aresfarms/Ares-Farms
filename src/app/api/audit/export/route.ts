import postgres from "postgres";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const sql = postgres(process.env.DATABASE_URL!);

function hash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// -------------------------------------
// OPTIONAL: integrity verification
// -------------------------------------
async function verifyChain(rows: any[]) {
  let prev = "GENESIS";

  for (const r of rows) {
    const expected = hash(
      JSON.stringify({
        userId: r.user_id,
        eventType: r.event_type,
        decision: r.decision,
        compositeScore: r.composite_score,
        riskScore: r.risk_score,
        input: r.input,
        output: r.output,
        trace: r.trace,
        prevHash: prev,
      })
    );

    if (expected !== r.event_hash) {
      throw new Error("AUDIT CHAIN INVALID");
    }

    prev = r.event_hash;
  }

  return true;
}

// -------------------------------------
// MAIN EXPORT ENDPOINT
// -------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const verify = searchParams.get("verify") === "true";

    // -------------------------------------
    // QUERY FILTERING
    // -------------------------------------
    const rows = userId
      ? await sql`
          select *
          from audit_events
          where user_id = ${userId}
          order by created_at asc
        `
      : await sql`
          select *
          from audit_events
          order by created_at asc
        `;

    // -------------------------------------
    // OPTIONAL INTEGRITY CHECK
    // -------------------------------------
    if (verify) {
      await verifyChain(rows);
    }

    // -------------------------------------
    // EXPORT PAYLOAD
    // -------------------------------------
    const exportData = {
      exportedAt: new Date().toISOString(),
      recordCount: rows.length,
      verified: verify,
      chainStart: rows[0]?.event_hash ?? null,
      chainEnd: rows[rows.length - 1]?.event_hash ?? null,
      data: rows,
    };

    return NextResponse.json(exportData, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "AUDIT_EXPORT_FAILED",
        message: err.message,
      },
      { status: 500 }
    );
  }
}
