import { NextResponse } from "next/server";
import postgres from "postgres";
import { verifyAuditChain } from "@/lib/audit"; // we will wire this to your existing modules

export async function GET() {
  const sql = postgres(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT *
    FROM audit_events
    ORDER BY created_at ASC
  `;

  try {
    const result = verifyAuditChain(rows);

    return NextResponse.json({
      ok: true,
      valid: result.valid,
      total: rows.length,
      brokenIndex: result.brokenIndex ?? null,
      brokenRow: result.brokenRow ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}
