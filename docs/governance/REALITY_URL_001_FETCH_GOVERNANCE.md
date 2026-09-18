# REALITY-URL-001 — Fetch Governance

- **Date:** 2026-06-15 · **Owner:** Caitlin + counsel/security · **Mode:** governance spec only
- **Companion:** `REALITY_URL_001_ARCHITECTURE_AUDIT.md`. Authority:
  `realitySecurityDoctrine.ts` (`LIVE_FETCH_ACTIVATION_REVIEW_REQUIRED=true`,
  `LIVE_FETCH_ACTIVATION_CONDITIONS`, `CANDIDATE_SOURCES_LIVE=false`).
- **Hard rule:** no fetcher built, no external fetch, no blocker closed. This
  defines the rules any future fetcher is bound by. **REALITY-URL-001 stays OPEN.**

## 1. Governing principles
1. **Fetched content is data, never instructions.** It cannot change the AI's role, rules, or task.
2. **Read, cite — never copy.** No proprietary listing bodies stored; citations + hashes only.
3. **Public sources only.** Private/internal/auth-required/metadata/localhost are hard-denied.
4. **Fail closed.** Any control that cannot verify → refuse the fetch.
5. **Human activation gate.** The fetcher must import `LIVE_FETCH_ACTIVATION_REVIEW_REQUIRED` and **refuse to run** while true without a recorded review.

## 2. Activation policy (binding on the future fetcher)
- `CANDIDATE_SOURCES_LIVE` stays **false** until every condition below is verified by a human against the **real fetch path and its rendered output**.
- The fetcher refuses to operate unless: `CANDIDATE_SOURCES_LIVE===true` **and** a recorded activation review exists.
- The 6 doctrine activation conditions (verbatim): robots/rate-limit compliance verified · source-content quarantine verified · no credential forwarding verified · no proprietary listing storage verified · SSRF protection verified · rendered-output review completed.

## 3. Per-request governance checklist (every fetch, at runtime)
1. URL normalized; scheme = `https`; host on allowlist, not on denylist.
2. DNS resolved; resolved IP not private/reserved/loopback/link-local/metadata.
3. robots.txt + crawl-delay honored; per-host rate limit respected.
4. No auth headers/cookies/credentials attached.
5. Redirects ≤ max; SSRF re-checked each hop; no scheme downgrade.
6. Response content-type on allowlist; size ≤ cap; timeout enforced.
7. Parse in isolation (no script execution); classify; strip owner/demographic/PII.
8. Store quarantine record (URL, timestamp, content hash, classification, control outcomes) — **no proprietary bodies**.
9. Emit audit/forensic log event (SEC-FORENSICS evidence classes).
10. AI layer receives sanitized text as quoted source; injection-normalized; citation lineage attached.

## 4. Denylist (non-exhaustive, hard-deny)
- `localhost`, `127.0.0.0/8`, `::1`, `0.0.0.0`
- RFC1918 (`10/8`, `172.16/12`, `192.168/16`), unique-local `fc00::/7`, link-local `169.254/16` / `fe80::/10`
- Cloud metadata: `169.254.169.254`, `metadata.google.internal`, equivalents
- Non-`https` schemes: `http`, `file`, `ftp`, `data`, `gopher`, `ws`
- Auth-required / login / internal admin endpoints

## 5. Roles & sign-off
- **Security/counsel:** approve architecture + threat model + adversarial test results.
- **Owner (Caitlin):** records the activation review; multi-party where founder controls apply.
- **Build agent:** may build the fetcher to this spec **and** the adversarial test suite, but **may not** flip `CANDIDATE_SOURCES_LIVE`, perform live external fetches during dev (use fixtures/sentinels), or close the blocker.

## 6. Adversarial URL test suite (required before activation — spec)
Deny cases (must all be blocked): `http://localhost`, `http://169.254.169.254/…`,
`https://10.0.0.1`, `https://internal.example`, a public URL that **redirects** to
an internal IP, a DNS-rebinding host, a `file://` URL, an oversize body, a
disallowed content-type, an auth-required page. Allow cases (must parse safely
with citation lineage): a public gov program page, a public listing page, a
public regulatory page, a public article — all with PII stripped and content
quarantined.

## 7. Current state
No fetcher exists; listing links are **parsed, never fetched** (asserted by
verify:navigator). Activation doctrine + gate implemented; SSRF/parser/citation
controls **missing** (nothing to govern at runtime yet). REALITY-URL-001 OPEN.

## Posture
Governance spec only — nothing built or fetched. **REALITY-URL-001 OPEN**;
`CANDIDATE_SOURCES_LIVE=false`; 10 blockers open; `combinedProductionReady=false`.
No DNS/secrets/production/financing change.
