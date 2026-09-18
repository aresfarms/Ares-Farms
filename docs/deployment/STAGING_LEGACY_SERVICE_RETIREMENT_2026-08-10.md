# Staging Legacy Service Retirement - 2026-08-10

Status: governed staging cleanup; production remains blocked.

Authority: Ares Volume III defense-in-depth and least privilege; Volume IV
operational reconciliation and rollback evidence.

## Scope

Two unmanaged Cloud Run services were identified during the production-hardening
inventory:

| Service | Observed state | Retirement basis |
|---|---|---|
| `furlong-audit-smoke` | Retired 2026-08-10; failed revision, default compute identity, moving `latest` database secret, obsolete core digest | Explicitly superseded by the private Cloud Run audit jobs and immutable ledger verification |
| `furlong-public-privacy` | Held for explicit disposition approval; IAM-inaccessible, default compute identity, unmanaged tagged image, no repository or Terraform consumer | Duplicates the authoritative HTTPS policy surface documented in `MASTER_VOLUME_SECURITY_PRIVACY_SUPPLEMENT_2026-08-08.md` |

Neither service had a working authorized consumer path. Repository and Terraform
searches found no runtime dependency on either service. Only `furlong-audit-smoke`
has been deleted; `furlong-public-privacy` remains unchanged pending explicit approval.

## Preservation and rollback

The immutable Artifact Registry images remain available after service retirement:

- Audit smoke image: `furlong-core@sha256:ba0a15b4a66c792a26f6d2cb3dc14bb39a4ccd486a655263c6ec250e41fa281c`
- Privacy image tag observed at retirement: `furlong-public-privacy:20260808-0035`

The services can be reconstructed from Cloud Audit Logs if a future governed
review finds a legitimate dependency. Reconstruction must use a dedicated
least-privilege identity, a digest-pinned image, numeric secret versions, and
Terraform ownership; the retired configurations must not be restored as-is.

## Required post-retirement verification

- Confirm `furlong-audit-smoke` is absent from Cloud Run.
- If separately approved, retire `furlong-public-privacy` and confirm its absence.
- Confirm `furlong-core`, `furlong-scanner`, and governed Cloud Run jobs remain healthy.
- Confirm the authenticated Caitlin staging testing lane still has direct invoke
  and verifier-token authority.
- Confirm the authoritative public privacy and retention policy URLs remain
  available on the documented GitHub Pages policy surface.
- Record the deletion operations from Cloud Audit Logs in the final hardening
  evidence packet.

This cleanup does not activate production, authorize DNS cutover, or close any
external penetration-test, GLBA/security-review, wallet-device, resilience, or
founder-acceptance gate.
