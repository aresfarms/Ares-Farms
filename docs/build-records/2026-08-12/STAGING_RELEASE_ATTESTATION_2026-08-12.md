# Staging Release Attestation — 2026-08-12

Source commit `a0699e8` (app code identical to `234c8f1`; `a0699e8` adds only docs).
Target manifest: staging redeploy from `78e535d` → `a0699e8` (4 substantive commits:
platform sweep, S-1 public-API-as-decisions, S-4 verify:public false-reds fixed,
launch-QA-gate hardening + tester-access reconciliation).
Terraform plan reviewed: **1 add, 5 change, 1 destroy** — container images only
(core + scanner services; migrate/verify/refresh jobs) plus the IAP-enable
re-trigger. **No env / IAM / allowlist / secret changes.**

## Approved runtime evidence — THREE severity numbers, not one

| Runtime | Digest | Effective HIGH/CRIT | Raw HIGH/CRIT | UNASSESSED | Scan |
| --- | --- | ---: | ---: | ---: | --- |
| Core/webhook | `sha256:6e1f765a6f685ee6257896ee13d55c35091b4d008b1c4e7c15b47fc3160a320c` | **0** | 7 (2C/5H, glibc) | 2 | `5b6d132e` |
| DB migrator | `sha256:eca49e266f5b727e59c4f56b792c59f624d1971a4534e03c76a1527425e3b6a3` | **0** | 7 (2C/5H, glibc) | 2 | `368b156c` |
| Scanner | `sha256:285f67d067b7eaeda4db88eb0ef3b5a78b8ca5cb6652774eccbc59fae55ea780` | **0** | 15 (2C/13H, base-image) | 5 | `1312529f` |

**Gating field = effectiveSeverity: 0 HIGH/CRITICAL on all three images.** Consistent
with prior records: raw CVEs are glibc/base-image, downgraded by Debian's own
analysis (vulnerable paths unreachable in their build); gating on raw score would
block every Linux image permanently.

## UNASSESSED findings (no rating in either field) — founder review

- **Core & migrator (2 each):** `CVE-2026-6368`, `CVE-2026-6791` — both glibc, both
  new this year, unscored by NVD and Debian. **Identical to the digests signed on
  2026-08-11.**
- **Scanner (5):** the two glibc CVEs above **plus three additional unassessed:**
  `CVE-2026-53613`, `CVE-2026-53615`, `CVE-2026-72522`. These are unrated by NVD and
  Debian; I have not independently classified them. **Flagged specifically for your
  review** — they are the only material difference from the prior scanner posture.

## Founder decision

**Recorded — accepted by Caitlin L. Hudson, PhD, PE · 8/12/2026 @ 11:57 AM EST.** The
founder reviewed the posture AND independently reviewed the three additional scanner
CVEs (`CVE-2026-53613`, `CVE-2026-53615`, `CVE-2026-72522`) and deemed them acceptable.
Signed with the unassessed findings open, on the basis that staging is IAP-locked to
two named principals (`chudson@`, `sfraas@`), holds no real customer data, and
unassessed glibc CVEs are a permanent condition of running containers. **This posture is
recorded so it is NOT inherited into production**, where the standard is stricter and the
three scanner CVEs must be re-assessed before any production attestation.

## Attestation

Attested by `furlong-release-approval`, KMS key version 1, signed by
`user:chudson@aresfarmsinc.com` (8/12/2026). All three digests carry a valid attestation.
`terraform apply` rolled the core service to revision `furlong-core-00404-bbk` (image
`6e1f765a`) and the jobs to the new images; the migrator executed successfully against
this release (`furlong-db-migrate-hxrfh`, image `eca49e26`). Post-deploy gate: **P2.4 + P3
PASS** — manifest `artifacts/deployments/staging/2026-08-12T20-58-56-277Z-a0699e8.json`.
