# TECH-DOCUMENT-AUTHENTICITY-001

`src/lib/document-authenticity` defines the provider-neutral evidence contract, result taxonomy, deterministic evidence hashing, direct-source Plaid boundary model, and fail-closed external-package eligibility rule. No Plaid credential or network call exists in this build.

Migration `0047_document_authenticity_governance.sql` adds append-only authenticity evidence and package-item evidence bindings. Lender package construction now requires an authenticity evidence reference and either `DIRECT_SOURCE_VERIFIED` or `CORROBORATED` for every item.

Lender dispatch adds `document_authenticity` and `lender_evidence_packet` gates. `src/lib/lender-submission/provenance.ts` creates a deterministic lender-facing JSON provenance certificate bound to the exact package manifest, customer identity evidence, consent, per-file SHA-256 values, and authenticity evidence references.
