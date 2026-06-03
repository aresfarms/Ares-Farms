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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: createPostgresSslConfig(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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
