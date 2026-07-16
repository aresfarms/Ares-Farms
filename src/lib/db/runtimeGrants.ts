import type { PoolClient } from "pg";

/**
 * Runtime Principal Grants (least-privilege DML for furlong_runtime)
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): authority conflicts are blocked at the
 *   entitlement layer, not merely documented — the runtime principal gets DML
 *   ONLY and never owns schema or migration metadata.
 * - Vol II (Regulatory Governance): separation of the migrating authority from
 *   the serving authority for regulated records.
 * - Vol III / III-B (Technical Infrastructure / Governance Runtime): makes the
 *   database authority split deterministic and reproducible.
 * - Vol IV (Operational Runbooks): applied by the migrator during
 *   `migrate:schema`, so the runtime role is usable the moment schema exists.
 * - Vol V (Canonical Doctrines): preserves auditable, least-privilege posture.
 *
 * Authority map (STAGING-DEPLOY spec):
 *   migrator (owner)  -> owns schema + migration metadata; runs DDL.
 *   runtime           -> SELECT/INSERT/UPDATE/DELETE on tables + USAGE/SELECT on
 *                        sequences ONLY. No CREATE, no ALTER, no DROP, no
 *                        ownership. Some PostgreSQL estates still retain CREATE
 *                        on the `public` schema for PUBLIC, so the hardening step
 *                        explicitly revokes it from both PUBLIC and the runtime
 *                        role to remove inherited DDL paths.
 *
 * IMPORTANT SCHEMA NOTE: the canonical schema lives in the DEFAULT `public`
 * schema (there is no `app` schema in this build — verified against the
 * governance migrations), so these grants target `public`. The spec's example
 * used `app`; `public` is the correct target here.
 */

/** The schema the canonical tables live in. */
export const RUNTIME_GRANT_SCHEMA = "public";

/**
 * PostgreSQL identifiers we build into DDL cannot be bound as parameters, so we
 * validate them strictly and quote them. Only unquoted-safe identifiers pass.
 */
const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function assertSafeIdentifier(
  value: string,
  label: string
): string {
  if (!SAFE_IDENTIFIER.test(value)) {
    throw new Error(
      `Unsafe ${label} "${value}": must match ${SAFE_IDENTIFIER}. ` +
        `Role/schema/database names are built into DDL and cannot be parameterized.`
    );
  }
  return value;
}

/** Double-quote a validated identifier for safe interpolation into DDL. */
function quoteIdent(value: string, label: string): string {
  return `"${assertSafeIdentifier(value, label)}"`;
}

export interface RuntimeGrantConfig {
  /** Database the runtime role connects to (for GRANT CONNECT). */
  databaseName: string;
  /** The least-privilege serving role, e.g. "furlong_runtime". */
  runtimeRole: string;
  /** The schema-owning migrator role, e.g. "furlong_migrator". */
  migratorRole: string;
}

/**
 * Build the ordered hardening statements that make the runtime role a
 * least-privilege DML principal and ensure the migrator remains the owning
 * authority. The GRANT / ALTER DEFAULT PRIVILEGES / REVOKE statements are
 * idempotent; the ALTER OWNER statements are convergent and simply reassert the
 * required owner when drift occurred.
 */
export function buildRuntimeGrantStatements(
  config: RuntimeGrantConfig
): string[] {
  const db = quoteIdent(config.databaseName, "database name");
  const runtime = quoteIdent(config.runtimeRole, "runtime role");
  const migrator = quoteIdent(config.migratorRole, "migrator role");
  const schema = quoteIdent(RUNTIME_GRANT_SCHEMA, "schema name");

  return [
    `ALTER DATABASE ${db} OWNER TO ${migrator};`,
    `ALTER SCHEMA ${schema} OWNER TO ${migrator};`,
    `GRANT CONNECT ON DATABASE ${db} TO ${runtime};`,
    `GRANT USAGE ON SCHEMA ${schema} TO ${runtime};`,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${runtime};`,
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${schema} TO ${runtime};`,
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${migrator} IN SCHEMA ${schema} ` +
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${runtime};`,
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${migrator} IN SCHEMA ${schema} ` +
      `GRANT USAGE, SELECT ON SEQUENCES TO ${runtime};`,
    // Belt-and-suspenders: some estates still expose CREATE on `public` to
    // PUBLIC, so remove that inherited path first, then revoke directly from
    // the runtime role as well. This makes DDL structurally impossible for the
    // serving principal regardless of server version or prior grants.
    `REVOKE CREATE ON SCHEMA ${schema} FROM PUBLIC;`,
    `REVOKE CREATE ON SCHEMA ${schema} FROM ${runtime};`,
  ];
}

/**
 * Catalog query that returns any objects in the grant schema OWNED by the
 * runtime role. The runtime principal must own NOTHING (owner = migrator), so a
 * non-empty result is a hard failure. `$1` is bound to the runtime role name.
 */
export const RUNTIME_OWNED_OBJECTS_QUERY = `
  SELECT c.relname AS object_name, c.relkind AS object_kind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_roles r ON r.oid = c.relowner
  WHERE n.nspname = '${RUNTIME_GRANT_SCHEMA}'
    AND r.rolname = $1
  ORDER BY c.relname
`;

/**
 * Apply the runtime grants on an already-open client (caller owns the
 * transaction). Returns the statements applied (for logging / manifest).
 */
export async function applyRuntimeGrants(
  client: PoolClient,
  config: RuntimeGrantConfig,
  log: (message: string) => void = () => {}
): Promise<string[]> {
  const statements = buildRuntimeGrantStatements(config);
  for (const statement of statements) {
    await client.query(statement);
    log(`Applied grant: ${statement}`);
  }
  return statements;
}
