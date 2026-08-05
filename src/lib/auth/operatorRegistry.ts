/**
 * Operator registry — pragmatic Module 45 (Human Authority Registry) alignment.
 *
 * Multiple operators (not a single shared owner). VIEWING internal review
 * surfaces is open to every operator; the right to APPROVE a gate (e.g. Module 23
 * source legal review) is held by enough operators that no one person is a
 * bottleneck, and every approve/reject is attributed in the audit ledger.
 *
 * This is the pragmatic first pass: the operator identities + capabilities live
 * here, aligned to Module 45 roles. A later pass can drive these fully from the
 * humanAuthorityRegistry bindings (single/dual/quorum clearing). Edge-safe.
 */

export type OperatorCapability = "view:internal" | "approve:source-legal";

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
 * Authorized operators. Approve authority for source-legal is granted to more
 * than one holder (no single-person bottleneck); all three can view.
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
    id: "op-stuart",
    email: "sfraas@aresfarmsinc.com",
    name: "Stuart",
    role: "operator",
    capabilities: ["view:internal", "approve:source-legal"],
    license: "Finance / commercial loan broker (licensed)",
  },
  {
    id: "op-frances",
    email: "frances@aresfarmsinc.com",
    name: "Frances",
    role: "operator",
    capabilities: ["view:internal", "approve:source-legal"],
    license: null, // Media / Communications — no professional license required
  },
];

function norm(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function operatorByEmail(email: string | null | undefined): Operator | null {
  const e = norm(email);
  return OPERATORS.find((o) => o.email.toLowerCase() === e) ?? null;
}

export function canViewInternalReview(email: string | null | undefined): boolean {
  return operatorByEmail(email)?.capabilities.includes("view:internal") ?? false;
}

export function canApproveSourceLegal(email: string | null | undefined): boolean {
  return operatorByEmail(email)?.capabilities.includes("approve:source-legal") ?? false;
}

/** Operators who may approve source-legal — surfaced so the UI can show "no bottleneck". */
export function sourceLegalApprovers(): Operator[] {
  return OPERATORS.filter((o) => o.capabilities.includes("approve:source-legal"));
}
