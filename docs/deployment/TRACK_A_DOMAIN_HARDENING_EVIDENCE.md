# TRACK A — Domain & Registrar Hardening Evidence

- **Owner:** Caitlin · **Base:** `main @ 06391f4` · **Branch:** `build-track-a-domain-hardening`
- **Toward:** SEC-DNS-001 (and DOMAIN-GOVERNANCE-002 controls).

> **Division of labor.** Phases 1–5 and 7 require logging into the registrar /
> Google / Squarespace accounts and capturing exports/screenshots — **OWNER-RUN
> (Caitlin)**. The build agent provides this scaffold and pre-fills **Phase 6**
> (verified against the in-code domain registry). **Do NOT change DNS.** This
> package accumulates evidence; **SEC-DNS-001 stays OPEN** until the controls are
> actually verified and human-reviewed.
>
> **Hard rule:** no real credentials, recovery values, or secret answers in this
> file — record only *settings state* (enabled Y/N, dates, provider names).
> Screenshots are stored as owner-held files referenced by name, not pasted
> secrets.

Owned domains (6): `furlongpathways.com`, `furlonghub.com`,
`compasstocapital.com`, `compasstocapital.org`, `comapss2capital.com`,
`comapss2capital.org`. (NOT owned / excluded: `compass2capital.com`.)

---

## PHASE 1 — Domain inventory  ☐ OWNER

| Domain | Registrar | Reg date | Expiry | Auto-renew | Admin contact | Recovery contact | MFA | Transfer lock | Registrar lock | DNS provider | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| furlongpathways.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| furlonghub.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| compasstocapital.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| compasstocapital.org | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| comapss2capital.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| comapss2capital.org | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

Evidence files (owner-held): `phase1-<registrar>-settings.png` per account.
**Success:** complete inventory for all six.

## PHASE 2 — Account security (MFA)  ☐ OWNER

| Account | MFA/2FA enabled | Recovery email verified | Recovery phone verified | Account owner | Evidence file |
|---|---|---|---|---|---|
| Squarespace | ☐ | ☐ | ☐ | ☐ | `phase2-squarespace-mfa.png` |
| Google (primary) | ☐ | ☐ | ☐ | ☐ | `phase2-google-mfa.png` |
| Google (secondary, if any) | ☐ | ☐ | ☐ | ☐ | ☐ |

**Success:** every domain-management account protected by MFA.

## PHASE 3 — Domain protection  ☐ OWNER

| Domain | Registrar lock | Transfer lock | Auto-renew | WHOIS privacy | Contact info verified | Evidence |
|---|---|---|---|---|---|---|
| furlongpathways.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| furlonghub.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| compasstocapital.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| compasstocapital.org | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| comapss2capital.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| comapss2capital.org | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

**Success:** unauthorized-transfer risk minimized (locks + auto-renew on all six).

## PHASE 4 — DNS governance (authoritative baseline)  ☐ OWNER

Per domain, record current records (export or screenshot). Template per domain:

| Domain | A | AAAA | CNAME | MX | TXT | SPF | DKIM | DMARC | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| furlongpathways.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | `phase4-furlongpathways-dns.txt` |
| furlonghub.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| compasstocapital.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| compasstocapital.org | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| comapss2capital.com | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| comapss2capital.org | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

**Success:** known authoritative DNS baseline for all six.

## PHASE 5 — Email security  ☐ OWNER

| Sending domain | SPF | DKIM | DMARC | DMARC policy (none/quarantine/reject) | Evidence |
|---|---|---|---|---|---|
| furlongpathways.com | ☐ | ☐ | ☐ | ☐ | ☐ |
| furlonghub.com | ☐ | ☐ | ☐ | ☐ | ☐ |
| compasstocapital.com | ☐ | ☐ | ☐ | ☐ | ☐ |
| (defensive/typo domains — recommend reject + null MX) | ☐ | ☐ | ☐ | ☐ | ☐ |

**Success:** known email-security posture per sending domain. (Recommendation:
defensive/typo domains carry SPF `-all`, `DMARC p=reject`, and a null MX so they
can't be spoofed.)

## PHASE 6 — Domain purpose confirmation  ✅ VERIFIED (against `src/security/domainPurposeRegistry.ts`, DOMAIN-GOVERNANCE-002)

| Domain | Governance role | Registry flag | Production approved |
|---|---|---|---|
| furlongpathways.com | **Primary public discovery** (Discovery Engine front door) | `canonicalCandidate: true` | **false** |
| furlonghub.com | **Institutional hub** (provider/broker/lender/partner/admin) | `hubCandidate: true` | **false** |
| compasstocapital.com | **Capital brand** (Financing Intelligence surface; Furlong-owned, NOT auto Five Borough; financing-neutral) | `capitalBrandCandidate: true` | **false** |
| compasstocapital.org | Defensive registration → redirect `compasstocapital.com` | `defensiveRegistration: true` | **false** |
| comapss2capital.com | Defensive typo → redirect `compasstocapital.com` | `defensiveRegistration: true` | **false** |
| comapss2capital.org | Defensive typo → redirect `compasstocapital.com` | `defensiveRegistration: true` | **false** |

**Matches doctrine ✅.** No founder-approved changes recorded since the
DOMAIN-GOVERNANCE-002 finalization. `compass2capital.com` confirmed NOT owned /
excluded. Canonical public-domain selection (furlongpathways.com) remains
**pending Caitlin's sign-off at DNS cutover** — not made here.

## PHASE 7 — DNS cutover preparation (DOCUMENT ONLY — do NOT change DNS)  ☐ OWNER

| Item | Value |
|---|---|
| Current authoritative DNS | ☐ (per Phase 1 DNS-provider column) |
| Future authoritative DNS | ☐ (GCP Cloud DNS / LB — per GCP runbook §8; gated) |
| Rollback DNS authority | ☐ (exported zone files from Phase 4 + low pre-cutover TTL) |
| Registrar access owners | Caitlin = Owner; Stuart = steward (multi-party; no unilateral change) |

**Success:** rollback path identified before any cutover is contemplated. (No
cutover occurs in this track.)

## PHASE 8 — Evidence package
This file IS the package index. Owner attaches the named evidence files
(screenshots/exports) alongside it in the owner-held evidence store
(not committed to the repo — they may contain account UI/PII).

| Artifact | Status |
|---|---|
| Phase 1 inventory (6 domains) | ☐ owner |
| Phase 2 MFA screenshots | ☐ owner |
| Phase 3 lock screenshots | ☐ owner |
| Phase 4 DNS inventory export | ☐ owner |
| Phase 5 email-security inventory | ☐ owner |
| Phase 6 domain-purpose | ✅ verified (this doc) |
| Phase 7 cutover/rollback notes | ☐ owner |

---

## Result / posture
**SEC-DNS-001 remains OPEN.** This track accumulates evidence and is ready for a
future closure review once the owner phases are complete and human-reviewed.
What actually closes SEC-DNS-001 (per `verify:domain-governance` /
`dnsGovernanceVerified()`): registrar locks + auto-renew + MFA verified, DNS
controls verified, canonical-domain sign-off, cert VALID on staging, nonce-CSP
hydration verified on the live edge, redirect strategy + rehearsed rollback
documented — all multi-party / human-reviewed. **No DNS change, no blocker
closure, no production activation in this pass.**
