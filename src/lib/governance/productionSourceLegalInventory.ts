import { SOURCE_STACK_REGISTRY } from "@/lib/platform/authorities/source";

export const productionSourceLegalInventoryVersion = "p5-b04-source-legal-inventory-v1";

export type SourceLegalApprovalRecord = {
  sourceId: string; sourceName: string; sourceCategory: string; sourceAuthorityTier: string; jurisdictionScope: string[];
  licenseBasis: string; termsReviewRequired: true; termsEvidenceRef: string | null;
  antiBulkRule: string; permittedUses: string[]; prohibitedUses: string[];
  retentionRule: string; cacheRule: string; republicationRule: string; publicDisplayRule: string;
  attributionRule: string; credentialRule: string; reviewCadence: string;
  qualifiedReviewerRole: "Source Legal Authority"; approvalGranted: false; approvedBy: null; approvedAtUtc: null; approvalEvidenceRef: null;
  liveFetchAllowed: false; productionRelianceAllowed: false; officialUseAllowed: false;
};

function licenseBasis(tier: string): string {
  if (tier.includes("government")) return "public-record or agency terms subject to source-specific review";
  if (tier.includes("institutional")) return "contract, subscription, API, or institutional license required";
  if (tier.includes("marketplace")) return "commercial marketplace terms and display license required";
  return "advisory/discovery source terms require qualified review";
}

export const productionSourceLegalInventory: SourceLegalApprovalRecord[] = SOURCE_STACK_REGISTRY.map((source) => ({
  sourceId: source.sourceId, sourceName: source.sourceName, sourceCategory: source.sourceCategory,
  sourceAuthorityTier: source.sourceAuthorityTier, jurisdictionScope: [...source.jurisdictionScope],
  licenseBasis: licenseBasis(source.sourceAuthorityTier), termsReviewRequired: true, termsEvidenceRef: null,
  antiBulkRule: "No bulk acquisition, automated harvesting, rate-limit bypass, or credential sharing without source-specific written approval.",
  permittedUses: ["internal discovery", "candidate evidence", "human-reviewed advisory analysis"],
  prohibitedUses: ["underwriting truth", "official eligibility decision", "collateral certification", "unreviewed republication", "public certainty claim"],
  retentionRule: "Retain only the minimum governed evidence necessary for provenance, replay, dispute, and audit obligations; source terms control shorter limits.",
  cacheRule: "No persistent cache beyond the approved source-specific period; purge or refresh on expiry, revocation, or terms change.",
  republicationRule: "No raw-content republication without express source-specific license and qualified legal approval.",
  publicDisplayRule: "Public DTO may expose only reviewed aliases, citations, and derived advisory facts after redaction and claims review.",
  attributionRule: "Preserve source name, retrieval time, URL/reference, license posture, provenance envelope, and replay reference.",
  credentialRule: "Credentials, subscriptions, and licensed sessions resolve only through the governed credential vault and may not be embedded in records or logs.",
  reviewCadence: "before activation; on terms/license change; on credential renewal; and at least annually",
  qualifiedReviewerRole: "Source Legal Authority", approvalGranted: false, approvedBy: null, approvedAtUtc: null, approvalEvidenceRef: null,
  liveFetchAllowed: false, productionRelianceAllowed: false, officialUseAllowed: false,
}));

export const productionSourceLegalAuthorization = {
  blockerId: "P5-B04", authorityRole: "Source Legal Authority", approvalRequired: true, approvalGranted: false,
  sourceApprovalsGranted: 0, liveSourceUsePermitted: false, productionReliancePermitted: false, republicationPermitted: false,
  reason: "Each source requires source-specific qualified legal/compliance approval; automation only assembles evidence and cannot grant legal authority.",
} as const;
