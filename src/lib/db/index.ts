import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * BANK-GRADE DB LAYER (STABLE MODE)
 * - avoids Turbopack inference bugs
 * - forces explicit schema binding
 * - ensures query API is consistent
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

/**
 * CRITICAL FIX:
 * DO NOT rely on db.query.* in this environment
 * enforce full schema binding mode only
 */
export const db = drizzle(pool, {
  schema,
});
