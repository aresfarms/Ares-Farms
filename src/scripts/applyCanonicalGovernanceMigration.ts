import "dotenv/config";

import { Pool } from "pg";
import {
  applyCanonicalGovernanceMigrations,
  CANONICAL_GOVERNANCE_MIGRATION_FILES,
  canonicalTargetSchemaVersion,
} from "@/lib/db/canonicalGovernanceMigrations";
import { RUNTIME_GRANT_SCHEMA } from "@/lib/db/runtimeGrants";

/**
 * Apply Canonical Governance Migrations (operator CLI: db:migrate:governance)
 *
 * Master Volume Governance:
 * - Vol I: applies constitutional backend state authority deliberately.
 * - Vol II: creates regulated-data, entitlement, application, document,
 *   connector, rule, overlay, review, adverse-action, and evidence tables.
 * - Vol III / III-B: promotes the ONE canonical governance schema lineage
 *   (schema, replay, versioning, classification, observability, source
 *   authority, connector/rule/overlay governance, review + notice + billing +
 *   payment + environmental compliance persistence, and durable runtime
 *   storage) via the shared registry — no competing migration list.
 * - Vol IV: provides a controlled operator migration step.
 * - Vol V: supports classification, observability, source, replay,
 *   rule lineage, overlay precedence, human review, and version doctrine.
 *
 * This CLI is a THIN WRAPPER over the shared canonical migration registry
 * (src/lib/db/canonicalGovernanceMigrations.ts), so it applies EXACTLY the same
 * ordered set that `migrate:schema` runs. `migrate:schema` composes this step
 * (structure) with `applyRuntimeDatabaseGrants.ts` (authority) — this file NEVER
 * touches grants or seeds data.
 *
 * MODES:
 *   (default)  Apply the governance migrations against DATABASE_URL (unchanged
 *              from prior behavior). Exit non-zero on failure.
 *   --plan     Open NO database connection. Print the ordered migration lineage
 *              (0007–0033) and the phase status report:
 *                namespace       = public
 *                runtime grants  = pending  (applyRuntimeDatabaseGrants.ts)
 *                data seed       = excluded (P4 / demo:seed, never here)
 *                live proof gate = P1.6      (verify:runtime-privileges)
 *
 * Operator rule:
 * Run the default mode only when the active DATABASE_URL is confirmed to be the
 * intended development or controlled migration database.
 */

function runPlan(): void {
  console.log("db:migrate:governance — PLAN (no database connection)");
  console.log(
    `\n  canonical governance migration lineage (${CANONICAL_GOVERNANCE_MIGRATION_FILES.length}), applied in order:`
  );
  for (const fileName of CANONICAL_GOVERNANCE_MIGRATION_FILES) {
    console.log(`    - ${fileName}`);
  }
  console.log("\n  phase status:");
  console.log(`    namespace        = ${RUNTIME_GRANT_SCHEMA}`);
  console.log(`    target schema    = ${canonicalTargetSchemaVersion()}`);
  console.log(
    "    runtime grants   = pending   (applied by applyRuntimeDatabaseGrants.ts)"
  );
  console.log(
    "    data seed        = excluded  (P4 application-level demo:seed; never here)"
  );
  console.log(
    "    live proof gate  = P1.6      (verify:runtime-privileges, post-P1 bootstrap)"
  );
  console.log("\nPLAN OK — no database connection opened, no changes applied.");
}

async function runApply(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required before applying migrations.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await applyCanonicalGovernanceMigrations(client, (message) =>
      console.log(message)
    );
    await client.query("COMMIT");

    console.log(
      `Canonical governance migrations applied successfully ` +
        `(${CANONICAL_GOVERNANCE_MIGRATION_FILES.length} files).`
    );
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main(): Promise<void> {
  if (process.argv.slice(2).includes("--plan")) {
    runPlan();
    return;
  }
  await runApply();
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown canonical governance migration error."
  );
  process.exit(1);
});
