# Staging Release Attestation — 2026-08-11

Source commit `daacbce`. Manifest `2026-08-11T17-52-30-661Z-daacbce`.
Terraform apply: 1 added, 5 changed, 1 destroyed. All gates pass.

## Approved runtime evidence — THREE severity numbers, not one

| Runtime | Digest | Effective HIGH/CRIT | Raw CVE HIGH/CRIT | UNASSESSED | Scan |
| --- | --- | ---: | ---: | ---: | --- |
| Core/webhook | `sha256:4327b3ab90905cbf43e969ccdfc15fd15acbcf202f699c8a6acca04bb4f22339` | 0 | 7 (glibc) | 2 | `be22688d` |
| DB migrator | `sha256:6d3a7994206305d959a5508d3224826bdff89f026150716e2c13df5ddf95fe32` | 0 | 7 (glibc) | 2 | `a4dd7def` |
| Scanner | `sha256:2df0d313f319087ccc798d17af514753d690c2e6f036e2b4bb014482b4db2041` | 0 | (base-image set) | 5 | `c79c60e2` |

| Layer | Control | Evidence | Result |
| --- | --- | --- | --- |
| OS base image | Artifact Analysis on-demand scan | scans above | 0 effective HIGH/CRITICAL |
| Application dependencies | GitHub Actions `security` workflow | `npm audit --audit-level=high`, SBOM, Trivy | green; `npm audit` = 0 total |

Attested by `furlong-release-approval`, KMS key version 1, signed by
`user:chudson@aresfarmsinc.com`.

## REPORTING CORRECTION — "zero HIGH/CRITICAL" was one number hiding three

Prior records reported a single figure drawn from `effectiveSeverity`. The scan
carries TWO severity fields, and some findings carry NEITHER:

- **effectiveSeverity** — the distro's adjusted rating. Debian assesses many
  glibc CVEs as LOW/MINIMAL because the vulnerable path is unreachable in their
  build. **This remains the correct field to gate on**: raw CVE score would
  block every Linux image permanently, since glibc always carries open CVEs.
  Gating on it is standard practice, not leniency.
- **severity** — the raw CVE rating. By this measure the core image carries
  2 CRITICAL and 5 HIGH, every one glibc, every one downgraded by Debian's own
  analysis. Examples: CVE-2026-5450 (raw CRITICAL, effective LOW),
  CVE-2019-1010022 (raw CRITICAL, effective MINIMAL).
- **UNASSESSED** — no rating in either field. Two on core and migrator:
  **CVE-2026-6368** and **CVE-2026-6791**, both glibc, both new this year,
  unscored by NVD and by Debian. Neither other number describes them.

### Founder decision on the unassessed findings

Signed with them open. Staging is IAP-locked to two named principals, holds no
real customer data, and unassessed glibc CVEs are a permanent condition of
running containers — there is no state in which zero exist. Recorded here
specifically so the posture is NOT inherited into production, where the
exposure calculus differs and this call must be made again.

## MIGRATOR GATE HARDENING — PROVEN AGAINST LIVE INFRASTRUCTURE

The gate defect recorded 2026-08-10 is closed, verified by REPRODUCING the
failure rather than by assertion.

After `terraform apply` created the new revision, the gate was run BEFORE
executing the migrator — the exact state that produced a GREEN manifest on
2026-08-10:

    ✓ furlong-db-migrate latest execution SUCCEEDED — furlong-db-migrate-qcx45
    ✗ execution POST-DATES the running revision — STALE: ran BEFORE this revision
    ✗ execution ran THIS release's migrator image — sha256:ef082ef9… (previous)
    ✗ P2.4 FAIL — NO manifest emitted for a red deploy.

Note the first line: the ORIGINAL check still passed on the stale execution.
That is precisely why it was insufficient.

The migrator was then executed (`furlong-db-migrate-l8x8n`) and the gate rerun:

    ✓ latest execution SUCCEEDED — furlong-db-migrate-l8x8n
    ✓ execution POST-DATES the running revision — 2026-08-11T17:49:59Z
    ✓ execution ran THIS release's migrator image — sha256:6d3a7994…

A gate that passes on a healthy deployment proves nothing. This one has now
been shown to fail closed on the failure it was built for.

## What this release contains

- Executed document surfaced to BOTH parties — two separate allowlists had
  omitted it, so a customer who had signed could open the unsigned original and
  a certificate, but never the instrument they signed.
- Per-page execution band with PAGE n OF m — no page of an executed document is
  unmarked, so a page removed or substituted from the middle of a long
  agreement is detectable.
- Migrator gate hardening (above).
- Attestation coverage records (2026-08-10 pair).

## Not closed by this record

Open gates in `STAGING_SECURITY_CLOSURE_2026-08-10.md` stand, including real
Apple Pay / Google Pay physical-device journeys. G-2 (bank connection reachable
by the broker, not the borrower) remains open by design.
