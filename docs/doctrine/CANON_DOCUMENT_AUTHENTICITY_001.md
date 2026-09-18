# CANON-DOCUMENT-AUTHENTICITY-001 — Governed Financial Document Authenticity

Status: implemented as fail-closed foundation; live Plaid network access is not enabled by this build.

No customer-supplied financial artifact may enter an external lender or government package merely because it was uploaded. The exact received bytes are preserved and hashed before verification. Verification evidence is append-only and binds the artifact hash, verified customer identity reference, source type, independent source/corroboration evidence, forensic signals, material discrepancies, review evidence, result class, and verification time.

The only automatic external-package admission classes are `DIRECT_SOURCE_VERIFIED` and `CORROBORATED`. `FORENSICALLY_CONSISTENT` is not a statement of issuer authenticity and requires further corroboration or governed human/institution verification before external transmission. `REVIEW_REQUIRED`, `MATERIAL_DISCREPANCY`, and `REJECTED_FROM_PACKAGE` are fail-closed.

Direct institution retrieval and customer-upload verification are separate provenance lanes. A certified connector result may establish direct-source provenance and account ownership. A customer-uploaded artifact must be independently corroborated before it can be represented to an external recipient as corroborated. Visual/structural forensics alone never prove issuer authenticity.

Furlong must preserve what was actually received, every verification result, every discrepancy, every later version, the exact artifact ultimately admitted to a package, and the external delivery evidence. No suspicious document is silently repaired or replaced in place.
