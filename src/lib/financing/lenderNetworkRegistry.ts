/**
 * Furlong lender-network candidate registry.
 *
 * Discovery records are NOT partnerships and cannot receive borrower data.
 * A candidate becomes routable only after due diligence, credential/authority
 * verification, written participation terms, recipient verification, and
 * activation under the lender-submission governance pipeline.
 */

export const LENDER_NETWORK_REGISTRY_VERSION = "lender-network-registry-v1.0.0";

export type LenderNetworkStatus =
  | "DISCOVERY_CANDIDATE"
  | "OUTREACH_PENDING"
  | "DUE_DILIGENCE"
  | "CERTIFIED_PARTNER"
  | "SUSPENDED"
  | "RETIRED";

export type LenderNetworkKind =
  | "FARM_CREDIT"
  | "SBA_CDC_504"
  | "BANK"
  | "CREDIT_UNION"
  | "NONBANK_COMMERCIAL_LENDER"
  | "FSA_GUARANTEED_LENDER"
  | "USDA_ONERD_LENDER";

export type LenderProgram =
  | "sba_7a"
  | "sba_504"
  | "usda_bi"
  | "fsa"
  | "ag_conventional"
  | "commercial_conventional";

export interface LenderNetworkCandidate {
  id: string;
  name: string;
  kind: LenderNetworkKind;
  programs: LenderProgram[];
  states: string[];
  status: LenderNetworkStatus;
  officialSource: string;
  verifiedOn: string;
  notes: string[];
}

export const LENDER_NETWORK_CANDIDATES: LenderNetworkCandidate[] = [
  {
    id: "horizon-farm-credit",
    name: "Horizon Farm Credit",
    kind: "FARM_CREDIT",
    programs: ["fsa", "ag_conventional"],
    states: ["DE", "MD", "PA", "VA", "WV"],
    status: "OUTREACH_PENDING",
    officialSource: "https://www.horizonfc.com/locations/delaware",
    verifiedOn: "2026-09-04",
    notes: [
      "Farm Credit System agricultural lender serving Delaware and Maryland.",
      "Public materials describe collaboration with FSA loan programs; exact guaranteed-loan participation must be verified during onboarding.",
    ],
  },
  {
    id: "delaware-community-development-corporation",
    name: "Delaware Community Development Corporation",
    kind: "SBA_CDC_504",
    programs: ["sba_504"],
    states: ["DE"],
    status: "OUTREACH_PENDING",
    officialSource: "https://www.sba.gov/loans/504-loans/list-of-certified-development-companies/",
    verifiedOn: "2026-09-04",
    notes: ["Listed by SBA as a Certified Development Company serving Delaware."],
  },
  {
    id: "true-access-capital",
    name: "True Access Capital Corporation",
    kind: "SBA_CDC_504",
    programs: ["sba_504"],
    states: ["DE"],
    status: "OUTREACH_PENDING",
    officialSource: "https://www.sba.gov/loans/504-loans/list-of-certified-development-companies/",
    verifiedOn: "2026-09-04",
    notes: [
      "Listed by SBA as a Certified Development Company serving Delaware.",
      "Also appears on SBA's authorized Microloan intermediary list; that is a separate program role and is not inferred here as a 7(a) lender authority.",
    ],
  },
  {
    id: "504-capital-corporation",
    name: "504 Capital Corporation",
    kind: "SBA_CDC_504",
    programs: ["sba_504"],
    states: ["MD", "NC", "VA"],
    status: "OUTREACH_PENDING",
    officialSource: "https://www.sba.gov/loans/504-loans/list-of-certified-development-companies/",
    verifiedOn: "2026-09-04",
    notes: ["Listed by SBA as a Certified Development Company serving Maryland."],
  },
];

export function candidateById(id: string): LenderNetworkCandidate | null {
  return LENDER_NETWORK_CANDIDATES.find((candidate) => candidate.id === id) ?? null;
}

export function candidatesFor(
  state: string,
  program: LenderProgram,
): LenderNetworkCandidate[] {
  const normalizedState = state.trim().toUpperCase();
  return LENDER_NETWORK_CANDIDATES.filter(
    (candidate) =>
      candidate.states.includes(normalizedState) &&
      candidate.programs.includes(program),
  );
}

export function routableLenderPartners(): LenderNetworkCandidate[] {
  return LENDER_NETWORK_CANDIDATES.filter(
    (candidate) => candidate.status === "CERTIFIED_PARTNER",
  );
}

export function lenderNetworkActivationBlockers(
  candidate: LenderNetworkCandidate,
): string[] {
  if (candidate.status === "CERTIFIED_PARTNER") return [];
  return [
    "Written lender/provider participation terms not certified.",
    "Professional/institutional authority and recipient identity not certified for live case delivery.",
    "Lender-submission live adapter remains production-blocked until separate promotion evidence is complete.",
  ];
}
