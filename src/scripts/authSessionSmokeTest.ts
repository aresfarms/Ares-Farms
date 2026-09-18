import "dotenv/config";

import { Pool } from "pg";

/**
 * Auth Session Governance Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: confirms session identity is bound to durable tenant authority.
 * - Vol II: verifies regulated identity/session context is controlled.
 * - Vol III: checks the NextAuth credentials path uses the durable identity
 *   runtime and writes governance evidence.
 * - Vol IV: supports repeatable operator verification for access/session issues.
 * - Vol V: enforces source authority, classification, observability,
 *   replayability, version lineage, and evidence preservation.
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

const maxAttempts = 3;

type SessionUser = {
  id?: unknown;
  email?: unknown;
  tenantId?: unknown;
  role?: unknown;
  governanceVersion?: unknown;
  classification?: unknown;
};

type AuthSession = {
  user?: SessionUser;
  expires?: unknown;
};

type AuthAttempt = {
  email: string;
  callbackStatus: number;
  sessionStatus: number;
  session: AuthSession;
};

function getSetCookieHeaders(headers: Headers): string[] {
  const getSetCookie = headers.getSetCookie?.bind(headers);
  const splitHeader = headers.get("set-cookie")?.split(/,(?=\s*[^;,]+=)/g) ?? [];

  if (!getSetCookie) {
    return splitHeader;
  }

  const setCookies = getSetCookie();

  return setCookies.length > 0 ? setCookies : splitHeader;
}

function mergeCookieHeader(existingCookieHeader: string, headers: Headers): string {
  const nextCookies = getSetCookieHeaders(headers)
    .map((cookie) => cookie.split(";")[0].trim())
    .filter(Boolean);

  if (nextCookies.length === 0) {
    return existingCookieHeader;
  }

  return [existingCookieHeader, ...nextCookies].filter(Boolean).join("; ");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getEvidenceCounts(traceId: string) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const result: Record<string, number> = {};

    for (const table of [
      "version_registry",
      "data_classification_registry",
      "observability_events",
      "replay_verification",
    ]) {
      const rows = await pool.query(
        `select count(*)::int as count from ${table} where trace_id = $1`,
        [traceId]
      );

      result[table] = rows.rows[0].count;
    }

    return result;
  } finally {
    await pool.end();
  }
}

async function getLatestNextAuthTraceId(): Promise<string | null> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const latest = await pool.query(
      `
        select trace_id
        from observability_events
        where module = $1
        order by created_at desc
        limit 1
      `,
      ["api.auth.nextauth"]
    );

    return latest.rows[0]?.trace_id ?? null;
  } finally {
    await pool.end();
  }
}

function assertSession(session: AuthSession, email: string): void {
  const user = session.user;

  if (!user) {
    throw new Error("NextAuth smoke test did not return a session user.");
  }

  if (user.email !== email) {
    throw new Error("NextAuth smoke test returned the wrong session email.");
  }

  if (typeof user.id !== "string" || user.id.length === 0) {
    throw new Error("NextAuth smoke test session is missing durable user id.");
  }

  if (typeof user.tenantId !== "string" || user.tenantId.length === 0) {
    throw new Error("NextAuth smoke test session is missing tenant id.");
  }

  if (user.governanceVersion !== "master-volumes-runtime-v0.1.0") {
    throw new Error(
      "NextAuth smoke test session is missing governance version."
    );
  }

  if (user.classification !== "CONFIDENTIAL") {
    throw new Error("NextAuth smoke test session is missing classification.");
  }
}

async function attemptAuthSession(email: string): Promise<AuthAttempt> {
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfJson = (await csrfResponse.json()) as { csrfToken?: string };

  if (!csrfJson.csrfToken) {
    throw new Error("NextAuth smoke test could not obtain a CSRF token.");
  }

  let cookieHeader = mergeCookieHeader("", csrfResponse.headers);

  const form = new URLSearchParams();
  form.set("csrfToken", csrfJson.csrfToken);
  form.set("email", email);
  form.set("password", "backend-smoke-only");
  form.set("json", "true");
  form.set("callbackUrl", baseUrl);

  const callbackResponse = await fetch(
    `${baseUrl}/api/auth/callback/credentials`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": baseUrl,
        Cookie: cookieHeader,
      },
      body: form,
      redirect: "manual",
    }
  );

  const callbackText = await callbackResponse.text();
  cookieHeader = mergeCookieHeader(cookieHeader, callbackResponse.headers);

  if (callbackResponse.status >= 400) {
    throw new Error(
      `NextAuth credentials callback failed: ${callbackResponse.status} ${callbackText}`
    );
  }

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      Cookie: cookieHeader,
    },
  });
  const session = (await sessionResponse.json()) as AuthSession;

  return {
    email,
    callbackStatus: callbackResponse.status,
    sessionStatus: sessionResponse.status,
    session,
  };
}

async function main(): Promise<void> {
  // Confirm the target is THIS app (200 + brand marker) before smoke assertions:
  // a foreign/stale server yields confusing API-404 failures and no server yields
  // opaque connection errors. Fail CLEARLY instead — a smoke gate must never pass
  // vacuously, so this is a loud exit 1, not a skip.
  const smokeHome = await fetch(`${baseUrl}/`).then(async (r) => ({ status: r.status, body: await r.text().catch(() => "") })).catch(() => null);
  if (!smokeHome || smokeHome.status !== 200 || !/Furlong/.test(smokeHome.body)) {
    console.error(`✗ ${baseUrl} is not a confirmed Furlong server (status ${smokeHome?.status ?? "unreachable"}) — refusing to smoke-test a foreign/stale/absent server.`);
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for auth smoke testing.");
  }

  const attemptErrors: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const email = `nextauth-smoke-${Date.now()}-${attempt}@aresfarms.test`;

    try {
      const authAttempt = await attemptAuthSession(email);
      assertSession(authAttempt.session, email);

      const traceId = await getLatestNextAuthTraceId();

      if (!traceId) {
        throw new Error("NextAuth smoke test did not find governance evidence.");
      }

      const evidence = await getEvidenceCounts(traceId);

      if (
        evidence.version_registry < 1 ||
        evidence.data_classification_registry < 1 ||
        evidence.observability_events < 1 ||
        evidence.replay_verification < 1
      ) {
        throw new Error("NextAuth smoke test evidence was incomplete.");
      }

      console.log(
        JSON.stringify(
          {
            ok: true,
            attempt,
            email,
            callbackStatus: authAttempt.callbackStatus,
            sessionStatus: authAttempt.sessionStatus,
            traceId,
            evidence,
            session: authAttempt.session,
          },
          null,
          2
        )
      );
      console.log("Auth session governance smoke test passed.");

      return;
    } catch (error) {
      attemptErrors.push(
        error instanceof Error
          ? error.message
          : "Unknown auth session smoke test attempt error."
      );

      if (attempt < maxAttempts) {
        await sleep(500);
      }
    }
  }

  throw new Error(
    `NextAuth smoke test failed after ${maxAttempts} attempts: ${attemptErrors.join(
      " | "
    )}`
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown auth session smoke test error."
  );
  process.exit(1);
});
