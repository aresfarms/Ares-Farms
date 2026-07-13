import "dotenv/config";

import { Pool } from "pg";
import { createPostgresSslConfig } from "@/lib/db/postgresSsl";
import {
  RUNTIME_GRANT_SCHEMA,
  RUNTIME_OWNED_OBJECTS_QUERY,
  applyRuntimeGrants,
  assertSafeIdentifier,
  type RuntimeGrantConfig,
} from "@/lib/db/runtimeGrants";

/**
 * applyRuntimeDatabaseGrants — least-privilege authority for furlong_runtime
 * (STAGING-DEPLOY P0.4 / migrate:schema step 2)
 *
 * Master Volume Governance:
 * - Vol I: authority conflicts blocked at the entitlement layer — the runtime
 *   principal is DML-only and owns nothing.
 * - Vol II: separates the migrating authority from the serving authority for
 *   regulated records.
 * - Vol III / III-B: makes the database authority split deterministic.
 * - Vol IV: the second half of `migrate:schema` (structure -> authority), run by
 *   the MIGRATOR principal only.
 * - Vol V: preserves auditable least-privilege posture.
 *
 * Runs as the MIGRATOR principal (MIGRATOR_DATABASE_URL). In a single
 * transaction it:
 *   1. GRANTs the runtime role CONNECT + USAGE + SELECT/INSERT/UPDATE/DELETE on
 *      tables + USAGE/SELECT on sequences in `public`.
 *   2. Sets ALTER DEFAULT PRIVILEGES so FUTURE migrator-created objects are
 *      automatically usable by the runtime role.
 *   3. REVOKEs CREATE on `public` from the runtime role (no DDL, ever).
 *   4. Verifies the runtime role OWNS NO objects in `public` (owner = migrator).
 * Any failure rolls back and exits non-zero (Cloud Run Job exit-code honesty).
 *
 * NOTE ON CREDENTIALS: this step REQUIRES MIGRATOR_DATABASE_URL. `migrate:schema`
 * runs `db:migrate:governance` (DATABASE_URL) then this script; in the staging
 * migrator Job, both DATABASE_URL and MIGRATOR_DATABASE_URL point at the
 * migrator principal. A local single-role dev may pass --allow-database-url.
 */

interface Options {
  allowDatabaseUrl: boolean;
}

function parseArgs(argv: string[]): Options {
  return { allowDatabaseUrl: argv.includes("--allow-database-url") };
}

function resolveConnection(opts: Options): {
  connectionString: string;
  source: string;
} {
  if (process.env.MIGRATOR_DATABASE_URL) {
    return {
      connectionString: process.env.MIGRATOR_DATABASE_URL,
      source: "MIGRATOR_DATABASE_URL",
    };
  }
  if (opts.allowDatabaseUrl && process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      source: "DATABASE_URL (--allow-database-url)",
    };
  }
  throw new Error(
    "MIGRATOR_DATABASE_URL is required (grants must be applied by the migrator " +
      "principal). Pass --allow-database-url only for local single-role dev."
  );
}

function resolveRoles(): { runtimeRole: string; migratorRole: string } {
  const runtimeRole = process.env.RUNTIME_DB_ROLE ?? "furlong_runtime";
  const migratorRole = process.env.MIGRATOR_DB_ROLE ?? "furlong_migrator";
  assertSafeIdentifier(runtimeRole, "runtime role (RUNTIME_DB_ROLE)");
  assertSafeIdentifier(migratorRole, "migrator role (MIGRATOR_DB_ROLE)");
  return { runtimeRole, migratorRole };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const { connectionString, source } = resolveConnection(opts);
  const { runtimeRole, migratorRole } = resolveRoles();

  const pool = new Pool({
    connectionString,
    ssl: createPostgresSslConfig(connectionString),
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  const startedAtUtc = new Date().toISOString();
  try {
    const dbResult = await client.query<{ current_database: string }>(
      "select current_database()"
    );
    const databaseName =
      dbResult.rows[0]?.current_database ?? process.env.APP_DB_NAME ?? "furlong";
    const config: RuntimeGrantConfig = { databaseName, runtimeRole, migratorRole };

    await client.query("BEGIN");

    const appliedStatements = await applyRuntimeGrants(client, config, (m) =>
      console.log(m)
    );

    // Ownership invariant: the runtime principal must own nothing in `public`.
    const owned = await client.query<{ object_name: string; object_kind: string }>(
      RUNTIME_OWNED_OBJECTS_QUERY,
      [runtimeRole]
    );
    if (owned.rowCount && owned.rowCount > 0) {
      const names = owned.rows.map((r) => r.object_name).join(", ");
      throw new Error(
        `Runtime role "${runtimeRole}" OWNS ${owned.rowCount} object(s) in ` +
          `${RUNTIME_GRANT_SCHEMA} (${names}). The runtime principal must own ` +
          `nothing (owner = migrator). Aborting.`
      );
    }

    await client.query("COMMIT");

    const summary = {
      operation: "applyRuntimeDatabaseGrants",
      outcome: "SUCCESS",
      credentialSource: source,
      databaseName,
      schema: RUNTIME_GRANT_SCHEMA,
      migratorRole,
      runtimeRole,
      statementsApplied: appliedStatements.length,
      runtimeOwnedObjects: 0,
      startedAtUtc,
      completedAtUtc: new Date().toISOString(),
    };
    console.log("\napplyRuntimeDatabaseGrants SUMMARY:");
    console.log(JSON.stringify(summary, null, 2));
    console.log("\nRuntime grants applied. Runtime role is DML-only and owns nothing.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "applyRuntimeDatabaseGrants FAILED —",
    error instanceof Error ? error.message : "unknown error"
  );
  process.exit(1);
});
