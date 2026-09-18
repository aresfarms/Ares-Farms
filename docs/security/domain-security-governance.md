# Domain Security Governance — DOMAIN-ASSET-001

**Status:** ALPHA_PENDING. Do not merge. Stop for human review.

Domains are governed as security-critical property. This document is the governance reference;
enforcement lives in [`src/security/domainSecurityVerification.ts`](../../src/security/domainSecurityVerification.ts)
and the multi-party primitive in
[`src/security/securityGovernanceVerification.ts`](../../src/security/securityGovernanceVerification.ts).

## A. Registrar security
- MFA/passkeys enabled on registrar accounts (treat the registrar account as critical infrastructure).
- Auto-renew enabled.
- Transfer lock / registrar lock enabled.
- WHOIS privacy enabled where legally available.
- Recovery methods documented (and kept out of any single founder's sole control).
- The registrar account is critical infrastructure — access continuity is a founder-continuity item.

## B. DNS security
- DNS changes require an audit entry and must be reviewable.
- **Production** DNS changes require founder approval (multi-party for authority changes).
- No wildcard records without explicit review.
- No unused subdomains pointing to abandoned services; no dangling CNAMEs.
- No stale verification TXT records unless still required.
- SPF/DKIM/DMARC tracked for email-sending domains. **DMARC starts in monitoring mode**, then
  moves toward quarantine/reject once validated.

## C. Cloud deployment preparation
- **GCP is the canonical future deployment target** (Cloud Run / Cloud Load Balancer / managed SSL).
- **Railway is preview/demo ONLY** and can never be marked an authoritative production host.
- No production DNS cutover without a security review.
- No public PII workflow may be enabled by DNS cutover alone.

## D. Institutional continuity
- Domains included in the founder emergency recovery package and the institutional asset registry.
- Renewal dates, registrar, and DNS provider tracked.
- Founder incapacitation/recovery procedures must include domain access continuity.
- **No single founder can permanently transfer or lose domain assets alone** — enforced by the
  ALL-founder quorum on `domain-transfer` / `domain-ownership-change` / `domain-registrar-change` /
  `domain-dns-authority-change`.

## E. Multi-party founder gates (code)
| Action | Quorum |
|---|---|
| `domain-transfer` | ALL founders |
| `domain-ownership-change` | ALL founders |
| `domain-registrar-change` | ALL founders |
| `domain-dns-authority-change` | ALL founders |
| `domain-primary-public-change` | 2 founders + human review + audit entry |

## F. Production blockers (DOMAIN-ASSET-001)
`DOMAIN_ASSET_REGISTRY_REQUIRED` · `DOMAIN_TRANSFER_LOCK_REQUIRED` · `DOMAIN_AUTORENEW_REQUIRED` ·
`DOMAIN_DNS_REVIEW_REQUIRED` · `PRODUCTION_DNS_CUTOVER_REQUIRES_HUMAN_REVIEW` ·
`DOMAIN_SECURITY_REVIEW_REQUIRED_BEFORE_PUBLIC_LAUNCH`.

The registry blocker is satisfied (the registry exists). All others remain **open** until controls
are attested by founder review and the categorical human gates are cleared. `productionDnsCutoverAllowed()`
returns **false** by construction.

## Verification behavior
- If a domain control cannot be verified automatically, it is marked PARTIAL/PENDING and requires
  manual evidence. Registrar settings are never assumed.
- Evidence fields are manual founder attestations until a registrar/DNS API verification exists.
- Production readiness stays blocked unless every domain control is IMPLEMENTED or manually attested
  by authorized founder review.
