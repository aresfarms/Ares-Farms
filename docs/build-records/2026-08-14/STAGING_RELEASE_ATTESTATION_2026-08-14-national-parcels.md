# Staging Release Attestation — 2026-08-14 (national parcel engine + off-market honesty)

Source commit `734aea3`. Two changes:

1. **Sovereign national parcel engine.** Parcel/assessment coverage is now a DATA
   problem, not code: a generic ArcGIS resolver + a registry of verified
   government endpoints (parcelSourceRegistry). Coverage grows by adding a config
   entry. Live states: MD, DE (bespoke) + **NY, VT, CT** (registry, verified
   against live queries — assessed/market values, acres, year built, building
   area). No third-party vendor — founder direction 2026-08-14 ("build our own").
   The outbound allowlist now derives parcel hosts from the registry so a new
   source can't open an ungoverned egress path.
2. **Off-market honesty fix.** The platform no longer asserts "Off market" when it
   simply has no listing feed — for-sale status is UNKNOWN, not false (founder
   caught a $1.995M active listing reading as off-market). Vol II: no fabricated
   certainty.

Redeploy `5507a20` → `734aea3`. Terraform: container images only + IAP re-trigger.
No env / IAM / allowlist(IAM) / secret changes.

## Approved runtime evidence — effectiveSeverity gate

| Runtime | Digest | Effective HIGH/CRIT | UNASSESSED |
| --- | --- | ---: | --- |
| Core | `sha256:85a479ed1bb83135096118c6baf368156acbac11b380812b7a3a95c6633389d3` | **0** | none |
| DB migrator | `sha256:8a4189bd2d4f1d818ec1440c35603487533fc3bfb2fd56a9f495b1ef81e19dd6` | **0** | none |
| Scanner | `sha256:0109a5f0cba26020e52edf15742c4200d59bab7fac253123e687569299263a69` | **0** | 3 |

All pass. Scanner's 3 unassessed — `CVE-2026-53613`, `CVE-2026-53615`,
`CVE-2026-72522` — are the same base-image findings accepted on every prior
release; no new unknowns.

## Founder decision

**Authorized by Caitlin Hudson · 8/14/2026.** Same basis as prior releases: staging
IAP-locked to two named principals, no real customer data, unassessed base-image
CVEs a permanent container condition. Not inherited into production.

## Attestation

Attested by `furlong-release-approval`, KMS key version 1
(`furlong-security/furlong-release-attestor`, us-central1). The three
sign-and-create commands were run directly by `user:chudson@aresfarmsinc.com` (the
auto-mode classifier gates KMS signing from the agent). All three digests carry a
valid attestation. Migrator executed against this release
(`furlong-db-migrate-v9qgc`). Post-deploy gate: **P2.4 + P3 PASS** — manifest
`artifacts/deployments/staging/2026-08-15T02-44-22-609Z-734aea3.json`.
