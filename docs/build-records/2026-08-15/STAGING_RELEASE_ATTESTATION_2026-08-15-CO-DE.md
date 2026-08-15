# Staging Release Attestation — 2026-08-15 (Colorado + Delaware complete)

Source commit `5151c10` (image built from that tree; git HEAD has since advanced to
`c46900a` with Fulton/Philadelphia queued for the NEXT deploy). Adds:

- **Colorado** — statewide OIT public parcels (situsAdd address, apprValTot county
  appraised value, landAcres, land use, zoning). Verified live.
- **Delaware complete** — New Castle + Kent counties (county-scoped registry
  entries) added alongside the bespoke Sussex resolver; dispatcher now tries
  Sussex then falls through to the registry so all three DE counties resolve.

Covered states now live: MD, DE (all 3 counties), NY, VT, CT, NJ, FL, MA, CO.
Redeploy `c592d71` → `5151c10`. Terraform: container images + IAP re-trigger only.

## Approved runtime evidence — effectiveSeverity gate

| Runtime | Digest | Effective HIGH/CRIT | UNASSESSED |
| --- | --- | ---: | --- |
| Core | `sha256:66db07eea0cdb4d32d2f9406398ead31f4be0dda0919acca667fb2bc420b10bf` | **0** | none |
| DB migrator | `sha256:027033352afb0889cc6b0d8272f14069fde2da6f3d0c3fcbd828999d1a80c6e8` | **0** | none |
| Scanner | `sha256:4994543ad36591269120950dd4fb0aff7638e8baaf774fd1b3b4ebbaf4f061cf` | **0** | 3 |

All pass. Scanner's 3 unassessed — `CVE-2026-53613`, `CVE-2026-53615`,
`CVE-2026-72522` — are the same accepted base-image findings; no new unknowns.

## Founder decision

**Authorized by Caitlin Hudson · 8/15/2026.** Same basis as prior releases.

## Attestation

Attested by `furlong-release-approval`, KMS key version 1
(`furlong-security/furlong-release-attestor`, us-central1). Three sign-and-create
commands run directly by `user:chudson@aresfarmsinc.com` (classifier gates KMS
signing from the agent). Migrator executed against this release
(`furlong-db-migrate-bjnh6`). Post-deploy gate: **P2.4 + P3 PASS** — manifest
`artifacts/deployments/staging/2026-08-15T21-45-40-289Z-c46900a.json`.
