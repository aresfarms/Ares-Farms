# Staging Release Attestation — 2026-08-13 (valuation feature)

Source commit `ef7cbbf` — Furlong's own comps-free property value (Land ·
Improvements · Combined + land-income), hazard-adjusted rebuild (FEMA NRI +
flood zone), and live grain-price-linked row-crop revenue, wired into the farm
pro-forma. Redeploy from `4eae5b2` → `ef7cbbf`.

Terraform apply: 1 added, 5 changed, 1 destroyed — container images only + the
IAP re-trigger. No env / IAM / allowlist / secret changes.

## Approved runtime evidence — effectiveSeverity gate

| Runtime | Digest | Effective HIGH/CRIT | UNASSESSED |
| --- | --- | ---: | --- |
| Core/webhook | `sha256:665f1dc040b6bbd3e64726e70107db883181c2a7981df9272d89cff1b06699cd` | **0** | none |
| DB migrator | `sha256:99ad1e9000499f4461500bde85320e5d4c364785f2cbdb340336c82253f2435a` | **0** | none |
| Scanner | `sha256:3a8eb100941b93bfdbe67de4ef71551ce071345de236d99950ad2d3f53e83831` | **0** | 3 |

All three pass the gate. Scanner's 3 unassessed — `CVE-2026-53613`,
`CVE-2026-53615`, `CVE-2026-72522` — are the same glibc/base-image findings
reviewed and accepted on every prior release; no new unknowns.

## Founder decision

**Approved by Caitlin Hudson · 8/13/2026 @ 6:03 PM EST.** Same basis as prior
releases: staging is IAP-locked to two named principals, no real customer data,
unassessed base-image CVEs a permanent container condition. Not inherited into
production — the three scanner CVEs must be re-assessed before any production
attestation.

## Attestation

Attested by `furlong-release-approval`, KMS key version 1, signed by
`user:chudson@aresfarmsinc.com` (8/13/2026, on founder authorization). All three
digests carry a valid attestation. Migrator executed against this release
(`furlong-db-migrate-scbp8`). Post-deploy gate: **P2.4 + P3 PASS** — manifest
`artifacts/deployments/staging/2026-08-13T22-11-21-671Z-ef7cbbf.json`.
