# REALITY-URL-001 — Architecture & Safety Audit

- **Date:** 2026-06-15 · **Owner:** Caitlin + counsel/security · **Mode:** specification + audit only
- **Authority in code:** `src/security/realityPlatform/realitySecurityDoctrine.ts`
  (`REALITY_SECURITY_BLOCKERS["REALITY-URL-001"]=false`, `CANDIDATE_SOURCES_LIVE=false`,
  `LIVE_FETCH_ACTIVATION_REVIEW_REQUIRED=true`, `LIVE_FETCH_ACTIVATION_CONDITIONS`).
  Companion: `REALITY_URL_001_FETCH_GOVERNANCE.md`.
- **Hard rule:** **no live fetcher built, no external fetch performed, no blocker
  closed.** This is the architecture spec the *future* fetcher must satisfy.
  **REALITY-URL-001 stays OPEN.**

> Today there is **no live URL fetcher**. `CANDIDATE_SOURCES_LIVE=false` and the
> doctrine requires a human activation review. This document defines what a safe
> fetcher must be before it could ever be turned on.

## 1. Intended use cases
| Use case | Allowed? | Notes |
|---|---|---|
| User-supplied **public** URL (paste a page to discuss) | allowed (governed) | treated as **data, never instructions**; parsed, never obeyed |
| Government **program** URL (e.g. agency program page) | allowed | citation lineage required |
| Public **property listing** URL | allowed (read-only) | **no proprietary listing storage** — cite, don't copy |
| Public **regulatory source** URL | allowed | citation lineage required |
| Public **news/article** URL | allowed | summarize ≤ fair-use; cite |
| **Prohibited:** private/internal/auth-required/localhost/metadata/non-public URLs | **forbidden** | hard-denied by SSRF + allowlist controls (§3/§4) |

The single allowed question stays `"What is realistically possible here?"`; the
fetcher never answers the forbidden questions (ownership, demographics, "steal
this listing", "ignore your rules", "guarantee this").

## 2. Trust boundaries
1. **User input** — untrusted. A URL is a *request to fetch*, not a command.
2. **Fetch service** — isolated egress-controlled component; the only thing allowed to make the outbound request; enforces SSRF/allowlist/limits.
3. **Parser** — isolated; converts bytes → structured text; no code execution, no script/JS evaluation.
4. **Classifier** — labels content (program / listing / regulatory / news / unknown); strips owner/demographic fields.
5. **Storage** — content quarantine: hashes + citations + classification, **never** proprietary listing bodies; retention-bounded.
6. **AI reasoning layer** — receives **sanitized, classified** text only; treats it as quoted source data; injection-normalized (shares the adversarial-normalization layer); cannot be re-instructed by fetched content.

Boundary rule: data flows **inward only** (fetch → parse → classify → sanitize → reason); no boundary may forward credentials or raw untrusted bytes to the AI layer.

## 3. Threat model
| Threat | Mitigation (required) |
|---|---|
| SSRF | resolve + pin IP; **deny** private/reserved/loopback/link-local ranges; re-check on every redirect |
| Internal-network access | egress allowlist; no RFC1918/unique-local; DNS-rebinding guard |
| Localhost access | deny `localhost`/127.0.0.0/8/::1 |
| Metadata endpoint access | hard-deny 169.254.169.254 + cloud metadata hosts |
| Credential leakage | **no credential forwarding**; strip auth headers/cookies; no following to auth-required pages |
| Malware delivery | content-type allowlist (text/html, text/plain, application/json, pdf); size cap; no execution |
| Prompt injection | fetched text is data; adversarial-normalize; AI layer cannot be re-instructed |
| Hidden instructions | strip/escape; never elevate fetched content to instruction role |
| Excessive crawling | per-host rate limit; single-page fetch (no recursive crawl) |
| robots violations | honor robots.txt + crawl-delay |
| Privacy violations | classifier strips owner/demographic/PII fields before storage or reasoning |

## 4. Required controls (the fetcher MUST implement all)
- **Allowlist/denylist** — scheme + host allowlist; explicit denylist (internal/metadata/auth).
- **Protocol restriction** — `https` only (no `http`/`file`/`ftp`/`data`/`gopher`).
- **Size limit** — hard byte cap; abort on exceed.
- **Timeout limit** — short connect + total timeout.
- **Redirect limit** — small max; re-run SSRF checks per hop; no cross-scheme downgrade.
- **Content-type restriction** — allowlist only; reject others.
- **Fetch isolation** — egress-controlled service identity, no app secrets, least privilege.
- **Parser isolation** — no script execution; sandboxed parse; bounded memory/time.
- **No credential forwarding** — strip auth; never attach cookies/tokens.
- **Audit logging** — every fetch logged to the forensic/audit ledger (SEC-FORENSICS classes).
- **Citation lineage** — every reasoned claim traces to source URL + retrieval record.

## 5. Evidence model (recorded per fetch)
- source URL (normalized)
- retrieval timestamp
- content hash (sha256 of fetched bytes)
- classification result (program/listing/regulatory/news/unknown + PII-stripped flag)
- citation chain (claim → quoted span → source record)
- control outcomes (SSRF check passed, robots honored, size/type within limits)

## 6. Closure evidence for REALITY-URL-001
Maps to `LIVE_FETCH_ACTIVATION_CONDITIONS` + human review:
- [ ] **Architecture approved** (this doc + governance doc, reviewed).
- [ ] **SSRF protections verified** against an adversarial URL suite (private/loopback/metadata/redirect-to-internal/DNS-rebind all blocked).
- [ ] **Parser protections verified** (no script exec; size/type/timeout enforced).
- [ ] **Citation lineage verified** (every claim traces to a source record).
- [ ] **Adversarial URL test suite passed** (the deny cases blocked; allow cases parsed safely).
- [ ] robots/rate-limit compliance verified · source-content quarantine verified · no credential forwarding verified · no proprietary listing storage verified · rendered-output review completed (the 6 doctrine conditions).
- [ ] **Human activation review** recorded → only then may `CANDIDATE_SOURCES_LIVE` flip and `REALITY-URL-001` close. Never automatic.

## 7. Current-state classification
| Element | State |
|---|---|
| Live URL fetcher | **missing** (none built; `CANDIDATE_SOURCES_LIVE=false`) |
| Activation doctrine + gate (`LIVE_FETCH_ACTIVATION_*`) | **implemented** (doctrine constants + verify:reality-security) |
| Listing-link handling on Navigator | **partially implemented** — links are **parsed, never fetched** (verify:navigator asserts "listing links parsed, never fetched") |
| Adversarial-normalization (injection) | **implemented** (shared normalizer; break-me/red-team coverage) |
| SSRF / egress controls | **missing** (no fetcher to control yet) |
| Parser/classifier isolation | **missing** |
| Citation-lineage recorder | **missing** |
| Forbidden-question refusals | **implemented** (doctrine + navigator gates) |

## Posture
Spec/audit only. **REALITY-URL-001 OPEN**; `CANDIDATE_SOURCES_LIVE=false`;
10 blockers open; `combinedProductionReady=false`. No fetcher built, no external
fetch, no DNS/secrets/production/financing change.
