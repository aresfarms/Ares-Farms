import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ledger } from "@/lib/schema";
import { validateCanonicalChain } from "@/lib/ledger/validateCanonicalChain";

export async function GET() {
  const entries = await db.select().from(ledger);

  const validation = validateCanonicalChain([...entries]);

  const fixes = validation.issues.map((i) => ({
    id: i.id,
    issue: i.issue,
    severity: i.issue === "CHAIN_BREAK" ? "CRITICAL" : "MEDIUM",
    proposedAction:
      i.issue === "CHAIN_BREAK"
        ? "Re-link prevHash from nearest valid predecessor"
        : i.issue === "MISSING_HASH"
        ? "Recompute eventHash from canonical payload"
        : "Recompute full entry hash",
  }));

  return NextResponse.json({
    ok: true,
    plan: {
      totalIssues: fixes.length,
      fixes,
    },
  });
}
