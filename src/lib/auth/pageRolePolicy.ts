import type { AccessRole } from "@/lib/auth/accessControl";
import {
  isInternalChromeRoute,
  isProtectedPage,
} from "@/lib/auth/protectedRoutes";

export type PageRoleDecision = Readonly<{
  protected: boolean;
  allowed: boolean;
  reason: string;
}>;

const INTERNAL_ROLES = new Set<AccessRole>(["operator", "admin", "governance"]);

export function evaluateProtectedPageRole(
  pathname: string,
  role: AccessRole,
): PageRoleDecision {
  if (!isProtectedPage(pathname))
    return { protected: false, allowed: true, reason: "public-page" };

  if (pathname === "/security/mfa" || pathname.startsWith("/security/mfa/")) {
    return {
      protected: true,
      allowed: true,
      reason: "authenticated-mfa-bootstrap",
    };
  }

  if (pathname === "/lender-desk" || pathname.startsWith("/lender-desk/")) {
    const allowed = role === "lender" || role === "governance";
    return {
      protected: true,
      allowed,
      reason: allowed ? "lender-desk-role" : "lender-desk-denied",
    };
  }

  if (pathname === "/portal" || pathname.startsWith("/portal/")) {
    const allowed =
      role === "user" || role === "borrower" || role === "governance";
    return {
      protected: true,
      allowed,
      reason: allowed ? "customer-portal-role" : "customer-portal-denied",
    };
  }
  if (
    pathname === "/internal/synthetic-fixtures" ||
    pathname.startsWith("/internal/synthetic-fixtures/")
  ) {
    // The launcher is session-gated here, then identity-allowlisted inside the
    // page/API route. Some fresh staging sessions still carry the durable
    // customer role until the runtime bridge stamps operator/governance context;
    // do not let that proxy role lag mask the page's stricter allowlist.
    const allowed =
      role === "user" || role === "operator" || role === "governance";
    return {
      protected: true,
      allowed,
      reason: allowed
        ? "synthetic-fixture-authenticated-session"
        : "synthetic-fixture-session-denied",
    };
  }
  if (isInternalChromeRoute(pathname)) {
    const allowed = INTERNAL_ROLES.has(role);
    return {
      protected: true,
      allowed,
      reason: allowed ? "internal-role" : "internal-role-denied",
    };
  }

  return {
    protected: true,
    allowed: false,
    reason: "protected-page-no-role-policy",
  };
}
