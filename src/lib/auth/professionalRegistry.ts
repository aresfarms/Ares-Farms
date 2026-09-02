/**
 * professionalRegistry — the named counterparties who may sign in through
 * /professional-access (founder direction 2026-08-06). Distinct from the
 * OPERATOR registry: operators run the platform; professionals are outside
 * counterparties working a specific file (lender, attorney, auditor,
 * sponsor).
 *
 * WHY A REGISTRY AND NOT A CLAIM: the sign-in page lets a visitor pick a
 * lane, but picking grants nothing. The role is resolved HERE, server-side,
 * from the session-verified email. An email not listed gets no role — the
 * API perimeter then denies every governed surface. This mirrors Module 45
 * accountable authority: access belongs to named humans, recorded, not to
 * whoever asserts it.
 *
 * Edge-safe: pure constants + string helpers, no runtime imports.
 */

import type { AccessRole } from "@/lib/auth/accessControl";

export interface ProfessionalGrant {
  email: string;
  name: string;
  role: Extract<AccessRole, "broker" | "lender" | "attorney" | "auditor" | "sponsor">;
  /** Organization of record — shown in access logs, never to customers. */
  organization: string;
  /** Why this person has access; the audit answer to "who let them in". */
  basis: string;
}

/**
 * Live grants. Add a person ONLY with a founder decision and a real basis —
 * this list is the answer to a regulator asking "who could see this file?"
 */
export const PROFESSIONAL_GRANTS: ProfessionalGrant[] = [
  {
    email: "sfraas@aresfarmsinc.com",
    name: "Stuart",
    role: "broker",
    organization: "Furlong Inc. — Compass to Capital",
    basis: "Network commercial debt broker; borrower financing requests route to the broker workspace before any governed lender handoff.",
  },
];

function norm(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** The professional grant for a session-verified email, or null. */
export function professionalByEmail(email: string | null | undefined): ProfessionalGrant | null {
  const e = norm(email);
  if (!e) return null;
  return PROFESSIONAL_GRANTS.find((p) => p.email.toLowerCase() === e) ?? null;
}


export function stagingTestProfessionalByEmail(
  email: string | null | undefined,
  role: ProfessionalGrant["role"],
): ProfessionalGrant | null {
  const e = norm(email);
  if (process.env.PROFESSIONAL_TEST_PERSONAS_ENABLED !== "true" || e !== "chudson@aresfarmsinc.com") return null;
  return {
    email: e,
    name: "Pocohantus Smith",
    role,
    organization: `Furlong Staging Test ${role}`,
    basis: "STAGING TEST PERSONA ONLY — no real-world professional authority.",
  };
}

/** Roles granted to an email (empty = no professional access). */
export function professionalRole(email: string | null | undefined): ProfessionalGrant["role"] | null {
  return professionalByEmail(email)?.role ?? null;
}
