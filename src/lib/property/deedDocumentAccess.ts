export type DeedDocumentRole = "consumer" | "borrower" | "lender" | "internal-reviewer";
export type DeedDocumentAction = "view" | "print" | "export";

export interface DeedDocumentAccessRequest {
  role: DeedDocumentRole;
  action: DeedDocumentAction;
  fileAuthorized: boolean;
  transactionPurposeRecorded: boolean;
  lenderAuthorized?: boolean;
}

export interface DeedDocumentAccessDecision {
  allowed: boolean;
  reason: string;
  ledgerEventRequired: boolean;
}

export function decideDeedDocumentAccess(input: DeedDocumentAccessRequest): DeedDocumentAccessDecision {
  if (input.role === "consumer") {
    return { allowed: false, reason: "The public consumer surface may show deed verification metadata but not the deed document.", ledgerEventRequired: false };
  }
  if (!input.fileAuthorized || !input.transactionPurposeRecorded) {
    return { allowed: false, reason: "A transaction file and legitimate document purpose must be recorded before deed access.", ledgerEventRequired: false };
  }
  if (input.role === "lender" && !input.lenderAuthorized) {
    return { allowed: false, reason: "The lender has not been authorized for this transaction file.", ledgerEventRequired: false };
  }
  return { allowed: true, reason: "Authorized transaction-file access. Every view, print, or export must be written to the evidence ledger.", ledgerEventRequired: true };
}
