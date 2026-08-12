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
/**
 * EVERY route under /api/public, enumerated.
 *
 * This used to be a bare prefix — `/api/public` — which meant a file was
 * exempt from the API perimeter because of WHERE IT SAT, not because anyone
 * decided it should be. Add a file to that folder and it was public: no list
 * entry, no review, no gate (sweep finding S-1, 2026-08-11).
 *
 * That is the same polarity error PlatformChrome records having already made
 * and fixed for page chrome — "the previous design allowlisted public routes
 * and leaked internal chrome onto anything it forgot to list. Never again."
 * The page chrome was corrected; the API perimeter was not.
 *
 * Each entry below is now a decision with a name attached. `verify:public-api-
 * surface` fails if a file exists under src/app/api/public/ that is not listed
 * here, so route 27 cannot inherit publicity for free.
 *
 * Matched exactly or by sub-path, so dynamic segments (anon-token/[action])
 * are covered by their parent entry.
 */
export const PUBLIC_API_ROUTES = new Set([
  // -- Anonymous discovery + property intelligence. No PII, no account. -----
  "/api/public/property-facts",
  "/api/public/property-discovery",
  "/api/public/property-import",
  "/api/public/property-report-pdf",
  "/api/public/property-report-token",
  "/api/public/property-proforma-pdf",
  "/api/public/market-context",
  "/api/public/weather-risk",
  "/api/public/equipment",
  "/api/public/grants",
  "/api/public/program-match",
  "/api/public/special-building-review",
  "/api/public/surfaces",
  "/api/public/discovery/converse",
  "/api/public/navigator/converse",
  "/api/public/bound-edition-interest",

  // -- The customer's own file. Authorization is a signed token or the
  //    reference+email pair; a customer never has an account. --------------
  "/api/public/secure-upload",
  "/api/public/document-download",
  "/api/public/document-sign",
  "/api/public/upload-security-scan",
  "/api/public/my-data",
  "/api/public/chain-of-custody",
  "/api/public/anon-token",

  // -- Counterparty intake. Opens no data; it REQUESTS access. -------------
  "/api/public/professional-verification-request",

  // -- Guarded non-production surfaces. PUBLIC ONLY IN THE SENSE THAT THE
  //    PERIMETER DOES NOT GATE THEM; each fails closed on its own:
  //    · local-founder-password-bootstrap — 404s unless NODE_ENV is not
  //      production AND the hostname is localhost, and refuses once a
  //      password exists.
  //    · professional-test-persona — 404s unless the synthetic-fixture
  //      runtime is enabled AND the caller's email is the test address.
  //    Listed explicitly so their presence is a standing decision that a
  //    reviewer re-reads, rather than an accident of directory layout.
  "/api/public/local-founder-password-bootstrap",
  "/api/public/professional-test-persona",
]);
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
    PUBLIC_API_ROUTES.has(normalized) ||
    Array.from(PUBLIC_API_ROUTES).some((path) =>
      normalized.startsWith(`${path}/`),
    )
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
