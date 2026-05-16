import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

/**
 * 🚨 HARD GUARD
 * Prevents silent runtime failures when env is missing
 */
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing in environment variables");
}

/**
 * 🟢 SINGLE SOURCE OF TRUTH DB CONNECTION
 * - Neon Postgres via connection pool
 * - Drizzle ORM typed schema binding
 * - Safe for Next.js server runtime
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * 🟢 DRIZZLE CLIENT
 * This is the ONLY DB export used across the app
 */
export const db = drizzle(pool, { schema });

/**
 * Optional: export pool if you ever need raw queries
 */
export { pool };
