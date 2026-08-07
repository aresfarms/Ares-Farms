# OPS-DOCUMENT-AUTHENTICITY-001

1. Quarantine a newly received customer financial artifact and hash the exact bytes.
2. Bind the artifact to verified customer identity evidence before authenticity review.
3. If obtained through a certified direct institution connector, record institution/account provenance and ownership evidence.
4. If customer-uploaded, run structural/forensic checks and independently corroborate material financial facts through a certified source when available.
5. Treat material discrepancies or high-risk signals as fail-closed; preserve the original artifact and evidence unchanged.
6. Permit automatic external-package admission only for `DIRECT_SOURCE_VERIFIED` or `CORROBORATED`.
7. `FORENSICALLY_CONSISTENT` requires additional governed corroboration/review and must not be described as issuer-authenticated.
8. Generate the lender provenance certificate from canonical evidence before dispatch authorization.
9. Preserve the package manifest, certificate hash, authorization, dispatch event, and delivery truth for replay.
