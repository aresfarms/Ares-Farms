import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Deterministic SHA-256 event hash
 * (banking-grade reproducibility rule: same input → same hash always)
 */
function computeEventHash(event: any, prevHash: string | null) {
  const normalized = {
    id: event.id,
    userId: event.userId,
    eventType: event.eventType,
    decision: event.decision,
    compositeScore: event.compositeScore,
    riskScore: event.riskScore,
    input: event.input,
    output: event.output,
    trace: event.trace,
    prevHash,
    createdAt: event.createdAt,
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
}

/**
 * POST /api/ledger/repair
 * GOVERNMENT / BANKING STYLE:
 * - verifies ledger integrity
 * - repairs forward from first broken index
 * - recomputes full hash chain deterministically
 * - persists corrected chain
 */
export async function POST() {
  try {
    // 1. Load full ledger in deterministic order
    const entries = await db
      .select()
      .from(auditEvents)
      .orderBy(asc(auditEvents.createdAt));

    if (!entries.length) {
      return NextResponse.json({
        ok: true,
        message: "Ledger empty",
        repaired: 0,
        chainValid: true,
      });
    }

    let prevHash: string | null = null;
    let brokenIndex: number | null = null;
    let repairedCount = 0;

    const recomputed = [];

    // 2. Recompute full chain
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      const expectedHash = computeEventHash(entry, prevHash);

      const isValid = entry.eventHash === expectedHash;

      if (!isValid && brokenIndex === null) {
        brokenIndex = i;
      }

      const updated = {
        ...entry,
        prevHash,
        eventHash: expectedHash,
        hash: expectedHash,
      };

      if (entry.eventHash !== expectedHash) {
        repairedCount++;
      }

      recomputed.push(updated);
      prevHash = expectedHash;
    }

    // 3. Persist repair (STRICT MODE: overwrite only hash fields)
    for (const entry of recomputed) {
      await db
        .update(auditEvents)
        .set({
          eventHash: entry.eventHash,
          hash: entry.hash,
          prevHash: entry.prevHash,
        })
        .where(eq(auditEvents.id, entry.id));
    }

    // 4. Response (audit-grade transparency)
    return NextResponse.json({
      ok: true,
      repaired: repairedCount,
      brokenIndex,
      total: entries.length,
      chainValid: brokenIndex === null,
      mode: "DETERMINISTIC_REPAIR_V1",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "LEDGER_REPAIR_FAILED",
        message: err?.message ?? "Unknown failure",
      },
      { status: 500 }
    );
  }
}
