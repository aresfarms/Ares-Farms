/** Synthetic rejection evidence. Never a real property or launch acceptance. */
import { CANDIDATE_EXCLUSION_VERSION, type CandidateExclusionEvidence } from "@/lib/intelligence/candidateExclusionEvidence";
import { basePackage } from "./economicEvidence";

export function exclusionFixture(
  candidateRole: CandidateExclusionEvidence["candidateRole"],
  propertyId = basePackage.propertyId,
  address = basePackage.address,
): CandidateExclusionEvidence {
  return {
    version: CANDIDATE_EXCLUSION_VERSION,
    exclusionId: `synthetic-exclusion:${candidateRole}`,
    propertyId, address, generatedAt: basePackage.generatedAt,
    classification: "CONFIDENTIAL", traceId: "synthetic-exclusion-trace", replayRef: `synthetic-exclusion-replay:${candidateRole}`,
    candidateRole, screeningScope: `Synthetic ${candidateRole} scope`,
    summary: "The reviewed synthetic uses are prohibited by the documented site restriction.",
    propertyIdentity: { summary: "Synthetic matched parcel", sourceRefs: [basePackage.sources[0].id] },
    consideredUses: [{ title: `Excluded synthetic ${candidateRole}`,
      enterpriseComponents: candidateRole === "best-mixed-use" ? ["Use A", "Use B"] : ["Use A"],
      blockingDomain: "legal-use", status: "blocked", summary: "Synthetic prohibition; not missing evidence.",
      sourceRefs: [basePackage.sources[0].id], confidenceScore: 90 }],
    sources: structuredClone(basePackage.sources),
    review: { status: "reviewed", reviewerRole: "synthetic authorized reviewer", reviewedAt: basePackage.generatedAt,
      allMaterialAlternativesReviewed: true, note: "Synthetic fixture reviewed scope only." },
  };
}
