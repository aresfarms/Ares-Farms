import { SOURCE_STACK_REGISTRY } from "@/lib/source-stack/sourceStackRuntime";
import { sandboxUrl } from "@/security/realityPlatform/urlIngestionSandbox";

export type SourceCandidateStatus =
  | "allowlisted-marketplace-source-detected"
  | "allowlisted-address-only"
  | "generic-quarantined";

export type SourceCandidateGovernanceStatus =
  | "live-fetch-blocked-by-governance"
  | "not-in-governed-source-stack"
  | null;

export type SourceCandidateMatchStatus =
  | "approved-source-match-established"
  | "approved-source-match-not-yet-established"
  | null;

export type SourceCandidateAssessment = {
  candidateLabel: string | null;
  candidateSourceId: string | null;
  candidateStatus: SourceCandidateStatus | null;
  governanceStatus: SourceCandidateGovernanceStatus;
  matchStatus: SourceCandidateMatchStatus;
  liveFetchAllowed: boolean | null;
  statusLines: string[];
};

function candidateLabelFor(sourceCategory: string): string {
  if (sourceCategory === "generic-url") return "Outside listing URL";
  if (sourceCategory === "land.com") return "Land.com";
  return sourceCategory.toUpperCase();
}

export function assessSourceCandidate(input: {
  rawInput?: string | null;
  listingUrl?: string | null;
  matchedApprovedSourceRecord?: boolean;
}): SourceCandidateAssessment {
  const probe = input.rawInput?.trim() || input.listingUrl?.trim() || "";

  if (!probe) {
    return {
      candidateLabel: null,
      candidateSourceId: null,
      candidateStatus: null,
      governanceStatus: null,
      matchStatus: null,
      liveFetchAllowed: null,
      statusLines: [],
    };
  }

  const verdict = sandboxUrl(probe);
  const sourceCategory = verdict.sourceCategory;

  if (!sourceCategory) {
    return {
      candidateLabel: null,
      candidateSourceId: null,
      candidateStatus: null,
      governanceStatus: null,
      matchStatus: null,
      liveFetchAllowed: null,
      statusLines: [],
    };
  }

  const sourceId = sourceCategory === "generic-url" ? null : sourceCategory;
  const registryMatch = sourceId
    ? SOURCE_STACK_REGISTRY.find((entry) => entry.sourceId === sourceId)
    : null;
  const matchedApprovedSourceRecord = input.matchedApprovedSourceRecord === true;

  const candidateStatus: SourceCandidateStatus =
    registryMatch && !matchedApprovedSourceRecord
      ? "allowlisted-marketplace-source-detected"
      : verdict.verdict === "RESOLVED"
        ? "allowlisted-address-only"
        : "generic-quarantined";

  const governanceStatus: SourceCandidateGovernanceStatus = registryMatch
    ? registryMatch.liveFetchAllowed
      ? null
      : "live-fetch-blocked-by-governance"
    : sourceId
      ? "not-in-governed-source-stack"
      : null;

  const matchStatus: SourceCandidateMatchStatus = registryMatch
    ? matchedApprovedSourceRecord
      ? "approved-source-match-established"
      : "approved-source-match-not-yet-established"
    : null;

  const statusLines: string[] = [];

  if (candidateStatus === "allowlisted-marketplace-source-detected") {
    statusLines.push("Allowlisted marketplace source detected.");
  } else if (candidateStatus === "allowlisted-address-only") {
    statusLines.push("Allowlisted source candidate detected for address extraction only.");
  } else {
    statusLines.push("Outside listing URL quarantined to address extraction only.");
  }

  if (governanceStatus === "live-fetch-blocked-by-governance") {
    statusLines.push("Live fetch still blocked by governance.");
  } else if (governanceStatus === "not-in-governed-source-stack") {
    statusLines.push("This source is not yet in Furlong's governed source stack.");
  }

  if (matchStatus === "approved-source-match-established") {
    statusLines.push("Approved source match established.");
  } else if (matchStatus === "approved-source-match-not-yet-established") {
    statusLines.push("Approved source match not yet established.");
  }

  return {
    candidateLabel: candidateLabelFor(sourceCategory),
    candidateSourceId: sourceId,
    candidateStatus,
    governanceStatus,
    matchStatus,
    liveFetchAllowed: registryMatch?.liveFetchAllowed ?? null,
    statusLines,
  };
}
