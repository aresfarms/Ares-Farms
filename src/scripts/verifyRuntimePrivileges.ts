import "dotenv/config";

import { Pool, type PoolClient } from "pg";
import { createPostgresSslConfig } from "@/lib/db/postgresSsl";
import {
  RUNTIME_GRANT_SCHEMA,
  RUNTIME_OWNED_OBJECTS_QUERY,
} from "@/lib/db/runtimeGrants";

/**
 * verify:runtime-privileges — proves the runtime principal is DML-only
 * (STAGING-DEPLOY P0.4 live proof / gate P1.6)
 *
 * Master Volume Governance:
 * - Vol I / II / III-B: proves the database authority split is REAL, not merely
 *   declared — the serving principal can read/write governed rows but cannot
 *   alter structure or own objects.
 * - Vol IV: the live post-bootstrap verification gate (P1.6).
 * - Vol V: emits audit-ready, manifest-suitable JSON evidence.
 *
 * Connects AS THE RUNTIME PRINCIPAL (RUNTIME_DATABASE_URL, else DATABASE_URL —
 * which in staging IS the runtime connection) and runs, against `public`:
 *   POSITIVE (must succeed): schema USAGE; table SELECT/INSERT/UPDATE/DELETE
 *     privileges present; an executed SELECT; an executed INSERT that is NOT
 *     denied for privilege reasons (data/constraint errors count as "privilege
 *     present" — only 42501 insufficient_privilege fails the test).
 *   NEGATIVE (must be denied): schema CREATE privilege absent; an executed
 *     CREATE TABLE that fails with 42501.
 *   OWNERSHIP: the runtime role owns ZERO objects in `public`.
 *
 * Emits a JSON report (checks + overall outcome) suitable for the deployment
 * manifest, and exits non-zero if ANY check fails.
 *
 * All executed statements run inside a transaction that is ALWAYS rolled back,
 * so this verifier never mutates data or structure.
 */

interface Check {
  name: string;
  category: "positive-dml" | "negative-ddl" | "ownership";
  expected: string;
  actual: string;
  pass: boolean;
}

function pgErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function resolveConnection(): { connectionString: string; source: string } {
  if (process.env.RUNTIME_DATABASE_URL) {
    return {
      connectionString: process.env.RUNTIME_DATABASE_URL,
      source: "RUNTIME_DATABASE_URL",
    };
  }
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      source: "DATABASE_URL",
    };
  }
  throw new Error(
    "RUNTIME_DATABASE_URL (or DATABASE_URL) is required — verify runs AS the runtime principal."
  );
}

function resolveMigratorRole(): string {
  return process.env.MIGRATOR_DB_ROLE ?? "furlong_migrator";
}

async function boolCheck(
  client: PoolClient,
  sql: string,
  params: unknown[],
  opts: { name: string; category: Check["category"]; expect: boolean }
): Promise<Check> {
  const res = await client.query<{ ok: boolean }>(sql, params);
  const actual = res.rows[0]?.ok === true;
  return {
    name: opts.name,
    category: opts.category,
    expected: String(opts.expect),
    actual: String(actual),
    pass: actual === opts.expect,
  };
}

async function main(): Promise<void> {
  const { connectionString, source } = resolveConnection();
  const pool = new Pool({
    connectionString,
    ssl: createPostgresSslConfig(connectionString),
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  const startedAtUtc = new Date().toISOString();
  const checks: Check[] = [];
  const schema = RUNTIME_GRANT_SCHEMA;
  const migratorRole = resolveMigratorRole();

  try {
    const whoRes = await client.query<{
      current_user: string;
      current_database: string;
    }>("select current_user, current_database()");
    const runtimeRole = whoRes.rows[0]?.current_user ?? "unknown";
    const databaseName = whoRes.rows[0]?.current_database ?? "unknown";

    const schemaOwner = await client.query<{ owner: string }>(
      "select pg_get_userbyid(nspowner) as owner from pg_namespace where nspname = $1",
      [schema]
    );
    checks.push({
      name: "schema public owned by migrator",
      category: "ownership",
      expected: migratorRole,
      actual: schemaOwner.rows[0]?.owner ?? "unknown",
      pass: (schemaOwner.rows[0]?.owner ?? "unknown") === migratorRole,
    });

    // --- OWNERSHIP: runtime owns nothing in public ---------------------------
    const owned = await client.query<{ object_name: string }>(
      RUNTIME_OWNED_OBJECTS_QUERY,
      [runtimeRole]
    );
    checks.push({
      name: "runtime owns no objects in public",
      category: "ownership",
      expected: "0",
      actual: String(owned.rowCount ?? 0),
      pass: (owned.rowCount ?? 0) === 0,
    });

    // --- POSITIVE: schema USAGE present --------------------------------------
    checks.push(
      await boolCheck(
        client,
        "select has_schema_privilege(current_user, $1, 'USAGE') as ok",
        [schema],
        { name: "has USAGE on schema public", category: "positive-dml", expect: true }
      )
    );

    // --- NEGATIVE: schema CREATE absent --------------------------------------
    checks.push(
      await boolCheck(
        client,
        "select has_schema_privilege(current_user, $1, 'CREATE') as ok",
        [schema],
        { name: "no CREATE on schema public", category: "negative-ddl", expect: false }
      )
    );

    // --- Discover a governed table the runtime can SELECT --------------------
    const tableRes = await client.query<{ tablename: string; qname: string }>(
      `SELECT tablename, quote_ident(schemaname) || '.' || quote_ident(tablename) AS qname
       FROM pg_tables
       WHERE schemaname = $1
         AND has_table_privilege(current_user, quote_ident(schemaname) || '.' || quote_ident(tablename), 'SELECT')
       ORDER BY tablename
       LIMIT 1`,
      [schema]
    );
    const probe = tableRes.rows[0];

    if (!probe) {
      checks.push({
        name: "discover a SELECT-able governed table",
        category: "positive-dml",
        expected: "at least one table",
        actual: "none found (schema empty or no SELECT grant)",
        pass: false,
      });
    } else {
      // Table-level DML privileges present (catalog truth).
      for (const priv of ["SELECT", "INSERT", "UPDATE", "DELETE"] as const) {
        checks.push(
          await boolCheck(
            client,
            "select has_table_privilege(current_user, $1, $2) as ok",
            [probe.qname, priv],
            {
              name: `has ${priv} on ${probe.tablename}`,
              category: "positive-dml",
              expect: true,
            }
          )
        );
      }

      // Executed SELECT (real read).
      let selectExecuted = false;
      try {
        await client.query(`SELECT * FROM ${probe.qname} LIMIT 0`);
        selectExecuted = true;
      } catch {
        selectExecuted = false;
      }
      checks.push({
        name: `executed SELECT on ${probe.tablename}`,
        category: "positive-dml",
        expected: "succeeds",
        actual: selectExecuted ? "succeeded" : "failed",
        pass: selectExecuted,
      });

      // Executed INSERT — NOT denied for privilege reasons. A data/constraint
      // error (e.g. NOT NULL 23502) proves the privilege exists; only 42501
      // insufficient_privilege fails this check. Always rolled back.
      await client.query("BEGIN");
      let insertCode: string | undefined;
      let insertOutcome: string;
      try {
        await client.query(`INSERT INTO ${probe.qname} DEFAULT VALUES`);
        insertOutcome = "executed (row would insert)";
      } catch (error) {
        insertCode = pgErrorCode(error);
        insertOutcome =
          insertCode === "42501"
            ? "DENIED (insufficient_privilege)"
            : `privilege ok (non-privilege error ${insertCode ?? "unknown"})`;
      }
      await client.query("ROLLBACK");
      checks.push({
        name: `executed INSERT on ${probe.tablename} not privilege-denied`,
        category: "positive-dml",
        expected: "not 42501",
        actual: insertOutcome,
        pass: insertCode !== "42501",
      });
    }

    // --- NEGATIVE DDL: CREATE TABLE must be denied with 42501 ----------------
    await client.query("BEGIN");
    let createCode: string | undefined;
    let createOutcome: string;
    try {
      await client.query(
        `CREATE TABLE ${schema}.__runtime_priv_probe__ (id integer)`
      );
      createOutcome = "CREATED (should not happen)";
    } catch (error) {
      createCode = pgErrorCode(error);
      createOutcome = `denied (${createCode ?? "unknown"})`;
    }
    await client.query("ROLLBACK");
    checks.push({
      name: "executed CREATE TABLE is denied (42501)",
      category: "negative-ddl",
      expected: "42501 insufficient_privilege",
      actual: createOutcome,
      pass: createCode === "42501",
    });

    const failed = checks.filter((c) => !c.pass);
    const outcome = failed.length === 0 ? "PASS" : "FAIL";
    const report = {
      operation: "verify:runtime-privileges",
      outcome,
      credentialSource: source,
      databaseName,
      runtimeRole,
      migratorRole,
      schema,
      totalChecks: checks.length,
      failedChecks: failed.length,
      checks,
      startedAtUtc,
      completedAtUtc: new Date().toISOString(),
    };
    console.log(JSON.stringify(report, null, 2));

    if (outcome !== "PASS") {
      console.error(
        `\nverify:runtime-privileges FAILED — ${failed.length} check(s) failed:`
      );
      for (const c of failed) {
        console.error(`  ✗ ${c.name} (expected ${c.expected}, got ${c.actual})`);
      }
      process.exitCode = 1;
    } else {
      console.error(
        `\nverify:runtime-privileges PASS — runtime role "${runtimeRole}" is DML-only and owns nothing.`
      );
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(
      "verify:runtime-privileges ERROR —",
      error instanceof Error ? error.message : "unknown error"
    );
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
