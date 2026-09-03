/**
 * Financing Intake Runtime (customer submits a deal — PURE)
 *
 * The customer submits a financing deal, which is recorded and routed to the
 * appropriately credentialed external lending spoke that works it under its own licensed
 * capacity. This runtime is pure and deterministic: it validates the intake and
 * routes it. It NEVER qualifies, approves, prices, or makes any credit
 * determination — Furlong facilitates; the licensed lender decides.
 *
 * Master Volume Governance:
 * - Vol I (CONST-PATHWAY-001 / FACILITATION-001 §3.32): facilitate, do not
 *   decide. "A program fitting a project is not the same as you qualifying."
 * - Vol II (Section 1071 firewall §3.20): NO demographic data is collected —
 *   the fields do not exist. (CONST-FAIR-001/002): no adverse-action or
 *   qualification determination is made here.
 * - Vol II (MATERIALITY-TIER / FACILITATION-001): no Tier-A (credit) decision
 *   by AI without human confirmation — this route makes NO decision at all.
 * - Vol III-B (HITL-GOV-001 §3.51): human review required — the licensed lender
 *   is the reviewer of record.
 * - Vol V (CANON-TREASURY-001 §9.1): any fee disclosed at intake, no post-hoc.
 *
 * Deterministic: the only non-determinism is the `generatedAt` timestamp.
 */

export const FINANCING_INTAKE_RUNTIME_VERSION = "financing-intake-runtime-v0.1.0";

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
  routedTo: "licensed-lending-spoke" | "recorded-no-network-lender";
  /** Honest routing note shown to the customer when no in-network lender
      handles this deal type (founder 2026-08-05: the licensed lender does
      commercial/business debt — FSA farm loans and residential mortgages
      are out-of-network and must never pretend otherwise). */
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
    missing.push("Consent to route your request to the commercial debt broker");
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

  // FSA farm loans are out-of-network: the in-network licensed lender
  // sources commercial/business debt and does not originate FSA or
  // residential paper (founder 2026-08-05). The deal is still recorded —
  // demand is a real signal — but never routed as a live lead.
  const outOfNetwork = input.programInterest === "fsa";
  return {
    runtimeVersion: FINANCING_INTAKE_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    purpose,
    programInterest: program,
    routedTo: outOfNetwork ? "recorded-no-network-lender" : "licensed-lending-spoke",
    networkNote: outOfNetwork
      ? "Heads up: our in-network licensed lender sources commercial and business debt — FSA farm loans aren't in network. Your submission is recorded, but it will not be reviewed by a lender here. FSA-guaranteed lenders, Farm Credit associations, and ag banks make these loans — your Furlong pro forma is built to take to any of them."
      : null,
    readiness: {
      readinessPercent: Math.max(0, Math.min(100, readinessPercent)),
      missingItems,
      reviewSignals: buildReviewSignals(input, purpose, program),
    },
    feeDisclosure: {
      payerPosture:
        "There is no fee to submit your deal or to have the licensed lender review it.",
      amountLabel: "No submission fee",
      note: "Loan costs (rate, points, closing costs) are set by the lender and the program at closing and are disclosed to you in writing before you commit — never after the fact.",
    },
    nextSteps: [
      "Your deal is recorded and routed to the licensed lender (the lending spoke).",
      "The lender reviews it and contacts you to discuss fit and next steps.",
      "You decide whether to proceed — nothing is committed until you and the lender agree.",
    ],
    disclosures: [
      "Furlong records and routes your request; it does not lend, qualify, approve, price, or determine eligibility.",
      "A program fitting your project is not the same as you qualifying — the licensed lender makes that call.",
      "This is not a loan application decision, a pre-approval, or a rate lock.",
      "Furlong takes no compensation tied to your transaction — it is not paid a commission or a per-deal fee.",
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
