import {
  apiAuthEnforcementRequired,
  apiRateLimitingEnabled,
  apiSecurityPublicReason,
  extractClaimedActorContext,
  extractClaimedActorContextFromSearchParams,
  roleClaimConflictsWithSession,
  tenantClaimConflictsWithSession,
} from "@/lib/security/apiSecurityPolicy";

/**
 * API Security Policy Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: verifies protected routes require accountable identity authority.
 * - Vol II: verifies caller-claimed role/tenant data cannot silently drift
 *   from authenticated session authority.
 * - Vol III: keeps API perimeter policy deterministic and regression-tested.
 * - Vol IV: supports security operations and deployment readiness review.
 * - Vol V: preserves source authority, controlled disclosure, and promotion
 *   gate evidence.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    apiSecurityPublicReason("/api/auth/session") === "nextauth-runtime",
    "NextAuth session route should remain public for NextAuth runtime."
  );
  assert(
    apiSecurityPublicReason("/api/auth/init") === null,
    "Auth initialization must not be treated as a public NextAuth runtime route."
  );
  assert(
    apiSecurityPublicReason("/api/stripe/webhook") ===
      "stripe-webhook-signature-gated",
    "Stripe webhook should remain public only because it is signature-gated."
  );
  assert(
    apiSecurityPublicReason("/api/public/surfaces") ===
      "public-surface-gateway",
    "Public surface gateway routes should be public-safe gateway routes."
  );
  assert(
    apiSecurityPublicReason("/api/internal/source-refresh") ===
      "internal-source-refresh-iam-gated",
    "Source refresh must be proxy-exempt only because the Cloud Run IAM wall and route-level token gate still apply."
  );
  assert(
    apiSecurityPublicReason("/api/apply") === null,
    "Protected application route should not be public."
  );
  assert(
    apiAuthEnforcementRequired({
      API_AUTH_ENFORCEMENT: "required",
    }),
    "API_AUTH_ENFORCEMENT=required should enable auth enforcement."
  );
  assert(
    apiRateLimitingEnabled({
      RATE_LIMITING_ENABLED: "true",
    }),
    "RATE_LIMITING_ENABLED=true should enable rate limiting."
  );
  assert(
    roleClaimConflictsWithSession({
      sessionRole: "user",
      claimedRole: "admin",
    }),
    "Caller-claimed admin role should conflict with a user session."
  );
  assert(
    !roleClaimConflictsWithSession({
      sessionRole: "operator",
      claimedRole: "operator",
    }),
    "Matching session and caller role should not conflict."
  );
  assert(
    tenantClaimConflictsWithSession({
      sessionTenantId: "tenant-a",
      claimedTenantId: "tenant-b",
    }),
    "Cross-tenant caller claim should conflict with session tenant."
  );

  const bodyClaims = extractClaimedActorContext({
    role: "underwriter",
    userId: "user-1",
    tenantId: "tenant-1",
  });

  assert(bodyClaims.role === "underwriter", "Body role claim should parse.");
  assert(bodyClaims.actorId === "user-1", "Body actor claim should parse.");
  assert(bodyClaims.tenantId === "tenant-1", "Body tenant claim should parse.");

  const queryClaims = extractClaimedActorContextFromSearchParams(
    new URLSearchParams("role=operator&userId=user-2&tenantId=tenant-2")
  );

  assert(queryClaims.role === "operator", "Query role claim should parse.");
  assert(queryClaims.actorId === "user-2", "Query actor claim should parse.");
  assert(queryClaims.tenantId === "tenant-2", "Query tenant claim should parse.");

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "API security policy smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
