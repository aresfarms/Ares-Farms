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
 * CREDENTIAL PRECEDENCE + SAFETY GATE:
 * Migrations are DDL and MUST run as the migrator principal — NEVER as the
 * runtime principal. So this step uses MIGRATOR_DATABASE_URL, and it will only
 * fall back to DATABASE_URL when explicitly permitted with --allow-database-url.
 * Without that flag, a set-but-unintended DATABASE_URL is REFUSED rather than
 * silently used (which could otherwise run DDL as the runtime principal).
 *   * governed chain  `migrate:schema`  -> strict: requires MIGRATOR_DATABASE_URL
 *     (both this step and applyRuntimeDatabaseGrants run as the migrator).
 *   * local operator  `db:migrate:governance` -> passes --allow-database-url,
 *     so DATABASE_URL works exactly as before for controlled local dev.
 *
 * MODES:
 *   (default)  Apply the governance migrations. Requires MIGRATOR_DATABASE_URL
 *              unless --allow-database-url is passed. Exit non-zero on failure.
 *   --allow-database-url  Permit the DATABASE_URL fallback (local dev only).
 *   --plan     Open NO database connection. Print the ordered migration lineage
 *              (0007–0033) and the phase status report:
 *                namespace       = public
 *                runtime grants  = pending  (applyRuntimeDatabaseGrants.ts)
 *                data seed       = excluded (P4 / demo:seed, never here)
 *                live proof gate = P1.6      (verify:runtime-privileges)
 *
 * Operator rule:
 * Run the default mode only when the resolved migration database (see the logged
 * credential source) is the intended controlled migration DB, applied by the
 * migrator principal.
 */

interface Options {
  plan: boolean;
  allowDatabaseUrl: boolean;
}

function parseArgs(argv: string[]): Options {
  return {
    plan: argv.includes("--plan"),
    allowDatabaseUrl: argv.includes("--allow-database-url"),
  };
}

/**
 * Resolve the migration connection. Prefer the migrator principal's URL so the
 * migrate:schema chain is single-principal. Fall back to DATABASE_URL ONLY when
 * --allow-database-url is passed; otherwise a set DATABASE_URL is reported as
 * refused so the caller fails loudly instead of migrating as the wrong principal.
 */
function resolveMigrationConnection(opts: Options): {
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
    if (opts.allowDatabaseUrl) {
      return {
        connectionString: process.env.DATABASE_URL,
        source: "DATABASE_URL (--allow-database-url)",
      };
    }
    return {
      connectionString: undefined,
      source: "DATABASE_URL present but REFUSED (pass --allow-database-url)",
    };
  }
  return { connectionString: undefined, source: "none" };
}

function runPlan(opts: Options): void {
  console.log("db:migrate:governance — PLAN (no database connection)");
  console.log(
    `\n  canonical governance migration lineage (${CANONICAL_GOVERNANCE_MIGRATION_FILES.length}), applied in order:`
  );
  for (const fileName of CANONICAL_GOVERNANCE_MIGRATION_FILES) {
    console.log(`    - ${fileName}`);
  }
  console.log("\n  phase status:");
  console.log(`    credential src   = ${resolveMigrationConnection(opts).source}  (MIGRATOR_DATABASE_URL; DATABASE_URL only with --allow-database-url)`);
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

async function runApply(opts: Options): Promise<void> {
  const { connectionString, source } = resolveMigrationConnection(opts);
  if (!connectionString) {
    if (process.env.DATABASE_URL && !opts.allowDatabaseUrl) {
      throw new Error(
        "Refusing to run migrations on DATABASE_URL. Migrations are DDL and must " +
          "run as the migrator principal: set MIGRATOR_DATABASE_URL, or pass " +
          "--allow-database-url for controlled local dev. The runtime principal " +
          "must never run migrations."
      );
    }
    throw new Error(
      "MIGRATOR_DATABASE_URL is required before applying migrations " +
        "(or DATABASE_URL with --allow-database-url for local dev)."
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
  const opts = parseArgs(process.argv.slice(2));
  if (opts.plan) {
    runPlan(opts);
    return;
  }
  await runApply(opts);
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown canonical governance migration error."
  );
  process.exit(1);
});
