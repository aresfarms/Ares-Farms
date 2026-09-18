/**
 * Managed multi-provider handoff.
 *
 * Master Volume traceability: Vol II REG-LICENSE-001 / REG-ECOA-001;
 * Vol III TECH-RULES-001 / TECH-LEDGER-001; Vol V CANON-CONSENT-001.
 * Every provider receives a separate case room and exact-recipient consent.
 */
export const MANAGED_PROVIDER_HANDOFF_VERSION = "managed-provider-handoff-v1.0.0";
export const MAX_COMPARISON_PROVIDERS = 4;

export const MANAGED_HANDOFF_NON_NEGOTIABLES = Object.freeze({
  sellsBorrowerLeads: false,
  auctionsBorrowerFiles: false,
  providerPaysForRank: false,
  automaticBroadcast: false,
  customerChoosesEveryRecipient: true,
  separateConsentPerProvider: true,
  separateRevocationPerProvider: true,
  providerMayUseExistingLoanSystem: true,
  providerMayRedistributePackage: false,
});

export type ProviderResponseStatus =
  | "ACCEPT_FOR_REVIEW"
  | "MISSING_INFORMATION"
  | "OUTSIDE_CREDIT_BOX"
  | "CONDITIONAL_PATH"
  | "DECLINE";
export const PROVIDER_RESPONSE_LABELS: Record<ProviderResponseStatus, string> = {
  ACCEPT_FOR_REVIEW: "Accept for review",
  MISSING_INFORMATION: "Missing information",
  OUTSIDE_CREDIT_BOX: "Outside credit box",
  CONDITIONAL_PATH: "Conditional path",
  DECLINE: "Decline",
};

export type ClosingMilestone =
  | "UNDERWRITING"
  | "CONDITIONS"
  | "APPRAISAL"
  | "ENVIRONMENTAL_REVIEW"
  | "TITLE"
  | "CLEAR_TO_CLOSE"
  | "CLOSING"
  | "KEYS_AND_LOGBOOK";

export const CLOSING_MILESTONES: readonly ClosingMilestone[] = [
  "UNDERWRITING",
  "CONDITIONS",
  "APPRAISAL",
  "ENVIRONMENTAL_REVIEW",
  "TITLE",
  "CLEAR_TO_CLOSE",
  "CLOSING",
  "KEYS_AND_LOGBOOK",
] as const;
export function validateProviderSelection(input: {
  selectedProviderIds: string[];
  eligibleProviderIds: string[];
}): string[] {
  const selected = [...new Set(input.selectedProviderIds.map((id) => id.trim()).filter(Boolean))];
  const eligible = new Set(input.eligibleProviderIds);
  const errors: string[] = [];
  if (selected.length === 0) errors.push("Select at least one verified provider.");
  if (selected.length > MAX_COMPARISON_PROVIDERS) {
    errors.push(`Select no more than ${MAX_COMPARISON_PROVIDERS} providers for one comparison round.`);
  }
  const ineligible = selected.filter((id) => !eligible.has(id));
  if (ineligible.length) errors.push("Every selected provider must remain inside its verified credit box.");
  return errors;
}

export function validateProviderResponse(input: {
  status: ProviderResponseStatus;
  missingItems?: string[];
  conditions?: string[];
  explanation?: string | null;
}): string[] {
  const errors: string[] = [];
  if (input.status === "MISSING_INFORMATION" && !(input.missingItems ?? []).length) {
    errors.push("Missing-information responses must identify at least one missing item.");
  }
  if (input.status === "CONDITIONAL_PATH" && !(input.conditions ?? []).length) {
    errors.push("Conditional-path responses must identify at least one condition.");
  }
  if (
    (input.status === "OUTSIDE_CREDIT_BOX" || input.status === "DECLINE") &&
    !input.explanation?.trim()
  ) {
    errors.push("Outside-credit-box and decline responses require a reason.");
  }
  return errors;
}

export function caseRoomExpiry(createdAt: Date, days = 30): Date {
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new Error("Case-room expiry must be between 1 and 90 days.");
  }
  return new Date(createdAt.getTime() + days * 86_400_000);
}

export function completedClosingPath(completed: ClosingMilestone[]): boolean {
  const set = new Set(completed);
  return CLOSING_MILESTONES.every((milestone) => set.has(milestone));
}
