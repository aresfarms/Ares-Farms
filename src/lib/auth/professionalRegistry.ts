/**
 * Professional counterpart registry.
 *
 * Static grants are reserved for transition/special counterparties. Capital
 * Network brokers and lenders are normally resolved dynamically from their
 * certified provider profile by professionalAccessAuthority.
 */
import type { AccessRole } from "@/lib/auth/accessControl";

export interface ProfessionalGrant {
  email: string;
  name: string;
  role: Extract<AccessRole, "broker" | "lender" | "attorney" | "auditor" | "sponsor">;
  organization: string;
  basis: string;
  /** Capital Network provider identity for broker/lender case scoping. */
  providerId?: string | null;
}

export const PROFESSIONAL_GRANTS: ProfessionalGrant[] = [
  {
    email: "sfraas@aresfarmsinc.com",
    name: "Stuart",
    role: "broker",
    organization: "External commercial debt broker — retained transition workspace",
    basis: "Temporary external-broker workspace access for legacy or explicitly assigned financing cases only. New Furlong Capital Desk intakes are not automatically visible or routed here.",
    providerId: "retained-external-broker",
  },
];

function norm(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

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
    providerId: role === "broker" || role === "lender" ? `staging-test-${role}` : null,
  };
}

export function professionalRole(email: string | null | undefined): ProfessionalGrant["role"] | null {
  return professionalByEmail(email)?.role ?? null;
}
