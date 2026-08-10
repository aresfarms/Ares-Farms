import { AccessRole, normalizeAccessRole } from "@/lib/auth/accessControl";

/**
 * API Security Policy Runtime
 *
 * Master Volume Governance:
 * - Vol I: Enforces constitutional identity authority at the API boundary.
 * - Vol II: Prevents caller-claimed role drift for regulated workflows.
 * - Vol III: Provides deterministic perimeter policy for backend routes.
 * - Vol IV: Supports security operations, abuse response, and audit review.
 * - Vol V: Preserves source authority, controlled disclosure, replay-safe
 *   policy decisions, and governed production promotion.
 */

export type ApiSecurityEnvironment = Record<string, string | undefined>;

export type PublicApiReason =
  | "nextauth-runtime"
  | "stripe-webhook-signature-gated"
  | "public-surface-gateway"
  | "internal-source-refresh-iam-gated";

export type ClaimedActorContext = {
  role?: AccessRole | null;
  actorId?: string | null;
  tenantId?: string | null;
};

export type SessionActorContext = {
  role?: AccessRole | null;
  actorId?: string | null;
  tenantId?: string | null;
};

const NEXTAUTH_PUBLIC_PATHS = new Set([
  "/api/auth/callback",
  "/api/auth/csrf",
  "/api/auth/error",
  "/api/auth/providers",
  "/api/auth/session",
  "/api/auth/signin",
  "/api/auth/signout",
]);

const PUBLIC_SIGNATURE_GATED_PATHS = new Set(["/api/stripe/webhook"]);
const PUBLIC_SURFACE_GATEWAY_PREFIX = "/api/public";
const INTERNAL_IAM_GATED_PATHS = new Set(["/api/internal/source-refresh"]);

/**
 * Public-surface APIs the anonymous public site calls directly (no session):
 *   - the accessibility feedback form POST
 *   - the public financing-pathway discovery lookup
 *   - the public readiness self-check
 *   - the customer financing intake POST (a customer never has a session;
 *     the route carries its own consent gates, Section 1071 firewall, and
 *     runtime governance — staging test 2026-08-05 caught the 401)
 *   - the customer status lookup (anonymous by design; minimum-disclosure —
 *     requires BOTH the reference id AND the matching email to return anything)
 * These are intentionally anonymous. Everything else under /api stays
 * deny-by-default. Matched exactly or by sub-path.
 */
const PUBLIC_SURFACE_PATHS = new Set([
  "/api/accessibility-feedback",
  "/api/financing/pathways",
  "/api/financing/intake",
  "/api/readiness",
  "/api/service-requests/status",
  // A person exercising rights over their OWN data must not need an account
  // — the reference+email proof is the authentication, same as the status
  // lookup. Gating rights behind a login would defeat the right.
  "/api/public/my-data",
  "/api/public/chain-of-custody",
  // Identity verification is opened by a customer who has NO account — the
  // deal's signed link token is the authorization, exactly as it is for the
  // secure upload channel. Gating this behind a session would make the
  // identity-verified tier unreachable by the only people who need it.
  "/api/identity/verify",
]);

function cleanPathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function strictSwitchEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function apiAuthEnforcementRequired(
  env: ApiSecurityEnvironment = process.env
): boolean {
  return env.API_AUTH_ENFORCEMENT?.trim().toLowerCase() === "required";
}

export function apiRateLimitingEnabled(
  env: ApiSecurityEnvironment = process.env
): boolean {
  return strictSwitchEnabled(env.RATE_LIMITING_ENABLED);
}

export function apiSecurityPublicReason(
  pathname: string
): PublicApiReason | null {
  const normalized = cleanPathname(pathname);

  if (
    NEXTAUTH_PUBLIC_PATHS.has(normalized) ||
    Array.from(NEXTAUTH_PUBLIC_PATHS).some((path) =>
      normalized.startsWith(`${path}/`)
    )
  ) {
    return "nextauth-runtime";
  }

  if (PUBLIC_SIGNATURE_GATED_PATHS.has(normalized)) {
    return "stripe-webhook-signature-gated";
  }

  if (
    normalized === PUBLIC_SURFACE_GATEWAY_PREFIX ||
    normalized.startsWith(`${PUBLIC_SURFACE_GATEWAY_PREFIX}/`)
  ) {
    return "public-surface-gateway";
  }

  if (
    PUBLIC_SURFACE_PATHS.has(normalized) ||
    Array.from(PUBLIC_SURFACE_PATHS).some((path) =>
      normalized.startsWith(`${path}/`),
    )
  ) {
    return "public-surface-gateway";
  }

  if (INTERNAL_IAM_GATED_PATHS.has(normalized)) {
    return "internal-source-refresh-iam-gated";
  }

  return null;
}

export function normalizeOptionalRole(role: unknown): AccessRole | null {
  if (role === null || role === undefined || role === "") {
    return null;
  }

  return normalizeAccessRole(role);
}

export function extractClaimedActorContext(
  input: Record<string, unknown> | null | undefined
): ClaimedActorContext {
  if (!input || typeof input !== "object") {
    return {};
  }

  const metadata =
    typeof input.metadata === "object" && input.metadata !== null
      ? (input.metadata as Record<string, unknown>)
      : {};

  return {
    role: normalizeOptionalRole(
      input.role ?? metadata.role ?? metadata.actorRole
    ),
    actorId: normalizeOptionalText(
      input.userId ?? input.actorId ?? input.borrowerId ?? metadata.actorId
    ),
    tenantId: normalizeOptionalText(input.tenantId ?? metadata.tenantId),
  };
}

export function extractClaimedActorContextFromSearchParams(
  searchParams: URLSearchParams
): ClaimedActorContext {
  return {
    role: normalizeOptionalRole(
      searchParams.get("role") ?? searchParams.get("actorRole")
    ),
    actorId: normalizeOptionalText(
      searchParams.get("userId") ??
        searchParams.get("actorId") ??
        searchParams.get("borrowerId")
    ),
    tenantId: normalizeOptionalText(searchParams.get("tenantId")),
  };
}

export function roleClaimConflictsWithSession(input: {
  sessionRole?: unknown;
  claimedRole?: unknown;
}): boolean {
  const sessionRole = normalizeOptionalRole(input.sessionRole);
  const claimedRole = normalizeOptionalRole(input.claimedRole);

  return Boolean(sessionRole && claimedRole && sessionRole !== claimedRole);
}

export function actorClaimConflictsWithSession(input: {
  sessionActorId?: string | null;
  claimedActorId?: string | null;
}): boolean {
  return Boolean(
    input.sessionActorId &&
      input.claimedActorId &&
      input.sessionActorId !== input.claimedActorId
  );
}

export function tenantClaimConflictsWithSession(input: {
  sessionTenantId?: string | null;
  claimedTenantId?: string | null;
}): boolean {
  return Boolean(
    input.sessionTenantId &&
      input.claimedTenantId &&
      input.sessionTenantId !== input.claimedTenantId
  );
}

export function normalizeOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized.length > 0 ? normalized : null;
}
