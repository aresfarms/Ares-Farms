# Staging Release Attestation — 2026-08-14 (pro-forma fixes)

Source commit `bfbab39` — two corrections to the farm best-use pro-forma:

1. **Irrigation cost model.** The enterprise optimizer charged a flat
   $40,000/yr + $450,000 center-pivot irrigation cost to every enterprise
   scoring water≥60 — including grazing livestock, poultry, and greenhouse,
   none of which field-irrigate — divided over small acreage, driving those
   rows deeply negative (livestock −$33,829/yr, poultry −$33,952/yr on a
   30-acre parcel). Irrigation is now charged only to genuine field-irrigators
   (irrigated alfalfa, specialty crops) via an explicit `irrigates` flag, and
   scaled per irrigated acre ($3,500/ac install, $300/ac/yr). Verified live:
   livestock +$6,171/yr (1.37×), poultry +$6,048/yr (1.34×), every enterprise
   positive and internally consistent.
2. **Honest generalized-zoning label.** A bare generalized class (e.g.
   Maryland SDAT statewide "R") now states plainly it is the source's
   generalized classification, not the parcel's specific local district
   (R-1/R-2/Ag), flagged caution to confirm with the county. County zoning GIS
   (specific district) is the deferred permanent follow-up.

Redeploy from `ef7cbbf` → `bfbab39`. Terraform: 1 added, 5 changed, 1 destroyed
— container images only + the IAP re-trigger. No env / IAM / allowlist / secret
changes.

## Approved runtime evidence — effectiveSeverity gate

| Runtime | Digest | Effective HIGH/CRIT | UNASSESSED |
| --- | --- | ---: | --- |
| Core | `sha256:37d5795e83bcaacec9caa8cad3283ee2c2279d71797ad41fe26a4376177f5b01` | **0** | none |
| DB migrator | `sha256:a7737cf562ecc6ef59e72f6ca9c29b9cfcf162bff7b3c50e6fe19af67037814f` | **0** | none |
| Scanner | `sha256:6c613dffecc159f13fc6735026fe1e9ff88f240ada17ca5fe30b3ff14de18fce` | **0** | 3 |

All three pass the gate. Core and migrator carry nothing above LOW. Scanner's 3
unassessed — `CVE-2026-53613`, `CVE-2026-53615`, `CVE-2026-72522` — are the same
glibc/base-image findings reviewed and accepted on every prior release; no new
unknowns. (Scanner also carries 2 MEDIUM: `CVE-2025-66382`, `CVE-2026-13595` —
below the HIGH/CRITICAL gate; the scanner is a build/scan job, not a
tester-facing surface.)

## Founder decision

**Approved by Caitlin Hudson · 8/14/2026.** Same basis as prior releases:
staging is IAP-locked to two named principals (chudson@, sfraas@), no real
customer data, unassessed base-image CVEs a permanent container condition. Not
inherited into production — the three scanner CVEs must be re-assessed before any
production attestation.

## Attestation

Attested by `furlong-release-approval`, KMS key version 1
(`furlong-security/furlong-release-attestor`, us-central1), signed by
`user:chudson@aresfarmsinc.com` (8/14/2026, on founder authorization). All three
digests carry a valid attestation. Migrator executed against this release
(`furlong-db-migrate-vdxxh`). Post-deploy gate: **P2.4 + P3 PASS** — manifest
`artifacts/deployments/staging/2026-08-14T21-50-17-360Z-bfbab39.json`.
