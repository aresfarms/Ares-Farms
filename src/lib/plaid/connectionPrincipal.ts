import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { identityVerifications } from "@/db/schema";
import { pseudonymousActorUuid } from "@/lib/audit/writeAuditEvent";
import { ensureAccessSecurityState } from "@/lib/auth/accessSecurityRuntime";
import {
  MFA_ASSURANCE_COOKIE,
  MFA_STEP_UP_MAX_AGE_SECONDS,
  verifyMfaAssurance,
} from "@/lib/auth/mfaAssurance";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import { db } from "@/lib/db";
import { verifyUploadLinkToken } from "@/lib/documents/uploadLinkToken";

/**
 * connectionPrincipal — who is authorised to open a bank connection, and on
 * what evidence.
 *
 * TWO DOORS, ONE SHAPE. Opening Plaid Link authorises ongoing access to
 * financial-account data, so both routes (`link-token`, `exchange`) must apply
 * identical rules. Before this module they each re-derived identity inline from
 * the session, which is why the customer could not reach bank connection at all
 * (G-2): sessions come from CredentialsProvider — staff and professionals — and
 * customers have no accounts by design.
 *
 *   STAFF / PROFESSIONAL DOOR — session + fresh passkey MFA. Unchanged. Stuart
 *     drives the Plaid synthetic fixtures through it and that lane must keep
 *     working.
 *
 *   CUSTOMER DOOR — the deal's signed link token + a VERIFIED IDENTITY
 *     (founder-approved 2026-08-10).
 *
 * WHY IDENTITY IS THE STEP-UP RATHER THAN MFA: the staff door demands fresh
 * passkey MFA, which is right for an account holder. A customer has no account
 * and therefore no passkey. A passkey proves possession of a device; an
 * identity verification proves PERSONHOOD, checked against a government
 * document by a provider. For someone with no account that is not a weaker
 * substitute — it is a stronger assurance, and it is the same check the action
 * gate already requires for `connect-financial-account`.
 *
 * NEITHER DOOR IS A FALLBACK FOR THE OTHER. A token without a verified identity
 * is REFUSED, never downgraded; an expired session does not silently become a
 * customer. Each door produces its own evidence and its own subject.
 *
 * SUBJECTS NEVER COLLIDE. Encrypted account data is stored under `subjectRef`.
 * Staff subjects are `user:<uuid>`, customer subjects are `deal:<applicationId>`
 * — different namespaces, so one door can never read the other's records.
 *
 * Master Volume Governance: Vol II (authority granted not asserted, consent
 * before action), Vol III-B (GOV-RUNTIME-001), Vol V (evidence preserved).
 */

export type PlaidStepUp =
  | { kind: "passkey-mfa"; method: string; verifiedAt: string }
  | { kind: "identity-verification"; verificationId: string; verifiedAt: string | null };

export interface PlaidPrincipal {
  door: "staff-session" | "customer-token";
  /** Storage + audit subject. Namespaced so doors cannot collide. */
  subjectRef: string;
  /** Human-readable actor for the audit trail. */
  actorRef: string;
  /**
   * What goes into audit_events.user_id (NOT NULL uuid). Staff supply their
   * real id; the customer door uses the deterministic pseudonymous actor so a
   * later authorization lookup can recompute exactly the same value.
   */
  auditUserId: string;
  /** Passed to writeAuditEvent for the customer door; null for staff. */
  anonymousId: string | null;
  /** Plaid `client_user_id` — stable per subject, never a raw email. */
  plaidClientUserId: string;
  email: string | null;
  dealRef: string | null;
  sessionVersion: number | null;
  stepUp: PlaidStepUp;
}

export type PrincipalResolution =
  | { ok: true; principal: PlaidPrincipal }
  | { ok: false; status: number; error: string; identityRequired?: boolean };

/** Seed shape must match writeAuditEvent's own. */
export function customerAuditUserId(applicationId: string): string {
  return pseudonymousActorUuid(`furlong-audit-actor:deal:${applicationId}`);
}

/**
 * Resolve the caller. Customer door is tried FIRST and only when a token is
 * actually presented, so an operator session is never reinterpreted.
 */
export async function resolvePlaidPrincipal(
  req: NextRequest,
  body: { token?: unknown; dealRef?: unknown } | null
): Promise<PrincipalResolution> {
  const token = typeof body?.token === "string" ? body.token.slice(0, 2048) : "";

  // ---- Customer door -----------------------------------------------------
  if (token) {
    const claims = verifyUploadLinkToken(token);
    if (!claims) {
      return {
        ok: false,
        status: 401,
        error:
          "This link is invalid or has expired. Ask your contact for a fresh one — expiring links are part of how the channel stays safe.",
      };
    }
    const [identity] = await db
      .select({
        id: identityVerifications.id,
        verified: identityVerifications.verified,
        verifiedAt: identityVerifications.verifiedAt,
      })
      .from(identityVerifications)
      .where(eq(identityVerifications.subjectRef, claims.applicationId))
      .orderBy(desc(identityVerifications.createdAt))
      .limit(1);

    if (identity?.verified !== true) {
      // Refused, not downgraded. An unverified holder of a link is precisely
      // the person who must not be able to authorise ongoing account access.
      return {
        ok: false,
        status: 403,
        identityRequired: true,
        error:
          "Verify your identity before connecting a bank account. Connecting an account authorises ongoing access to it, so we confirm who is doing it first.",
      };
    }

    return {
      ok: true,
      principal: {
        door: "customer-token",
        subjectRef: `deal:${claims.applicationId}`,
        actorRef: `anon:deal:${claims.applicationId}`,
        auditUserId: customerAuditUserId(claims.applicationId),
        anonymousId: `deal:${claims.applicationId}`,
        plaidClientUserId: `deal:${claims.applicationId}`,
        email: null,
        dealRef: claims.dealRef ?? null,
        sessionVersion: null,
        stepUp: {
          kind: "identity-verification",
          verificationId: identity.id,
          verifiedAt: identity.verifiedAt ? identity.verifiedAt.toISOString() : null,
        },
      },
    };
  }

  // ---- Staff / professional door -----------------------------------------
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { id?: string; email?: string; sessionVersion?: number }
    | undefined;
  if (!user?.id) {
    return { ok: false, status: 401, error: "Authenticated user required." };
  }
  const state = await ensureAccessSecurityState(user.id);
  if (
    typeof user.sessionVersion === "number" &&
    user.sessionVersion !== state.sessionVersion
  ) {
    return { ok: false, status: 401, error: "Session authority has changed. Sign in again." };
  }
  const secret = resolveNextAuthSecret();
  if (!secret) {
    return { ok: false, status: 503, error: "Session signing authority unavailable." };
  }
  const assurance = await verifyMfaAssurance({
    token: req.cookies.get(MFA_ASSURANCE_COOKIE)?.value,
    userId: user.id,
    sessionVersion: state.sessionVersion,
    secret,
    maxVerifiedAgeSeconds: MFA_STEP_UP_MAX_AGE_SECONDS,
  });
  if (!assurance) {
    return {
      ok: false,
      status: 403,
      error: "Fresh passkey MFA is required before Plaid Link can open.",
    };
  }

  const dealRef = typeof body?.dealRef === "string" ? body.dealRef.trim().slice(0, 120) || null : null;
  return {
    ok: true,
    principal: {
      door: "staff-session",
      subjectRef: `user:${user.id}`,
      actorRef: `user:${user.id}`,
      auditUserId: user.id,
      anonymousId: null,
      plaidClientUserId: user.id,
      email: user.email ?? null,
      dealRef,
      sessionVersion: state.sessionVersion,
      stepUp: {
        kind: "passkey-mfa",
        method: assurance.method,
        verifiedAt: assurance.verifiedAt,
      },
    },
  };
}
