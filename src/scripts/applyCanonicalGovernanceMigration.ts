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
 * CREDENTIAL PRECEDENCE (so the whole `migrate:schema` chain runs under ONE
 * principal): this step prefers MIGRATOR_DATABASE_URL, then falls back to
 * DATABASE_URL. `migrate:schema` = this step THEN applyRuntimeDatabaseGrants.ts,
 * and BOTH resolve MIGRATOR_DATABASE_URL first — so the staging migrator Job
 * only needs to set MIGRATOR_DATABASE_URL and the migrations + grants run as the
 * same migrator principal. A standalone local `db:migrate:governance` with only
 * DATABASE_URL set behaves exactly as before.
 *
 * MODES:
 *   (default)  Apply the governance migrations (MIGRATOR_DATABASE_URL, else
 *              DATABASE_URL). Exit non-zero on failure.
 *   --plan     Open NO database connection. Print the ordered migration lineage
 *              (0007–0033) and the phase status report:
 *                namespace       = public
 *                runtime grants  = pending  (applyRuntimeDatabaseGrants.ts)
 *                data seed       = excluded (P4 / demo:seed, never here)
 *                live proof gate = P1.6      (verify:runtime-privileges)
 *
 * Operator rule:
 * Run the default mode only when the resolved migration database (see the logged
 * credential source) is the intended development or controlled migration DB.
 */

/**
 * Resolve the migration connection. Prefer the migrator principal's URL so the
 * migrate:schema chain is single-principal; fall back to DATABASE_URL for
 * standalone local dev.
 */
function resolveMigrationConnection(): {
  connectionString: string | undefined;
  source: string;
} {
  if (process.env.MIGRATOR_DATABASE_URL) {
    return {
      connectionString: process.env.MIGRATOR_DATABASE_URL,
      source: "MIGRATOR_DATABASE_URL",
    };
  }
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, source: "DATABASE_URL" };
  }
  return { connectionString: undefined, source: "none" };
}

function runPlan(): void {
  console.log("db:migrate:governance — PLAN (no database connection)");
  console.log(
    `\n  canonical governance migration lineage (${CANONICAL_GOVERNANCE_MIGRATION_FILES.length}), applied in order:`
  );
  for (const fileName of CANONICAL_GOVERNANCE_MIGRATION_FILES) {
    console.log(`    - ${fileName}`);
  }
  console.log("\n  phase status:");
  console.log(`    credential src   = ${resolveMigrationConnection().source}  (MIGRATOR_DATABASE_URL preferred, else DATABASE_URL)`);
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
  const { connectionString, source } = resolveMigrationConnection();
  if (!connectionString) {
    throw new Error(
      "MIGRATOR_DATABASE_URL or DATABASE_URL is required before applying migrations."
    );
  }
  console.log(`Applying governance migrations using ${source}.`);

  const pool = new Pool({
    connectionString,
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
