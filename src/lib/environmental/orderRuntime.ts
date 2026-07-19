/**
 * Environmental Order Runtime (customer-facing service ordering — PURE)
 *
 * The customer orders a real environmental service — a Phase I / II / III
 * assessment or a licensed PE review — which the Environmental Engineering
 * Spoke (a licensed PE) fulfills. This runtime is pure and deterministic: it
 * validates the order, routes it to the spoke, and returns a governed,
 * replay-safe result. It NEVER issues an environmental determination,
 * clearance, or permit — Furlong records the order and coordinates; the
 * licensed professional and the agency are the determining authorities.
 *
 * Master Volume Governance:
 * - Vol I (FACILITATION-001 §3.32): facilitate, do not decide.
 * - Vol II (REG-NEPA-001 / USDA-ENV-001 §3.21): records an order and routes to
 *   the determining authority; no determination implied; classification-aware,
 *   replay-safe order lineage.
 * - Vol III-B (HITL-GOV-001 §3.51): human review required — the PE is the
 *   reviewer of record.
 * - Vol V (CANON-TREASURY-001 §9.1): fee disclosed at intake, no post-hoc fee.
 *   (CANON-CONSENT-001 §6): consent acknowledged before the order is acted on.
 *
 * Deterministic: the only non-determinism is the `generatedAt` timestamp.
 */

export const ENVIRONMENTAL_ORDER_RUNTIME_VERSION =
  "environmental-order-runtime-v0.1.0";

export type EnvironmentalServiceCode =
  | "phase_1_esa"
  | "phase_2_esa"
  | "phase_3_remediation"
  | "pe_review";

export interface EnvironmentalServiceOption {
  code: EnvironmentalServiceCode;
  label: string;
  description: string;
  /** What the licensed PE actually delivers. */
  deliverable: string;
}

export const ENVIRONMENTAL_SERVICES: EnvironmentalServiceOption[] = [
  {
    code: "phase_1_esa",
    label: "Phase I Environmental Site Assessment",
    description:
      "Records, history, and site-walk review by an environmental professional (no sampling) that screens for recognized environmental conditions and supports the CERCLA innocent-landowner defense.",
    deliverable:
      "An ASTM E1527-conformant Phase I ESA report a lender and agency will accept.",
  },
  {
    code: "phase_2_esa",
    label: "Phase II Environmental Site Assessment",
    description:
      "Follows a Phase I that flagged a condition: actual soil and/or groundwater sampling to confirm or rule out contamination.",
    deliverable:
      "A sampling report with lab results and a professional interpretation of findings.",
  },
  {
    code: "phase_3_remediation",
    label: "Phase III / Remediation planning",
    description:
      "When contamination is confirmed: a remediation approach, cost framing, and the engineered, permit-ready plan an agency and lender will accept.",
    deliverable:
      "A stamped, sealed remediation/engineering plan prepared by a licensed PE.",
  },
  {
    code: "pe_review",
    label: "Licensed PE review",
    description:
      "A licensed environmental/professional engineer reviews your site question — wetlands/floodplain, septic capacity, stormwater, water rights — and tells you what a defensible, permit-ready path looks like.",
    deliverable:
      "A PE's written assessment and recommended next steps for your specific site.",
  },
];

export interface EnvironmentalOrderInput {
  userId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  serviceCode?: EnvironmentalServiceCode | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  propertyDescriptor?: string | null;
  location?: {
    state?: string | null;
    county?: string | null;
  } | null;
  scopeSummary?: string | null;
  estimatedValue?: number | null;
  timeline?: string | null;
  feeDisclosureAcknowledged?: boolean | null;
  consentAcknowledged?: boolean | null;
}

export interface EnvironmentalOrderResult {
  runtimeVersion: string;
  generatedAt: string;
  service: EnvironmentalServiceOption | null;
  routedTo: "environmental-engineering-spoke";
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
  /** Literal safety flags — this is never a determination. */
  humanReviewRequired: true;
  advisoryOnly: true;
  determinationIssued: false;
  productionBlocked: true;
}

function findService(
  code?: EnvironmentalServiceCode | null
): EnvironmentalServiceOption | null {
  if (!code) return null;
  return ENVIRONMENTAL_SERVICES.find((s) => s.code === code) ?? null;
}

function buildMissingItems(input: EnvironmentalOrderInput): string[] {
  const missing: string[] = [];
  if (!findService(input.serviceCode)) missing.push("Choose the service you need");
  if (!input.contactName?.trim()) missing.push("Your name");
  if (!input.contactEmail?.trim()) missing.push("A contact email");
  if (!input.propertyDescriptor?.trim())
    missing.push("The property (address or parcel)");
  if (!input.location?.state?.trim()) missing.push("State");
  if (!input.feeDisclosureAcknowledged)
    missing.push("Acknowledge the fee is quoted and approved before work begins");
  if (!input.consentAcknowledged)
    missing.push("Consent to route your request to the licensed PE");
  return missing;
}

function buildReviewSignals(
  input: EnvironmentalOrderInput,
  service: EnvironmentalServiceOption | null
): string[] {
  const signals: string[] = [];
  if (service) signals.push(`Service selected: ${service.label}`);
  if (input.location?.state)
    signals.push(
      `Location: ${[input.location.county, input.location.state]
        .filter(Boolean)
        .join(", ")}`
    );
  if (input.timeline?.trim()) signals.push(`Requested timeline: ${input.timeline}`);
  if (typeof input.estimatedValue === "number" && input.estimatedValue > 0)
    signals.push("Project size provided (used for scoping only)");
  return signals;
}

export function evaluateEnvironmentalOrder(
  input: EnvironmentalOrderInput = {}
): EnvironmentalOrderResult {
  const service = findService(input.serviceCode);
  const missingItems = buildMissingItems(input);
  const totalChecks = 7;
  const readinessPercent = Math.round(
    ((totalChecks - missingItems.length) / totalChecks) * 100
  );

  return {
    runtimeVersion: ENVIRONMENTAL_ORDER_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    service,
    routedTo: "environmental-engineering-spoke",
    readiness: {
      readinessPercent: Math.max(0, Math.min(100, readinessPercent)),
      missingItems,
      reviewSignals: buildReviewSignals(input, service),
    },
    feeDisclosure: {
      payerPosture:
        "Fees vary by scope and site — a Phase I is a fixed fee; Phase II/III and remediation are quoted to the work.",
      amountLabel: "Quoted before any work begins",
      note: "You receive and approve a written quote first. Nothing is charged without your acknowledgement, and there are no post-hoc fees.",
    },
    nextSteps: [
      "Your request is recorded and routed to the licensed PE (the Environmental Engineering Spoke).",
      "The PE confirms scope and sends you a written quote to approve.",
      "On your approval, the assessment is scheduled and the report is prepared.",
    ],
    disclosures: [
      "Furlong records and coordinates your order; it does not issue an environmental determination, clearance, or permit.",
      "The licensed PE and the reviewing agency are the determining authorities.",
      "This request is not a lender commitment and does not qualify or disqualify any property.",
      "Your information is classified RESTRICTED, human-reviewed, and handled under the platform's data-protection controls.",
    ],
    blockedClaims: [
      "environmental determination",
      "clearance",
      "permit",
      "lender commitment",
      "guarantee of results",
    ],
    humanReviewRequired: true,
    advisoryOnly: true,
    determinationIssued: false,
    productionBlocked: true,
  };
}
