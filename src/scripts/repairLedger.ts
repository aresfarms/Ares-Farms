import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditEvents } from "@/db/schema";

/**
 * Repair Ledger Script
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Establishes governed audit-ledger repair authority.
 *
 * - Vol II: Regulatory Governance
 *   Supports evidentiary repair of regulated audit records.
 *
 * - Vol III: Technical Infrastructure
 *   Uses canonical schema imports and Drizzle-compliant repair syntax.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operational recovery and controlled repair execution.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enables replayability, observability, explainability, anomaly review,
 *   version governance, and future simulation/sandbox equivalence.
 *
 * Rule:
 * This script repairs hash-link fields only.
 * It must not mutate decision inputs, outputs, trace metadata, or payload meaning.
 */

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function computeHash(payload: unknown): string {
  return crypto
    .createHash("sha256")
    .update(stableStringify(payload))
    .digest("hex");
}

export async function repairLedger() {
  const rows = await db
    .select()
    .from(auditEvents)
    .orderBy(auditEvents.createdAt);

  let previousHash: string | null = null;

  for (const row of rows) {
    const canonicalPayload = {
      userId: row.userId,
      eventType: row.eventType,
      decision: row.decision,
      compositeScore: row.compositeScore,
      riskScore: row.riskScore,
      input: row.input ?? {},
      output: row.output ?? {},
      trace: row.trace ?? {},
      prevHash: previousHash,
    };

    const computedHash = computeHash(canonicalPayload);

    await db
      .update(auditEvents)
      .set({
        prevHash: previousHash,
        eventHash: computedHash,
        hash: computedHash,
      })
      .where(eq(auditEvents.id, row.id));

    previousHash = computedHash;

    console.log(`Repaired ${row.id}`);
  }

  return {
    ok: true,
    repaired: rows.length,
    source: "repair-ledger",
    repairedAt: new Date().toISOString(),
  };
}

repairLedger().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        source: "repair-ledger",
        error:
          error instanceof Error
            ? error.message
            : "Unknown repair ledger error",
      },
      null,
      2
    )
  );

  process.exitCode = 1;
});
