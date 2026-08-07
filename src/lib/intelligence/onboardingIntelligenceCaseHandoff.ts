import { createHash } from "node:crypto";

export const ONBOARDING_INTELLIGENCE_HANDOFF_VERSION =
  "onboarding-intelligence-handoff-v0.2.0";

type CaseContext = {
  caseId: string;
  displayName?: string | null;
  goal?: string | null;
  state?: string | null;
  customerTypes?: string[];
  intendedUses?: string[];
};

const CATEGORY_POSTURES: Record<string, { customerTypes: string[]; intendedUses: string[] }> = {
  "property-land": { customerTypes: ["property participant"], intendedUses: ["property acquisition", "land evaluation"] },
  "farms-agriculture": { customerTypes: ["farmer", "rural small business"], intendedUses: ["agricultural operations", "farm capital"] },
  "small-business": { customerTypes: ["small business"], intendedUses: ["business growth", "capital readiness"] },
  "housing-development": { customerTypes: ["housing participant", "developer"], intendedUses: ["housing development", "infrastructure planning"] },
  "environmental-compliance": { customerTypes: ["property participant"], intendedUses: ["environmental review", "compliance planning"] },
  "financing-capital": { customerTypes: ["capital seeker"], intendedUses: ["financing pathways", "capital structure"] },
  "programs-incentives": { customerTypes: ["program applicant"], intendedUses: ["grants", "incentives", "program stacking"] },
  "not-sure": { customerTypes: ["prospective property participant"], intendedUses: ["tax planning", "accounting", "regulatory review"] },
};

function mergeUnique(left: string[] = [], right: string[] = []): string[] {
  return [...new Set([...left, ...right].map((value) => value.trim()).filter(Boolean))];
}

export function onboardingIntelligenceCaseHandoff(
  slug: string,
  label: string,
  existingCase?: CaseContext | null
) {
  const normalizedSlug = slug.trim().toLowerCase();
  const posture = CATEGORY_POSTURES[normalizedSlug] ?? CATEGORY_POSTURES["not-sure"];
  const structuredSeed = JSON.stringify({
    entryMode: "ANONYMOUS_ONBOARDING",
    category: normalizedSlug,
    customerTypes: posture.customerTypes,
    intendedUses: posture.intendedUses,
  });
  const generatedCaseId = `onboarding-${createHash("sha256").update(structuredSeed).digest("hex").slice(0, 20)}`;
  const caseId = existingCase?.caseId.trim() || generatedCaseId;
  const customerTypes = mergeUnique(existingCase?.customerTypes, posture.customerTypes);
  const intendedUses = mergeUnique(existingCase?.intendedUses, posture.intendedUses);
  const params = new URLSearchParams({
    name: existingCase?.displayName?.trim() || `${label} intelligence case`,
    goal: existingCase?.goal?.trim() || `Evaluate ${label.toLowerCase()} possibilities, evidence, constraints, and next steps.`,
    customerTypes: customerTypes.join(","),
    intendedUses: intendedUses.join(","),
    origin: existingCase ? "onboarding-enrichment" : "onboarding",
  });
  if (existingCase?.state?.trim()) params.set("state", existingCase.state.trim());
  return {
    caseId,
    href: `/intelligence/cases/${caseId}?${params.toString()}`,
    source: existingCase ? "ONBOARDING_CASE_ENRICHMENT" as const : "ONBOARDING_STRUCTURED_HANDOFF" as const,
    enrichmentMode: Boolean(existingCase),
    transcriptTransferred: false as const,
    identityTransferred: false as const,
    addressTransferred: false as const,
    accountCreated: false as const,
  };
}
