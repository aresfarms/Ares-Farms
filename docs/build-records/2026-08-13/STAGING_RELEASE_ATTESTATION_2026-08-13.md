# Staging Release Attestation — 2026-08-13

Source commit `6e95b28` — Farm living pro-forma (coverage verdict + real-numbers
table on the parcel; best case = combination of revenue streams; wired into the
per-property farm tab and the public farm lane workspace). Redeploy from
`a0699e8` → `6e95b28`.

Terraform apply: 1 added, 5 changed, 1 destroyed — container images only (core +
scanner services; migrate/verify/refresh jobs) plus the IAP-enable re-trigger.
No env / IAM / allowlist / secret changes.

## Approved runtime evidence — effectiveSeverity gate

| Runtime | Digest | Effective HIGH/CRIT | UNASSESSED |
| --- | --- | ---: | --- |
| Core/webhook | `sha256:fe19762ab69391e2d9d984bb6d416a0515668324b968cd87768ca04682bcc677` | **0** | none |
| DB migrator | `sha256:5e1e51323b71ad75f9e262dea881a0fc350ff23e2dd4fc6f4bc70a3c0a7d36dc` | **0** | none |
| Scanner | `sha256:ca9a20e5f5c4b07445249d13db4802784e11ff315fc3cdbcb46c98298f7252ef` | **0** | 3 |

**Cleaner than 2026-08-12:** core and migrator now carry **zero** unassessed
findings (the two glibc unknowns picked up ratings). Scanner's 3 unassessed —
`CVE-2026-53613`, `CVE-2026-53615`, `CVE-2026-72522` — are the **same** findings
reviewed and accepted on 2026-08-12; no new unknowns.

## Founder decision

**Approved by Caitlin Hudson · 8/13/2026 @ 12:56 PM.** Founder reviewed the
posture; the only judgment item is the same 3 scanner CVEs previously accepted.
Signed with them open on the same basis: staging is IAP-locked to two named
principals (`chudson@`, `sfraas@`), holds no real customer data, and unassessed
glibc/base-image CVEs are a permanent condition of running containers. **Not
inherited into production** — the three scanner CVEs must be re-assessed before
any production attestation.

## Attestation

Attested by `furlong-release-approval`, KMS key version 1, signed by
`user:chudson@aresfarmsinc.com` (8/13/2026, on founder authorization). All three
digests carry a valid attestation. Terraform rolled the core service to a new
revision (image `fe19762a`); the migrator executed successfully against this
release (`furlong-db-migrate-xtvrm`). Post-deploy gate: **P2.4 + P3 PASS** —
manifest `artifacts/deployments/staging/2026-08-13T17-01-49-333Z-6e95b28.json`.
