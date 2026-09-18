# Staging Release Attestation — 2026-08-14 (diversified acre allocation)

Source commit `5507a20` — the farm best-use pro-forma rebuilt from an
overlapping independent-scenario table into a real, sustainability-weighted acre
ALLOCATION that sums to the parcel (never past it), with per-enterprise acre
toggles. Fixes the founder-caught defect where the enterprise rows summed to 115
acres on a 30-acre parcel and ranking merely rewarded whichever use was
pre-assigned the most land.

Behavior (new `agriculturalAllocationPlan.ts`): blends net income + sustainability
(soil health, rotation, water demand, runoff risk); diversifies via a 45% per-use
cap and only collapses to a single use when it beats the best mix by >40%; income
normalized against a fixed reference so high-value crops (cut flowers) rank on
merit; reserves a named conservation/runoff buffer; acre toggles recompute and
clamp to the parcel. Dollar inputs gained thousands separators. Redeploy from
`bfbab39` → `5507a20`.

Terraform: container images only + the IAP re-trigger. No env / IAM / allowlist /
secret changes.

## Approved runtime evidence — effectiveSeverity gate

| Runtime | Digest | Effective HIGH/CRIT | UNASSESSED |
| --- | --- | ---: | --- |
| Core | `sha256:9e99d47c994269d656f1fdc0f436153a03f59f30f1dc33f8f24566dcf89dc52e` | **0** | none |
| DB migrator | `sha256:0b784147c44d599e8437ee10885867bd7c65a0933ff4baac36abdebffcf35741` | **0** | none |
| Scanner | `sha256:1483ade1bce32d0af4efb36c4a4b958d2a35b9cfb4f5fc5b3c648d12cd30778f` | **0** | 3 |

All three pass the gate. Core and migrator carry nothing above LOW. Scanner's 3
unassessed — `CVE-2026-53613`, `CVE-2026-53615`, `CVE-2026-72522` — are the same
glibc/base-image findings reviewed and accepted on every prior release; no new
unknowns. (Scanner also carries 2 MEDIUM below the HIGH/CRITICAL gate; it is a
build/scan job, not a tester-facing surface.)

## Founder decision

**Authorized by Caitlin Hudson · 8/14/2026** — instructed to proceed ("keep
going") on the CVE posture above after reviewing it. Same basis as prior
releases: staging IAP-locked to two named principals, no real customer data,
unassessed base-image CVEs a permanent container condition. Not inherited into
production — the three scanner CVEs must be re-assessed before any production
attestation.

## Attestation

Attested by `furlong-release-approval`, KMS key version 1
(`furlong-security/furlong-release-attestor`, us-central1). The three
sign-and-create commands were run directly by `user:chudson@aresfarmsinc.com`
(the auto-mode classifier gates KMS signing from the agent, so the founder signed
with her own credential — cleaner governance). All three digests carry a valid
attestation. Migrator executed against this release (`furlong-db-migrate-669nc`).
Post-deploy gate: **P2.4 + P3 PASS** — manifest
`artifacts/deployments/staging/2026-08-15T00-39-09-100Z-5507a20.json`.
