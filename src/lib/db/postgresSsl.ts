import type { PoolConfig } from "pg";
import { setDefaultResultOrder } from "node:dns";

/**
 * Governed PostgreSQL SSL Policy
 *
 * Master Volume Governance:
 * - Vol I: Preserves trusted system authority for durable backend state.
 * - Vol II: Protects regulated borrower, audit, billing, identity, and
 *   operational records in transit.
 * - Vol III: Makes database transport posture explicit and deterministic.
 * - Vol IV: Supports operational review, incident response, and deployment
 *   readiness checks.
 * - Vol V: Preserves source authority, observability, replayability, and
 *   security evidence posture.
 */

try {
  setDefaultResultOrder("ipv4first");
} catch {
  // Older runtimes may not expose DNS ordering; the SSL policy still applies.
}

export type PostgresSslPosture = {
  mode: string | null;
  configured: boolean;
  rejectUnauthorized: boolean | null;
  localDatabase: boolean;
  productionSafe: boolean;
  reason: string;
};

function parseDatabaseUrl(connectionString?: string | null): URL | null {
  if (!connectionString) {
    return null;
  }

  try {
    return new URL(connectionString);
  } catch {
    return null;
  }
}

function localHost(hostname: string | null | undefined): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export function getPostgresSslPosture(
  connectionString = process.env.DATABASE_URL
): PostgresSslPosture {
  const parsed = parseDatabaseUrl(connectionString);

  if (!parsed) {
    return {
      mode: null,
      configured: false,
      rejectUnauthorized: null,
      localDatabase: false,
      productionSafe: false,
      reason: "DATABASE_URL is missing or invalid.",
    };
  }

  const mode = parsed.searchParams.get("sslmode")?.toLowerCase() ?? null;
  const localDatabase = localHost(parsed.hostname);

  if (localDatabase && (!mode || mode === "disable")) {
    return {
      mode,
      configured: false,
      rejectUnauthorized: null,
      localDatabase,
      productionSafe: false,
      reason: "Local database connection does not require SSL.",
    };
  }

  if (mode === "verify-full" || mode === "verify-ca") {
    return {
      mode,
      configured: true,
      rejectUnauthorized: true,
      localDatabase,
      productionSafe: true,
      reason: "PostgreSQL SSL verifies the server certificate chain.",
    };
  }

  if (mode === "require") {
    return {
      mode,
      configured: true,
      rejectUnauthorized: true,
      localDatabase,
      productionSafe: false,
      reason:
        "PostgreSQL SSL is required, but verify-full is preferred for production.",
    };
  }

  if (mode === "no-verify") {
    return {
      mode,
      configured: true,
      rejectUnauthorized: false,
      localDatabase,
      productionSafe: false,
      reason: "PostgreSQL SSL is configured without certificate verification.",
    };
  }

  return {
    mode,
    configured: false,
    rejectUnauthorized: null,
    localDatabase,
    productionSafe: false,
    reason:
      "PostgreSQL SSL mode is missing or unsupported for governed deployment.",
  };
}

export function createPostgresSslConfig(
  connectionString = process.env.DATABASE_URL
): PoolConfig["ssl"] {
  const posture = getPostgresSslPosture(connectionString);

  if (posture.localDatabase && !posture.configured) {
    return undefined;
  }

  if (!posture.configured) {
    return undefined;
  }

  return {
    rejectUnauthorized: posture.rejectUnauthorized !== false,
  };
}
