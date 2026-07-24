import { createHash } from "node:crypto";

export const ONBOARDING_INTELLIGENCE_HANDOFF_VERSION =
  "onboarding-intelligence-handoff-v0.1.0";

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

export function onboardingIntelligenceCaseHandoff(slug: string, label: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  const posture = CATEGORY_POSTURES[normalizedSlug] ?? CATEGORY_POSTURES["not-sure"];
  const structuredSeed = JSON.stringify({
    entryMode: "ANONYMOUS_ONBOARDING",
    category: normalizedSlug,
    customerTypes: posture.customerTypes,
    intendedUses: posture.intendedUses,
  });
  const caseId = `onboarding-${createHash("sha256").update(structuredSeed).digest("hex").slice(0, 20)}`;
  const params = new URLSearchParams({
    name: `${label} intelligence case`,
    goal: `Evaluate ${label.toLowerCase()} possibilities, evidence, constraints, and next steps.`,
    customerTypes: posture.customerTypes.join(","),
    intendedUses: posture.intendedUses.join(","),
    origin: "onboarding",
  });
  return {
    caseId,
    href: `/intelligence/cases/${caseId}?${params.toString()}`,
    source: "ONBOARDING_STRUCTURED_HANDOFF" as const,
    transcriptTransferred: false as const,
    identityTransferred: false as const,
    addressTransferred: false as const,
    accountCreated: false as const,
  };
}
