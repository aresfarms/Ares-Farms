# Staging Release Attestation — 2026-08-10 (third release of the day)

Source commit `1166ed4`. Manifest `2026-08-10T20-31-59-583Z-1166ed4`.
Terraform apply: 1 added, 5 changed, 1 destroyed. All 14 P2.4/P3 gates pass.

## Approved runtime evidence

| Runtime | Immutable digest | HIGH | CRITICAL | Other findings | On-demand scan |
| --- | --- | ---: | ---: | --- | --- |
| Core/webhook | `sha256:062d58873ae2ca84d87787e6a5a2deed1ebb8cb513d1a07879c1209563a202c4` | 0 | 0 | 5 LOW, 7 MINIMAL | `6308e1f1-c5a3-44ae-a9c8-19a0db8610e7` |
| DB migrator/verifier/refresh | `sha256:ef082ef9d828f0517b104dc59855c6f607c436b6799388720dc21b2d0d293a03` | 0 | 0 | 5 LOW, 7 MINIMAL | `a507c623-2871-4674-af92-774d98115122` |
| Scanner | `sha256:90e7a8083cb62fdfa1b115c2150fc2ea4f9f8c7320bfc5c1096fac3429afd49f` | 0 | 0 | 2 MEDIUM, 24 LOW, 19 MINIMAL | `69d55124-f7b3-4050-b9e6-6c436980cac0` |

Attested by `furlong-release-approval`, KMS key version 1 of
`furlong-release-attestor`, signed by `user:chudson@aresfarmsinc.com`.

## Schema

Canonical target schema advanced to **0054**
(`0054_identity_verifications.sql`). Applied by execution
`furlong-db-migrate-qcx45`.

## PROCESS DEFECT FOUND AND CORRECTED IN THIS RELEASE

**Applying Terraform does not run the migrator.** `terraform apply` updates the
Cloud Run JOB DEFINITION with the new image; it does not create an execution.
After this apply, the newest migrator execution was still `furlong-db-migrate-
7p8xw` from 12:50Z — hours earlier, and from the previous release.

**The gate would have passed anyway.** `deploy:verify-manifest` asserts
"furlong-db-migrate latest execution SUCCEEDED". A stale successful execution
satisfies that check, so a release carrying a NEW migration would have been
recorded as fully gated while its schema change had never been applied. The
application would then run against a database missing the table — here,
`identity_verifications`, whose absence would have failed every financial
upload closed.

Corrected for this release by executing `furlong-db-migrate` explicitly before
the gates; the gate then observed `furlong-db-migrate-qcx45`.

**Recommended hardening (not yet implemented):** the gate should assert that
the latest migrator execution both SUCCEEDED and STARTED AFTER the current
revision was created, and that the reported schema version equals
`canonicalTargetSchemaVersion()`. As written, the check proves a migration ran
successfully at some point in the past — not that THIS release's migration ran.

## Not closed by this record

Everything listed under "Deliberately open release gates" in
`STAGING_SECURITY_CLOSURE_2026-08-10.md` remains open, including real Apple Pay
and Google Pay physical-device journeys.

Also open: G-2 in the change register — bank connection remains reachable by
the broker and not the borrower. The customer door was written and reverted
rather than shipped onto Plaid routes that still require a session.
