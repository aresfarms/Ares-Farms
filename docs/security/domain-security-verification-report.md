# Domain Security Verification Report — DOMAIN-ASSET-001

**Gate:** DOMAIN_ASSET_GOVERNANCE = **ALPHA_PENDING**. Do not merge. Stop for human review.
**Verification:** `npm run verify:domain-governance` (PASS) · cross-checked by
`verify:security-conformance` (79 controls) and `verify:security-governance`.

## Domains registered
| Domain | Purpose | Canonical role | Owner |
|---|---|---|---|
| furlongpathways.com | Primary public platform / pathway discovery portal ("What are your possibilities?") | PRIMARY_PUBLIC_PLATFORM | Ares Farms Inc. |
| furlonghub.com | Institutional hub — partner/governance/module/developer/certification coordination | INSTITUTIONAL_HUB | Ares Farms Inc. |
| aresfarmsinc.com | Corporate/legal entity — admin, legal, billing, official communications | CORPORATE_ENTITY | Ares Farms Inc. |
| redacre.enterprises | Legacy/subsidiary/enterprise initiatives — preserved asset | LEGACY_ENTERPRISE_ASSET | Ares Farms Inc. / Redacre lineage |

## Registrar / security status
Ownership is recorded. Registrar-level controls (MFA/passkeys, auto-renew, transfer lock, privacy)
are **UNVERIFIED — manual founder attestation pending**. We do not assume registrar settings; each
reads PENDING until attested with evidence. Treat the registrar account as critical infrastructure.

## DNS status
No founder DNS security review recorded yet → **PENDING**. Production DNS changes require an audit
entry + human approval; DNS authority changes require ALL-founder multi-party approval. DNS hygiene
(wildcards, dangling CNAMEs, stale TXT, unused subdomains) to be walked via the DNS checklist.

## Email authentication status
- aresfarmsinc.com (corporate mail): **PENDING** — if used to send, publish SPF/DKIM/DMARC; DMARC
  starts in monitoring (`p=none`), then quarantine/reject once validated.
- furlongpathways.com / furlonghub.com: PENDING (not yet sending).
- redacre.enterprises: N/A (non-sending; consider anti-spoofing DMARC reject).

## Production readiness status
**BLOCKED.** `productionDnsCutoverAllowed()` = false. `railwayCanBeAuthoritativeProductionHost()`
= false. GCP is the canonical target but a public cutover still requires a DNS security review.

## Remaining manual verification items
- Attest MFA/passkeys, auto-renew, transfer lock, privacy per domain (with evidence).
- Record registrar, DNS provider, nameservers, renewal dates.
- Conduct and record a founder DNS security review (`last_reviewed_at` / `reviewed_by`).
- Configure + record SPF/DKIM/DMARC for any sending domain (DMARC → monitoring first).
- Add domains to the founder emergency recovery package + disaster-recovery records.

## Production blockers (open)
`DOMAIN_TRANSFER_LOCK_REQUIRED` · `DOMAIN_AUTORENEW_REQUIRED` · `DOMAIN_DNS_REVIEW_REQUIRED` ·
`PRODUCTION_DNS_CUTOVER_REQUIRES_HUMAN_REVIEW` · `DOMAIN_SECURITY_REVIEW_REQUIRED_BEFORE_PUBLIC_LAUNCH`.
(`DOMAIN_ASSET_REGISTRY_REQUIRED` is satisfied — the registry exists.)

## Statement
**Domain ownership is secured, but production DNS cutover remains BLOCKED pending Google Cloud
deployment review, security hardening review, and human approval.** No public PII workflow may be
enabled by DNS cutover alone. DOMAIN_ASSET_GOVERNANCE = ALPHA_PENDING — not production-ready, not merged.
