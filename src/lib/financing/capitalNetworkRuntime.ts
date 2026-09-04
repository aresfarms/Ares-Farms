/**
 * Capital Network pure matching runtime.
 *
 * This is an advisory fit engine, never underwriting. It uses only declared
 * provider appetite + coarse deal facts. Affiliation never increases score;
 * equal fits are deterministically ordered by organization name/provider id.
 */
export const CAPITAL_NETWORK_RUNTIME_VERSION = "capital-network-runtime-v1.0.0";

export type CapitalProviderRole = "BROKER" | "LENDER";
export type CapitalProviderStatus =
  | "APPLICANT"
  | "DUE_DILIGENCE"
  | "TRANSITION_ACTIVE"
  | "CERTIFIED_ACTIVE"
  | "SUSPENDED"
  | "RETIRED";

export interface CapitalProviderProfile {
  providerId: string;
  organizationName: string;
  providerRole: CapitalProviderRole;
  providerType: string;
  status: CapitalProviderStatus;
  affiliation: "INDEPENDENT" | "FURLONG_AFFILIATE";
  states: string[];
  programs: string[];
  purposes: string[];
  propertyTypes: string[];
  industries: string[];
  borrowerTypes: string[];
  minDealAmount: number | null;
  maxDealAmount: number | null;
  matchingEnabled: boolean;
  explicitAssignmentAllowed: boolean;
  liveRoutingAllowed: boolean;
  profileVersion: number;
}

export interface CapitalDealMatchInput {
  serviceRequestId: string;
  state: string | null;
  program: string | null;
  purpose: string | null;
  estimatedAmount: number | null;
  propertyType?: string | null;
  industry?: string | null;
  borrowerType?: string | null;
}

export interface CapitalProviderMatch {
  providerId: string;
  providerProfileVersion: number;
  score: number;
  eligible: boolean;
  reasons: string[];
  blockers: string[];
}

function has(values: string[], value: string | null | undefined): boolean {
  if (!value) return false;
  const target = value.trim().toLowerCase();
  return values.some((item) => item.trim().toLowerCase() === target || item.trim() === "*");
}

function optionalFit(values: string[], value: string | null | undefined): boolean {
  return values.length === 0 || !value || has(values, value);
}

function programFit(values: string[], value: string | null | undefined): boolean {
  if (!value) return false;
  if (has(values, value)) return true;
  if (value.trim().toLowerCase() === "conventional") {
    return (
      has(values, "commercial_conventional") ||
      has(values, "ag_conventional")
    );
  }
  return false;
}

export function matchCapitalProvider(
  deal: CapitalDealMatchInput,
  provider: CapitalProviderProfile,
): CapitalProviderMatch {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  if (provider.status !== "CERTIFIED_ACTIVE" || !provider.matchingEnabled) {
    blockers.push("Provider is not active for automatic matching.");
  }
  if (!deal.state || !has(provider.states, deal.state)) {
    blockers.push("Declared geography does not cover this deal.");
  } else {
    score += 35;
    reasons.push(`Serves ${deal.state.toUpperCase()}.`);
  }
  if (!deal.program || !programFit(provider.programs, deal.program)) {
    blockers.push("Declared program appetite does not cover this pathway.");
  } else {
    score += 35;
    reasons.push(`Declares ${deal.program} program appetite.`);
  }
  if (
    deal.estimatedAmount != null &&
    provider.minDealAmount != null &&
    deal.estimatedAmount < provider.minDealAmount
  ) blockers.push("Deal amount is below the provider's declared minimum.");
  if (
    deal.estimatedAmount != null &&
    provider.maxDealAmount != null &&
    deal.estimatedAmount > provider.maxDealAmount
  ) blockers.push("Deal amount exceeds the provider's declared maximum.");
  if (deal.estimatedAmount != null && !blockers.some((b) => b.includes("amount"))) {
    score += 10;
    reasons.push("Deal size is inside the declared range.");
  }
  if (optionalFit(provider.purposes, deal.purpose)) {
    score += 8;
    if (deal.purpose) reasons.push(`Purpose fit: ${deal.purpose}.`);
  } else blockers.push("Purpose is outside declared appetite.");
  if (optionalFit(provider.propertyTypes, deal.propertyType)) score += deal.propertyType ? 4 : 0;
  else blockers.push("Property type is outside declared appetite.");
  if (optionalFit(provider.industries, deal.industry)) score += deal.industry ? 4 : 0;
  else blockers.push("Industry is outside declared appetite.");
  if (optionalFit(provider.borrowerTypes, deal.borrowerType)) score += deal.borrowerType ? 4 : 0;
  else blockers.push("Borrower type is outside declared appetite.");

  return {
    providerId: provider.providerId,
    providerProfileVersion: provider.profileVersion,
    score: Math.max(0, Math.min(100, score)),
    eligible: blockers.length === 0,
    reasons,
    blockers,
  };
}

export function matchCapitalProviders(
  deal: CapitalDealMatchInput,
  providers: CapitalProviderProfile[],
): CapitalProviderMatch[] {
  const byId = new Map(providers.map((provider) => [provider.providerId, provider] as const));
  return providers
    .map((provider) => matchCapitalProvider(deal, provider))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      if (a.score !== b.score) return b.score - a.score;
      const ap = byId.get(a.providerId)!;
      const bp = byId.get(b.providerId)!;
      const nameOrder = ap.organizationName.localeCompare(bp.organizationName);
      return nameOrder || a.providerId.localeCompare(b.providerId);
    });
}
