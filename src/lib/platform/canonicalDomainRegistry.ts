/**
 * Canonical Domain Registry
 *
 * Declares the single authoritative module for each cross-platform domain
 * concept. Feature modules may project or adapt these entities, but they must
 * not establish competing authorities.
 */

export type CanonicalDomainKey =
  | "property"
  | "place"
  | "land_register"
  | "evidence"
  | "source"
  | "program"
  | "provider"
  | "report"
  | "opportunity";

export type CanonicalDomainDefinition = {
  key: CanonicalDomainKey;
  displayName: string;
  authorityModule: string;
  authorityExport: string;
  restrictedImplementationModules?: readonly string[];
  canonicalIdField: string;
  governanceTags: string[];
  projectionRule: string;
};

export const canonicalDomainRegistry: readonly CanonicalDomainDefinition[] = [
  {
    key: "property",
    displayName: "Property",
    authorityModule: "src/lib/platform/authorities/property.ts",
    authorityExport: "canonicalPropertyAuthority",
    canonicalIdField: "canonical_property_id",
    governanceTags: ["CANON-SOVEREIGNTY-001", "SOURCE-AUTH-001", "SOURCE-PROV-001"],
    projectionRule: "All property views must reference the canonical property identifier and preserve source lineage.",
  },
  {
    key: "place",
    displayName: "Place",
    authorityModule: "src/lib/platform/authorities/place.ts",
    authorityExport: "canonicalPlaceAuthority",
    restrictedImplementationModules: ["@/lib/place-facts/placeFactActivation"],
    canonicalIdField: "place_id",
    governanceTags: ["SOURCE-AUTH-001", "SOURCE-PROV-001", "PUBLIC-CLAIMS-001"],
    projectionRule: "Place summaries are governed projections of registered place facts, never independent factual authorities.",
  },
  {
    key: "land_register",
    displayName: "Land Register",
    authorityModule: "src/lib/platform/authorities/landRegister.ts",
    authorityExport: "canonicalLandRegisterAuthority",
    canonicalIdField: "land_register_id",
    governanceTags: ["TECH-LEDGER-001", "TECH-REPLAY-001", "SOURCE-PROV-001"],
    projectionRule: "Land Register outputs must remain replayable, append-oriented, and traceable to evidence and source records.",
  },
  {
    key: "evidence",
    displayName: "Evidence",
    authorityModule: "src/lib/platform/authorities/evidence.ts",
    authorityExport: "canonicalEvidenceAuthority",
    canonicalIdField: "evidence_id",
    governanceTags: ["SOURCE-PROV-001", "TECH-REPLAY-001", "CANON-CLASS-001"],
    projectionRule: "Evidence may be summarized but its classification, provenance, conflicts, and review state must be preserved.",
  },
  {
    key: "source",
    displayName: "Source",
    authorityModule: "src/lib/platform/authorities/source.ts",
    authorityExport: "canonicalSourceAuthority",
    canonicalIdField: "source_id",
    governanceTags: ["SOURCE-AUTH-001", "SOURCE-INGEST-001", "SOURCE-PROV-001"],
    projectionRule: "Every sourced claim must resolve to the governed source stack and its authority, freshness, and permitted-use posture.",
  },
  {
    key: "program",
    displayName: "Program",
    authorityModule: "src/lib/platform/authorities/program.ts",
    authorityExport: "canonicalProgramAuthority",
    canonicalIdField: "program_id",
    governanceTags: ["PROGRAM-GRAPH-001", "PUBLIC-CLAIMS-001", "TECH-REPLAY-001"],
    projectionRule: "Program matches remain advisory projections and may not imply eligibility, approval, reservation, or funding commitment.",
  },
  {
    key: "provider",
    displayName: "Provider",
    authorityModule: "src/lib/platform/authorities/provider.ts",
    authorityExport: "canonicalProviderAuthority",
    restrictedImplementationModules: ["@/lib/providers/providerRegistry"],
    canonicalIdField: "provider_id",
    governanceTags: ["CANON-SOVEREIGNTY-001", "PUBLIC-CLAIMS-001", "UX-GOV-001"],
    projectionRule: "Provider surfaces must remain neutral directory projections without endorsement, ranking, or guaranteed availability claims.",
  },
  {
    key: "report",
    displayName: "Report",
    authorityModule: "src/lib/platform/authorities/report.ts",
    authorityExport: "canonicalReportAuthority",
    canonicalIdField: "report_id",
    governanceTags: ["SOURCE-PROV-001", "TECH-REPLAY-001", "PUBLIC-CLAIMS-001"],
    projectionRule: "Reports must be deterministic, versioned, advisory, and reproducible from their recorded inputs and governance version.",
  },
  {
    key: "opportunity",
    displayName: "Opportunity",
    authorityModule: "src/lib/platform/authorities/opportunity.ts",
    authorityExport: "canonicalOpportunityAuthority",
    canonicalIdField: "opportunity_id",
    governanceTags: ["REVENUE-INTEL-001", "PUBLIC-CLAIMS-001", "TECH-REPLAY-001"],
    projectionRule: "Opportunity outputs are hypotheses for review, not promises of feasibility, revenue, eligibility, or financing.",
  },
] as const;

export function getCanonicalDomain(key: CanonicalDomainKey): CanonicalDomainDefinition {
  const definition = canonicalDomainRegistry.find((entry) => entry.key === key);
  if (!definition) throw new Error(`Unknown canonical domain: ${key}`);
  return definition;
}
