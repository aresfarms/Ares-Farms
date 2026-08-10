# Staging Security Closure — 2026-08-10

Status: staging is operational and meaningfully hardened. Production remains intentionally unprovisioned and blocked.

## Approved runtime evidence

| Runtime | Immutable digest | HIGH/CRITICAL | On-demand scan | Provenance build |
| --- | --- | ---: | --- | --- |
| Core/webhook | `sha256:4cab240731c03aff3f4284e8f51001bad2833c85949001079fa3431f397b5782` | 0 | `23c26883-3869-4b2c-a437-2e10d70b7f54` | `ea875dbe-cc4d-49b6-94d0-e6593243217c` |
| DB migrator/verifier/refresh | `sha256:70655200b22f480c91f551ab43f74a3b0ce4a74d071c295d27629cf172877682` | 0 | `4c2fc2be-4739-47fc-91c8-8f75ec7614f1` | `ea875dbe-cc4d-49b6-94d0-e6593243217c` |
| Scanner | `sha256:e240e205f18bc9080a60d6f7d5a24f4804ac69283e87ef2a316a6adb91e8e6c4` | 0 | `dbadbd4c-d7ed-4741-8466-27b985cba4d5` | `a8211e84-6353-4644-be86-f3e8cc352a4f` |

Artifact Registry exposes Cloud Build/in-toto provenance for all three approved digests. Each digest has a validated attestation from `furlong-release-approval`, signed by KMS key version 1 of `furlong-release-attestor`.

## Enforcement and runtime verification

- Project Binary Authorization policy requires the release attestor and uses `ENFORCED_BLOCK_AND_AUDIT_LOG`.
- Core, scanner, DB migrate, runtime verify, and source refresh opt into the default policy.
- `furlong-db-migrate-7p8xw` completed successfully on the bundled minimal migrator image.
- `furlong-runtime-verify-6sbk5` completed before enforcement; `furlong-runtime-verify-vq8x7` completed after enforcement.
- Final Terraform plan: no changes.
- PR checks pass, including dependency SCA, CodeQL, secret scan, SBOM, filesystem scan, and all core/migrator/scanner image scans.

## Testing lane preserved

`founder_testing_lane_enabled = true`. Core ingress remains `all`, IAP remains enabled, and `user:chudson@aresfarmsinc.com` retains `roles/run.invoker`. These controls must remain until Caitlin explicitly confirms testing is complete for every authority and licensed application path in the portal.

## Additional staging controls

- The external managed backend is attached to `furlong-staging-edge-waf`; reserved IP `8.233.5.186` remains without DNS, certificate, or frontend cutover.
- The repository contains bounded scheduled/manual OWASP ZAP staging DAST. It becomes runnable after the workflow reaches the default branch.
- All Cloud Run service/job secret references use pinned numeric versions.
- Failed legacy service `furlong-audit-smoke` is retired. Unmanaged `furlong-public-privacy` remains available pending an explicit migration/deletion decision.

## Deliberately open release gates

No statement of completion or production readiness may be made until evidence exists for:

1. Merge of the current PR, default-branch alert closure, and a successful authenticated staging DAST run.
2. Independent external penetration testing and remediation closure.
3. A staging hostname, DNS/certificate/frontend configuration, Cloud Armor validation, and Caitlin's explicit approval before restricting Cloud Run ingress.
4. Real Apple Pay and Google Pay physical-device journeys preserving signed webhook, billing, fraud, allocation, and immutable-lineage evidence.
5. Caitlin's explicit completion of every authority and licensed portal application path.
6. Governance/security approvals required by the Master Volumes.
7. Production regional HA provisioning, restore/failover drills, measured RTO/RPO, ten required synthetic borrower journeys, and the governed joint activation ceremony.

`furlong-prod` therefore remains intentionally unprovisioned and blocked.
