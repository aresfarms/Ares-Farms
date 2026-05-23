import { db } from "@/lib/db";

/**
 * OPTION C RULE:
 * Canonical layer is READ-ONLY.
 *
 * This function is intentionally disabled to prevent any writes.
 */

export async function buildCanonicalWriter() {
  throw new Error(
    "Canonical writer is disabled under Option C. " +
    "canonical_* tables are read-only derived projections from audit_events."
  );
}
