import {
  DOCUMENT_EVIDENCE_RECONCILIATION_DISCLOSURES,
  DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS,
  DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
  DOCUMENT_EVIDENCE_RECONCILIATION_SIGNAL_IDS,
  DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS,
  composeDocumentEvidenceReconciliation,
  documentEvidenceReconciliationLineage,
} from "@/lib/evidence/documentEvidenceReconciliationRuntime";

export type {
  DocumentEvidenceReconciliationInput,
  DocumentEvidenceReconciliationResult,
  DocumentReconciliationCrossSourceConflict,
  DocumentReconciliationFinding,
  DocumentReconciliationSignal,
} from "@/lib/evidence/documentEvidenceReconciliationRuntime";

/** Stable public boundary for the canonical Evidence domain. */
export const canonicalEvidenceAuthority = Object.freeze({
  compose: composeDocumentEvidenceReconciliation,
  lineage: documentEvidenceReconciliationLineage,
  runtimeVersion: DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
  disclosures: DOCUMENT_EVIDENCE_RECONCILIATION_DISCLOSURES,
  productionRestrictions: DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS,
  signalIds: DOCUMENT_EVIDENCE_RECONCILIATION_SIGNAL_IDS,
  bannedAccusatoryTokens: DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS,
});

export {
  DOCUMENT_EVIDENCE_RECONCILIATION_DISCLOSURES,
  DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS,
  DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
  DOCUMENT_EVIDENCE_RECONCILIATION_SIGNAL_IDS,
  DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS,
  composeDocumentEvidenceReconciliation,
  documentEvidenceReconciliationLineage,
};
