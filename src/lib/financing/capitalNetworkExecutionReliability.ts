/**
 * Evidence-backed provider execution reliability.
 *
 * No interest rate, provider compensation, affiliation, borrower credit score,
 * income, DTI, personal liquidity, or net worth appears in this model.
 * New providers are not penalized for having no Furlong history: public metrics
 * require 5 verified outcomes and ranking tie-break use requires 10.
 */

export const CAPITAL_NETWORK_RELIABILITY_VERSION = "capital-network-execution-reliability-v1.0.0";
export const RELIABILITY_PUBLIC_MIN_SAMPLE = 5;
export const RELIABILITY_RANKING_MIN_SAMPLE = 10;

export type CapitalExecutionOutcome =
  | "CLOSED_FUNDED"
  | "PROVIDER_DECLINED"
  | "PROVIDER_WITHDREW"
  | "PROVIDER_NO_RESPONSE"
  | "BORROWER_WITHDREW"
  | "PROPERTY_OR_PROGRAM_BLOCKED"
  | "THIRD_PARTY_OR_EXTERNAL_BLOCKED"
  | "CANCELED";

export type ReliabilityRecord = {
  providerId: string;
  outcome: CapitalExecutionOutcome;
  verificationStatus: string;
  selectedAt?: Date | null;
  consentedAt?: Date | null;
  providerFirstResponseAt?: Date | null;
  providerDispositionAt?: Date | null;
  closedFundedAt?: Date | null;
};

export type ProviderExecutionReliability = {
  version: typeof CAPITAL_NETWORK_RELIABILITY_VERSION;
  providerId: string;
  verifiedOutcomeCount: number;
  providerDecisionOutcomeCount: number;
  closedFundedCount: number;
  providerDeclinedCount: number;
  providerFailureCount: number;
  borrowerOrExternalExitCount: number;
  closeRatePct: number | null;
  completedDispositionRatePct: number | null;
  medianFirstResponseDays: number | null;
  medianConsentToCloseDays: number | null;
  publicDisplayEligible: boolean;
  rankingTieBreakEligible: boolean;
  customerLabel: string;
  methodology: string;
};

const DAY_MS = 86_400_000;

function daysBetween(start?: Date | null, end?: Date | null): number | null {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  return ms >= 0 ? ms / DAY_MS : null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return Math.round(value * 10) / 10;
}

function pct(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

export function summarizeProviderExecutionReliability(
  providerId: string,
  records: ReliabilityRecord[],
): ProviderExecutionReliability {
  const verified = records.filter(
    (record) => record.providerId === providerId && record.verificationStatus === "VERIFIED",
  );
  const closed = verified.filter((record) => record.outcome === "CLOSED_FUNDED");
  const declined = verified.filter((record) => record.outcome === "PROVIDER_DECLINED");
  const providerFailures = verified.filter((record) =>
    record.outcome === "PROVIDER_WITHDREW" || record.outcome === "PROVIDER_NO_RESPONSE",
  );
  const providerDecision = [...closed, ...declined, ...providerFailures];
  const completedDisposition = [...closed, ...declined];
  const externalOrBorrower = verified.filter((record) =>
    record.outcome === "BORROWER_WITHDREW" ||
    record.outcome === "PROPERTY_OR_PROGRAM_BLOCKED" ||
    record.outcome === "THIRD_PARTY_OR_EXTERNAL_BLOCKED" ||
    record.outcome === "CANCELED",
  );
  const responseDays = verified
    .map((record) => daysBetween(record.consentedAt ?? record.selectedAt, record.providerFirstResponseAt))
    .filter((value): value is number => value != null);
  const closeDays = closed
    .map((record) => daysBetween(record.consentedAt ?? record.selectedAt, record.closedFundedAt))
    .filter((value): value is number => value != null);
  const publicDisplayEligible = verified.length >= RELIABILITY_PUBLIC_MIN_SAMPLE;
  const rankingTieBreakEligible = providerDecision.length >= RELIABILITY_RANKING_MIN_SAMPLE;

  return {
    version: CAPITAL_NETWORK_RELIABILITY_VERSION,
    providerId,
    verifiedOutcomeCount: verified.length,
    providerDecisionOutcomeCount: providerDecision.length,
    closedFundedCount: closed.length,
    providerDeclinedCount: declined.length,
    providerFailureCount: providerFailures.length,
    borrowerOrExternalExitCount: externalOrBorrower.length,
    closeRatePct: pct(closed.length, providerDecision.length),
    completedDispositionRatePct: pct(completedDisposition.length, providerDecision.length),
    medianFirstResponseDays: median(responseDays),
    medianConsentToCloseDays: median(closeDays),
    publicDisplayEligible,
    rankingTieBreakEligible,
    customerLabel: publicDisplayEligible
      ? `${closed.length} closed/funded across ${verified.length} verified Furlong outcomes`
      : `Not enough verified Furlong history yet (${verified.length}/${RELIABILITY_PUBLIC_MIN_SAMPLE})`,
    methodology:
      "Verified Furlong case outcomes only. Borrower withdrawals and external/property/program blocks are shown separately and are excluded from provider close-rate denominator. Provider performance never incorporates interest rate, compensation, affiliation, or borrower personal-financial data. New providers are neutral until minimum sample thresholds are met.",
  };
}

/**
 * Use execution history only as a transparent tie-break between otherwise equal
 * suitability scores, and only after BOTH providers have enough verified
 * provider-decision outcomes. No-history/new providers are therefore not
 * demoted merely for being new to Furlong.
 */
export function executionReliabilityTieBreak(
  left: ProviderExecutionReliability,
  right: ProviderExecutionReliability,
): number {
  if (!left.rankingTieBreakEligible || !right.rankingTieBreakEligible) return 0;
  const leftClose = left.closeRatePct ?? -1;
  const rightClose = right.closeRatePct ?? -1;
  if (leftClose !== rightClose) return rightClose - leftClose;
  const leftResponse = left.medianFirstResponseDays ?? Number.POSITIVE_INFINITY;
  const rightResponse = right.medianFirstResponseDays ?? Number.POSITIVE_INFINITY;
  if (leftResponse !== rightResponse) return leftResponse - rightResponse;
  return 0;
}
