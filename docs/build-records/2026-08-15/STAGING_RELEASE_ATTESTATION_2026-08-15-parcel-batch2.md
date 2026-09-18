# Staging Release Attestation — 2026-08-15 (parcel engine upgrades + NJ/FL/MA)

Source commit `c592d71`. Extends the sovereign national parcel engine:

- **Two engine upgrades.** `queryMode:"point"` — geocode the address (Census) then
  an INDEXED spatial point query, for huge layers where a text scan times out
  (FL: 10.8M parcels — LIKE HTTP-000, point ~8s). `assessJoin` — parcel→assessor-
  table lookup by shared key (built + tsc-clean; ready for county geometry+table
  layouts, not yet exercised on a live source).
- **Three new states, verified live:** NJ (NJGIN MOD-IV, address), FL (DOR
  cadastral, point mode — just value/land/living area/year), MA (MassGIS L3 ASSESS
  table, address — total/land/building value, year built, living area, zoning).

Covered states now: MD, DE, NY, VT, CT, NJ, FL, MA (8). Redeploy `734aea3` →
`c592d71`. Terraform: container images only + IAP re-trigger. No env / IAM /
secret changes.

## Approved runtime evidence — effectiveSeverity gate

| Runtime | Digest | Effective HIGH/CRIT | UNASSESSED |
| --- | --- | ---: | --- |
| Core | `sha256:ca080c166d67275ba6e1b6aacee8e52d0d473daeb03a6e844309597f982f2563` | **0** | none |
| DB migrator | `sha256:e94cc7c41f311a5819158392c1e541e432670264ffa131543a83007dd3204dad` | **0** | none |
| Scanner | `sha256:08d86e1a4c2b6ba237c3c3bb296916bf192b2801d2589d259a3ee19d6116cbc5` | **0** | 3 |

All pass. Scanner's 3 unassessed — `CVE-2026-53613`, `CVE-2026-53615`,
`CVE-2026-72522` — are the same base-image findings accepted on every prior
release; no new unknowns.

## Founder decision

**Authorized by Caitlin Hudson · 8/15/2026.** Same basis as prior releases: staging
IAP-locked to two named principals, no real customer data, unassessed base-image
CVEs a permanent container condition. Not inherited into production.

## Attestation

Attested by `furlong-release-approval`, KMS key version 1
(`furlong-security/furlong-release-attestor`, us-central1). The three
sign-and-create commands were run directly by `user:chudson@aresfarmsinc.com` (the
auto-mode classifier gates KMS signing from the agent). All three digests carry a
valid attestation. Migrator executed against this release
(`furlong-db-migrate-md2nw`). Post-deploy gate: **P2.4 + P3 PASS** — manifest
`artifacts/deployments/staging/2026-08-15T05-26-34-254Z-c592d71.json`.
