/**
 * Operator registry — pragmatic Module 45 (Human Authority Registry) alignment.
 *
 * Platform governance is owner-controlled with independent review required at
 * constitutionally significant gates. External professional workspaces may remain
 * available without conferring Furlong ownership, governance, or approval authority.
 *
 * This is the pragmatic first pass: the operator identities + capabilities live
 * here, aligned to Module 45 roles. A later pass can drive these fully from the
 * humanAuthorityRegistry bindings (single/dual/quorum clearing). Edge-safe.
 */

export type OperatorCapability =
  "view:internal" | "approve:source-legal" | "operate:lender-desk";

export interface Operator {
  id: string;
  email: string; // matches the NextAuth credential login email
  name: string; // first name only (team-names-dark policy: no surnames surfaced)
  role: string; // Module 45-aligned role label
  capabilities: OperatorCapability[];
  /**
   * Professional license this operator holds for their role, if any. Module 45
   * distinguishes license-bearing roles (finance/broker, environmental/
   * compliance) from non-license roles (media/communications). null = role does
   * not require a license.
   */
  license: string | null;
}

/**
 * Authorized operators. Caitlin is the current Furlong operator. A legacy
 * external-broker workspace remains available solely for lender-desk operation.
 */
export const OPERATORS: Operator[] = [
  {
    id: "op-caitlin",
    email: "chudson@aresfarmsinc.com",
    name: "Caitlin",
    role: "founder-operator",
    capabilities: ["view:internal", "approve:source-legal"],
    license: "Environmental / compliance (licensed)",
  },
  {
    id: "op-external-broker-workspace",
    email: "sfraas@aresfarmsinc.com",
    name: "Stuart",
    role: "external-broker-operator",
    capabilities: ["operate:lender-desk"],
    license:
      "Commercial debt broker workspace - credential status must be independently verified before regulated reliance",
  },
];

function norm(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function operatorByEmail(
  email: string | null | undefined,
): Operator | null {
  const e = norm(email);
  return OPERATORS.find((o) => o.email.toLowerCase() === e) ?? null;
}

export function canViewInternalReview(
  email: string | null | undefined,
): boolean {
  return (
    operatorByEmail(email)?.capabilities.includes("view:internal") ?? false
  );
}

export function canApproveSourceLegal(
  email: string | null | undefined,
): boolean {
  return (
    operatorByEmail(email)?.capabilities.includes("approve:source-legal") ??
    false
  );
}

/** Operators who may approve source-legal — surfaced so the UI can show "no bottleneck". */
export function sourceLegalApprovers(): Operator[] {
  return OPERATORS.filter((o) =>
    o.capabilities.includes("approve:source-legal"),
  );
}

export function canOperateLenderDesk(
  email: string | null | undefined,
): boolean {
  return (
    operatorByEmail(email)?.capabilities.includes("operate:lender-desk") ??
    false
  );
}

export function internalLenderDeskRole(
  email: string | null | undefined,
  environment: string | null | undefined = process.env
    .FURLONG_DEPLOYMENT_ENVIRONMENT,
): "broker" | null {
  const normalizedEnvironment = (environment ?? "development")
    .trim()
    .toLowerCase();
  if (normalizedEnvironment === "production") return null;
  return canOperateLenderDesk(email) ? "broker" : null;
}
