/**
 * Financing Intake Runtime (customer submits a deal — PURE)
 *
 * The customer submits a financing deal, which is recorded and routed to the
 * appropriately credentialed external lending spoke that works it under its own licensed
 * capacity. This runtime is pure and deterministic: it validates the intake and
 * routes it into the Furlong Capital Desk. It NEVER qualifies, approves, prices,
 * or makes any credit determination — Furlong facilitates; the funding institution decides.
 *
 * Master Volume Governance:
 * - Vol I (CONST-PATHWAY-001 / FACILITATION-001 §3.32): facilitate, do not
 *   decide. "A program fitting a project is not the same as you qualifying."
 * - Vol II (Section 1071 firewall §3.20): NO demographic data is collected —
 *   the fields do not exist. (CONST-FAIR-001/002): no adverse-action or
 *   qualification determination is made here.
 * - Vol II (MATERIALITY-TIER / FACILITATION-001): no Tier-A (credit) decision
 *   by AI without human confirmation — this route makes NO decision at all.
 * - Vol III-B (HITL-GOV-001 §3.51): human review required. Capital Desk review
 *   never substitutes for the funding institution's underwriting authority.
 * - Vol V (CANON-TREASURY-001 §9.1): any fee disclosed at intake, no post-hoc.
 *
 * Deterministic: the only non-determinism is the `generatedAt` timestamp.
 */

export const FINANCING_INTAKE_RUNTIME_VERSION = "financing-intake-runtime-v0.2.0";

export type FinancingPurpose =
  | "acquisition"
  | "refinance"
  | "construction"
  | "operating"
  | "equipment"
  | "other";

export type FinancingProgramInterest =
  | "sba_7a"
  | "sba_504"
  | "usda_bi"
  | "fsa"
  | "conventional"
  | "unsure";

export interface FinancingPurposeOption {
  code: FinancingPurpose;
  label: string;
}

export const FINANCING_PURPOSES: FinancingPurposeOption[] = [
  { code: "acquisition", label: "Buy a property or business" },
  { code: "refinance", label: "Refinance existing debt" },
  { code: "construction", label: "Build or renovate" },
  { code: "operating", label: "Operating / working capital" },
  { code: "equipment", label: "Equipment" },
  { code: "other", label: "Something else" },
];

export interface FinancingProgramOption {
  code: FinancingProgramInterest;
  label: string;
}

export const FINANCING_PROGRAMS: FinancingProgramOption[] = [
  { code: "sba_7a", label: "SBA 7(a)" },
  { code: "sba_504", label: "SBA 504" },
  { code: "usda_bi", label: "USDA B&I" },
  { code: "fsa", label: "USDA / FSA (farm)" },
  { code: "conventional", label: "Conventional" },
  { code: "unsure", label: "Not sure — help me figure it out" },
];

export interface FinancingIntakeInput {
  userId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  purpose?: FinancingPurpose | null;
  programInterest?: FinancingProgramInterest | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  contactCity?: string | null;
  contactState?: string | null;
  contactPostalCode?: string | null;
  propertyDescriptor?: string | null;
  location?: {
    state?: string | null;
    county?: string | null;
  } | null;
  estimatedProjectCost?: number | null;
  scopeSummary?: string | null;
  timeline?: string | null;
  feeDisclosureAcknowledged?: boolean | null;
  consentAcknowledged?: boolean | null;
}

export interface FinancingIntakeResult {
  runtimeVersion: string;
  generatedAt: string;
  purpose: FinancingPurposeOption | null;
  programInterest: FinancingProgramOption | null;
  routedTo: "furlong-capital-desk";
  /** Honest network posture. Intake does not imply that a live lender has been
      selected or that a candidate is authorized to receive borrower data. */
  networkNote: string | null;
  readiness: {
    readinessPercent: number;
    missingItems: string[];
    reviewSignals: string[];
  };
  feeDisclosure: {
    payerPosture: string;
    amountLabel: string;
    note: string;
  };
  nextSteps: string[];
  disclosures: string[];
  blockedClaims: string[];
  /** Literal safety flags — this route makes no credit decision. */
  humanReviewRequired: true;
  advisoryOnly: true;
  qualificationDetermined: false;
  productionBlocked: true;
}

function findPurpose(code?: FinancingPurpose | null): FinancingPurposeOption | null {
  if (!code) return null;
  return FINANCING_PURPOSES.find((p) => p.code === code) ?? null;
}

function findProgram(
  code?: FinancingProgramInterest | null
): FinancingProgramOption | null {
  if (!code) return null;
  return FINANCING_PROGRAMS.find((p) => p.code === code) ?? null;
}

function buildMissingItems(input: FinancingIntakeInput): string[] {
  const missing: string[] = [];
  if (!findPurpose(input.purpose)) missing.push("What the financing is for");
  if (!input.contactName?.trim()) missing.push("Your name");
  if (!input.contactEmail?.trim()) missing.push("A contact email");
  if (!input.location?.state?.trim()) missing.push("State");
  if (!input.feeDisclosureAcknowledged)
    missing.push("Acknowledge the fee posture");
  if (!input.consentAcknowledged)
    missing.push("Consent to route your request through the Furlong Capital Desk");
  return missing;
}

function buildReviewSignals(
  input: FinancingIntakeInput,
  purpose: FinancingPurposeOption | null,
  program: FinancingProgramOption | null
): string[] {
  const signals: string[] = [];
  if (purpose) signals.push(`Purpose: ${purpose.label}`);
  if (program) signals.push(`Program interest: ${program.label}`);
  if (input.location?.state)
    signals.push(
      `Location: ${[input.location.county, input.location.state]
        .filter(Boolean)
        .join(", ")}`
    );
  if (typeof input.estimatedProjectCost === "number" && input.estimatedProjectCost > 0)
    signals.push("Project size provided (context only — not a credit decision)");
  if (input.timeline?.trim()) signals.push(`Timeline: ${input.timeline}`);
  return signals;
}

export function evaluateFinancingIntake(
  input: FinancingIntakeInput = {}
): FinancingIntakeResult {
  const purpose = findPurpose(input.purpose);
  const program = findProgram(input.programInterest);
  const missingItems = buildMissingItems(input);
  const totalChecks = 6;
  const readinessPercent = Math.round(
    ((totalChecks - missingItems.length) / totalChecks) * 100
  );

  const networkNote =
    input.programInterest === "fsa"
      ? "FSA farm financing is now a Capital Desk network-search pathway. Furlong can prepare the file and identify appropriate FSA/Farm Credit candidates, but no candidate receives your information until that institution is certified for live routing and you consent to that exact handoff."
      : "Your request enters the Furlong Capital Desk first. A live lender handoff occurs only after a qualified network recipient is certified for the program/jurisdiction and the governed consent/delivery gates are satisfied.";
  return {
    runtimeVersion: FINANCING_INTAKE_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    purpose,
    programInterest: program,
    routedTo: "furlong-capital-desk",
    networkNote,
    readiness: {
      readinessPercent: Math.max(0, Math.min(100, readinessPercent)),
      missingItems,
      reviewSignals: buildReviewSignals(input, purpose, program),
    },
    feeDisclosure: {
      payerPosture:
        "There is no fee to submit your deal or receive the Capital Desk's initial readiness review.",
      amountLabel: "No submission fee",
      note: "Any later paid packaging, brokerage, referral, or consulting service requires a separate written scope, state/program authority review, and advance compensation disclosure before work begins. Loan costs are set by the funding institution.",
    },
    nextSteps: [
      "Your deal is recorded in the Furlong Capital Desk.",
      "The Capital Desk organizes readiness evidence and identifies lender/program candidates without making a credit decision.",
      "Before any live lender receives your case, Furlong verifies the recipient and obtains consent binding the exact provider, purpose, package, and delivery channel.",
      "The funding institution performs underwriting and decides whether to offer credit; you decide whether to proceed.",
    ],
    disclosures: [
      "Furlong records, prepares, and coordinates your request; Furlong Core does not lend, qualify, approve, price, or determine eligibility.",
      "A program fitting your project is not the same as you qualifying — the funding institution makes that call.",
      "This is not a loan application decision, a pre-approval, a commitment, or a rate lock.",
      "No paid commercial brokerage, packaging, or referral service is activated merely by submitting this intake. Any such service requires separate legal/program clearance and written disclosure.",
      "Your information is classified RESTRICTED, human-reviewed, and handled under the platform's data-protection controls.",
    ],
    blockedClaims: [
      "credit decision",
      "qualification",
      "pre-approval",
      "rate lock",
      "lender commitment",
    ],
    humanReviewRequired: true,
    advisoryOnly: true,
    qualificationDetermined: false,
    productionBlocked: true,
  };
}
