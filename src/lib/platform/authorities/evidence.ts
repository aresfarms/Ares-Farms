import {
  composeDocumentEvidenceReconciliation,
  documentEvidenceReconciliationLineage,
} from "@/lib/evidence/documentEvidenceReconciliationRuntime";

/** Stable public boundary for the canonical Evidence domain. */
export const canonicalEvidenceAuthority = Object.freeze({
  compose: composeDocumentEvidenceReconciliation,
  lineage: documentEvidenceReconciliationLineage,
});
