import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  ClaimedActorContext,
  apiAuthEnforcementRequired,
  apiRateLimitingEnabled,
  apiSecurityPublicReason,
  actorClaimConflictsWithSession,
  extractClaimedActorContext,
  extractClaimedActorContextFromSearchParams,
  normalizeOptionalRole,
  normalizeOptionalText,
  roleClaimConflictsWithSession,
  tenantClaimConflictsWithSession,
} from "@/lib/security/apiSecurityPolicy";

/**
 * API Security Perimeter Proxy
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable identity authority before protected backend use.
 * - Vol II: Prevents regulated workflow access from relying on caller-claimed
 *   roles, tenants, or actor identities.
 * - Vol III: Provides deterministic API boundary enforcement and abuse control.
 * - Vol IV: Supports security operations, incident response, and deployment
 *   readiness gates.
 * - Vol V: Preserves source authority, controlled disclosure, observability
 *   posture, replay-safe traceability, and governed production promotion.
 */

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type SessionContext = {
  actorId: string | null;
  role: string | null;
  tenantId: string | null;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function createSecurityTraceId(): string {
  return `api-security-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function jsonBlocked(
  status: number,
  error: string,
  governance: Record<string, unknown>,
  headers?: HeadersInit
) {
  return NextResponse.json(
    {
      ok: false,
      error,
      governance,
    },
    {
      status,
      headers,
    }
  );
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clientIdentity(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown-client";
  }

  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown-client"
  );
}

function evaluateRateLimit(req: NextRequest): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
} {
  const windowSeconds = parsePositiveInteger(
    process.env.API_RATE_LIMIT_WINDOW_SECONDS,
    60
  );
  const limit = parsePositiveInteger(process.env.API_RATE_LIMIT_MAX, 120);
  const now = Date.now();
  const key = `${clientIdentity(req)}:${req.nextUrl.pathname}`;
  const existing = rateLimitBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });

    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - 1, 0),
      resetAt: now + windowSeconds * 1000,
    };
  }

  existing.count += 1;

  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(limit - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

function rateLimitHeaders(rateLimit: {
  limit: number;
  remaining: number;
  resetAt: number;
}): HeadersInit {
  return {
    "x-ares-rate-limit-limit": String(rateLimit.limit),
    "x-ares-rate-limit-remaining": String(rateLimit.remaining),
    "x-ares-rate-limit-reset": new Date(rateLimit.resetAt).toISOString(),
  };
}

async function readBodyClaimedActorContext(
  req: NextRequest
): Promise<ClaimedActorContext> {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return {};
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return {};
  }

  try {
    const body = (await req.clone().json()) as Record<string, unknown>;

    return extractClaimedActorContext(body);
  } catch {
    return {};
  }
}

function combineClaimedContexts(
  query: ClaimedActorContext,
  body: ClaimedActorContext
): ClaimedActorContext {
  return {
    role: body.role ?? query.role ?? null,
    actorId: body.actorId ?? query.actorId ?? null,
    tenantId: body.tenantId ?? query.tenantId ?? null,
  };
}

function extractSessionContext(token: Record<string, unknown>): SessionContext {
  return {
    actorId: normalizeOptionalText(token.id ?? token.sub ?? token.email),
    role: normalizeOptionalRole(token.role),
    tenantId: normalizeOptionalText(token.tenantId),
  };
}

function requestWithSessionHeaders(
  req: NextRequest,
  session: SessionContext
): NextResponse {
  const requestHeaders = new Headers(req.headers);

  if (session.actorId) {
    requestHeaders.set("x-ares-authenticated-user-id", session.actorId);
  }

  if (session.role) {
    requestHeaders.set("x-ares-authenticated-role", session.role);
  }

  if (session.tenantId) {
    requestHeaders.set("x-ares-authenticated-tenant-id", session.tenantId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export async function proxy(req: NextRequest) {
  const traceId = createSecurityTraceId();
  const route = req.nextUrl.pathname;
  const publicReason = apiSecurityPublicReason(route);
  const rateLimitEnabled = apiRateLimitingEnabled();

  if (rateLimitEnabled) {
    const rateLimit = evaluateRateLimit(req);

    if (!rateLimit.allowed) {
      return jsonBlocked(
        429,
        "API rate limit exceeded.",
        {
          traceId,
          module: "api.security.proxy",
          route,
          policy: "rate-limit",
          publicReason,
        },
        rateLimitHeaders(rateLimit)
      );
    }
  }

  if (publicReason || req.method === "OPTIONS") {
    return NextResponse.next();
  }

  if (!apiAuthEnforcementRequired()) {
    return NextResponse.next();
  }

  const secret = resolveNextAuthSecret();

  if (!secret) {
    return jsonBlocked(503, "API authentication secret is not configured.", {
      traceId,
      module: "api.security.proxy",
      route,
      policy: "session-required",
      missingSecret: true,
    });
  }

  const token = await getToken({
    req,
    secret,
  });

  if (!token) {
    return jsonBlocked(401, "Authenticated session is required.", {
      traceId,
      module: "api.security.proxy",
      route,
      policy: "session-required",
    });
  }

  const session = extractSessionContext(token as Record<string, unknown>);
  const queryClaims = extractClaimedActorContextFromSearchParams(
    req.nextUrl.searchParams
  );
  const bodyClaims = await readBodyClaimedActorContext(req);
  const claimed = combineClaimedContexts(queryClaims, bodyClaims);

  if (
    roleClaimConflictsWithSession({
      sessionRole: session.role,
      claimedRole: claimed.role,
    }) ||
    actorClaimConflictsWithSession({
      sessionActorId: session.actorId,
      claimedActorId: claimed.actorId,
    }) ||
    tenantClaimConflictsWithSession({
      sessionTenantId: session.tenantId,
      claimedTenantId: claimed.tenantId,
    })
  ) {
    return jsonBlocked(403, "Caller-claimed authority conflicts with session.", {
      traceId,
      module: "api.security.proxy",
      route,
      policy: "session-authority",
      session: {
        actorId: session.actorId,
        role: session.role,
        tenantId: session.tenantId,
      },
      claimed,
    });
  }

  return requestWithSessionHeaders(req, session);
}

export const config = {
  matcher: "/api/:path*",
};
