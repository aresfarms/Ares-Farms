import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { createPostgresSslConfig } from "./postgresSsl";

/**
 * BANK-GRADE DB LAYER (STABLE MODE)
 * - avoids Turbopack inference bugs
 * - forces explicit schema binding
 * - ensures query API is consistent
 */

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: createPostgresSslConfig(),
  max: positiveInteger(process.env.DB_POOL_MAX, 10),
  idleTimeoutMillis: positiveInteger(process.env.DB_IDLE_TIMEOUT_MS, 30_000),
  // Immutable audit appends deliberately serialize at the chain head. Under a
  // burst, callers must queue for a connection rather than fail after 10s and
  // risk losing the audit event. This is an acquisition timeout, not a query
  // timeout, and remains operator-configurable per deployment profile.
  connectionTimeoutMillis: positiveInteger(
    process.env.DB_CONNECTION_TIMEOUT_MS,
    60_000,
  ),
});
pool.on("error", (error) => {
  console.warn(`PostgreSQL idle client warning: ${error.message}`);
});

/**
 * CRITICAL FIX:
 * DO NOT rely on db.query.* in this environment
 * enforce full schema binding mode only
 */
export const db = drizzle(pool, {
  schema,
});
