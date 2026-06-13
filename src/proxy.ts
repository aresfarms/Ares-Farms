import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import { isProtectedPage } from "@/lib/auth/protectedRoutes";
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
 * Security Perimeter Proxy — the Next 16 server-side middleware.
 *
 * In Next.js 16 the "middleware" file convention was renamed to "proxy": this
 * file (src/proxy.ts, exporting `proxy` + `config`) IS the request middleware,
 * loaded automatically and run on the server before any page renders or any
 * route handler executes. (Do not also add src/middleware.ts — Next refuses to
 * start with both.)
 *
 * Two responsibilities (Build 57 — security launch blocker):
 *   1. API perimeter (pre-existing): every /api/* route is deny-by-default with
 *      a narrow public allowlist (NextAuth, Stripe webhook, /api/public, and the
 *      few public-surface discovery endpoints). Anonymous ⇒ 401. Caller-claimed
 *      role/actor/tenant must not conflict with the session. This protects the
 *      DATA layer, not just the UI.
 *   2. Page perimeter (added): internal/operator/portal PAGES require an
 *      authenticated session. Anonymous ⇒ redirect to the operator sign-in; the
 *      console and its data are never rendered. The nav-leak fix hid the door;
 *      this locks it.
 *
 * What counts as "internal" is the single source of truth in
 * src/lib/auth/protectedRoutes.ts (shared with PlatformChrome and the
 * verify:internal-auth gate). Public pages fall straight through.
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable identity authority before protected surface use.
 * - Vol II: Prevents regulated workflow access from relying on caller-claimed
 *   roles, tenants, or actor identities.
 * - Vol III: Provides one deterministic server-side boundary and abuse control.
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

/**
 * Preview wall — locks the WHOLE preview behind one HTTP Basic-auth password.
 * INERT unless PREVIEW_BASIC_AUTH_USER + PREVIEW_BASIC_AUTH_PASSWORD are set
 * (i.e. only on the locked preview deploy; dev/local/prod are untouched). This
 * is in ADDITION to — never instead of — the operator auth gate below: internal
 * routes still require login after the preview password. Crawlers get 401 +
 * noindex, so the preview is never indexed.
 */
function previewGate(req: NextRequest): NextResponse | null {
  const user = process.env.PREVIEW_BASIC_AUTH_USER;
  const pass = process.env.PREVIEW_BASIC_AUTH_PASSWORD;
  if (!user || !pass) return null; // not a locked preview → no-op
  const expected = `Basic ${btoa(`${user}:${pass}`)}`;
  if ((req.headers.get("authorization") ?? "") !== expected) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Furlong private preview"',
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
  return null; // password ok → fall through to the normal operator gate
}

/**
 * Nonce-based CSP (GCP/production readiness, 2026-06-12). Pages get a fresh
 * cryptographically random nonce per request; Next reads the CSP from the
 * REQUEST headers (the fork's documented proxy pattern) and tags its inline
 * bootstrap/hydration <script>s with it, so PRODUCTION script-src needs NO
 * 'unsafe-inline'. Development stays relaxed ('unsafe-eval' for React's debug
 * eval, 'unsafe-inline' for turbopack dev chunks) — clearly gated to dev only.
 *
 * style-src keeps 'unsafe-inline' WITHOUT a nonce on purpose: the app styles
 * via React inline style ATTRIBUTES, which a style-src nonce would void
 * (CSP3 ignores 'unsafe-inline' when a nonce is present). Script injection is
 * the XSS vector this hardens; style attributes carry no script capability.
 */
function pageResponseWithCsp(req: NextRequest): NextResponse {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = (isDev
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ]
    : [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http:`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ]
  ).join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export async function proxy(req: NextRequest) {
  // Locked-preview password wall (deploy-only; inert otherwise). Must run first.
  const previewBlock = previewGate(req);
  if (previewBlock) return previewBlock;

  const route = req.nextUrl.pathname;

  // ── Page perimeter ──────────────────────────────────────────────────────────
  // Non-API routes: protect internal/operator/portal PAGES. Anonymous visitors
  // are redirected to the operator sign-in; the console is never rendered. Public
  // pages fall straight through. (The API perimeter below owns /api/*.)
  if (!route.startsWith("/api/")) {
    if (isProtectedPage(route)) {
      const pageSecret = resolveNextAuthSecret();
      const pageToken = pageSecret
        ? await getToken({ req, secret: pageSecret })
        : null;

      if (!pageToken) {
        const signInUrl = req.nextUrl.clone();
        signInUrl.pathname = "/api/auth/signin";
        signInUrl.search = `callbackUrl=${encodeURIComponent(
          `${route}${req.nextUrl.search}`,
        )}`;
        return NextResponse.redirect(signInUrl);
      }
    }

    // Pages render under the per-request nonce CSP (production: no
    // 'unsafe-inline' in script-src).
    return pageResponseWithCsp(req);
  }

  // ── API perimeter ───────────────────────────────────────────────────────────
  const traceId = createSecurityTraceId();
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
  // Run on application routes (API + pages); exclude Next internals and public
  // static asset directories/files (anything with a file extension). The proxy
  // body decides per-path: /api/* → API perimeter, internal pages → page
  // perimeter, everything else → next().
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|maps/|brand/|journey/|.*\\..*).*)",
  ],
};
