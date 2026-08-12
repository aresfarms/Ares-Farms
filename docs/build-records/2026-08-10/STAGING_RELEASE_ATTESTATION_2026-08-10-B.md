# Staging Release Attestation — 2026-08-10 (third release of the day)

Source commit `1166ed4`. Manifest `2026-08-10T20-31-59-583Z-1166ed4`.
Terraform apply: 1 added, 5 changed, 1 destroyed. All 14 P2.4/P3 gates pass.

## WHAT THE ATTESTATION ACTUALLY COVERS — read this before signing another

The founder attestation asserts "zero HIGH/CRITICAL". Until this record, the
only evidence cited for that was an Artifact Analysis on-demand scan. **That
scan reads OS base-image packages ONLY.** Verified directly against scan
`6308e1f1`: the entire finding set for the core image is

    12  glibc
     1  zlib

Not one npm package was examined. The tell was visible earlier and missed: the
core image (a full Next.js application) and the migrator (a minimal migration
runner) returned IDENTICAL counts — 7 MINIMAL, 5 LOW. Two images with such
different dependency surfaces cannot match unless what is being measured is the
shared base layer.

The application dependency tree is covered, but by a DIFFERENT control: the
`security` GitHub Actions workflow (`npm audit --audit-level=high`, CycloneDX
SBOM, Trivy over dependencies and both runtime images, and a block on newly
introduced vulnerable dependencies). That evidence was never cited here, so the
record simultaneously understated what had been checked and overstated what the
container scan proved.

Both layers are therefore recorded from here on. A release is "zero
HIGH/CRITICAL" only when BOTH are green.

| Layer | Control | Evidence for this release | Result |
| --- | --- | --- | --- |
| OS base image | Artifact Analysis on-demand scan | scans `6308e1f1`, `a507c623`, `69d55124` | 0 HIGH / 0 CRITICAL |
| Application dependencies | GitHub Actions `security` workflow | run `31429540028` @ `1bef5e0` | success |

`1bef5e0` differs from the deployed source `1166ed4` by three artifact/doc
files only — no code and no lockfile change — so its dependency-layer result
applies to the deployed tree.

Independent confirmation: `npm audit` on the deploy branch reports 0
vulnerabilities, total 0.

## The 26 GitHub dependency alerts are NOT on this code

GitHub reports 26 alerts (1 critical, 12 high) against the DEFAULT branch.
This branch is **993 commits ahead of `origin/main`**, with a `package-lock.json`
differing by 4,820 lines. The alerts describe dependency state that this branch
has already moved past; they clear on merge. No deployed artifact is affected.

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
