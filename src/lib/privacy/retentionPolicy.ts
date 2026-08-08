export const DATA_RETENTION_POLICY_VERSION = "data-retention-v1-2026-08-08";
export const DATA_RETENTION_REVIEW_CADENCE = "ANNUAL_AND_ON_MATERIAL_CHANGE" as const;
export const DATA_RETENTION_LAST_REVIEWED = "2026-08-08";
export const DATA_RETENTION_NEXT_SCHEDULED_REVIEW = "2027-08-08";

export type RetentionDisposition = "PURGE" | "RETAIN_LEGAL_HOLD" | "RETAIN_ACTIVE_PURPOSE";

export function plaidRetentionDisposition(input: {
  activeFinancingPurpose: boolean;
  userPermissionActive: boolean;
  legalHold: boolean;
}): RetentionDisposition {
  if (input.legalHold) return "RETAIN_LEGAL_HOLD";
  if (input.activeFinancingPurpose && input.userPermissionActive) return "RETAIN_ACTIVE_PURPOSE";
  return "PURGE";
}

export const PLAID_RETENTION_RULES = {
  accessToken: "Revoke and cryptographically purge when account access is disconnected, permission is withdrawn, or the financing purpose no longer requires the connection.",
  consumerData: "Purge after the active financing purpose ends unless a documented legal, regulatory, dispute, fraud, or audit hold requires retention.",
  auditEvidence: "Retain only non-secret, minimum-necessary evidence of consent, access, deletion, and governance actions; never retain Plaid access tokens in the audit ledger.",
  review: "Review at least annually and on material product, provider, legal, or data-practice change.",
} as const;
