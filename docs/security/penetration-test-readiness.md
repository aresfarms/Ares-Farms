# Penetration-Test Readiness (group N)
Status: ALPHA_PENDING. Production BLOCKED until a third-party pentest's critical/high findings are
remediated AND retested.

## In scope for testers (with written scope agreed first)
- Public surface (storefront, forms, APIs) — XSS/CSRF/injection/rate-limit/bot.
- Operator wall (/internal,/admin,/operator) — auth bypass, role escalation, step-up bypass.
- API perimeter — deny-by-default, IDOR, mass assignment.
- Module isolation / PII separation — can core resolve token→identity? can one module read another?
- Ledger + replay — tamper detection, unauthorized replay, audit immutability.
- AI / source ingestion — prompt injection, poisoned-feed rendering, circuit breaker.
- Cloud infrastructure (GCP) — IAM least-privilege, private DB, secret access, Cloud Armor.
- Social-engineering boundaries — the two-channel policy (with consent; no real founder targeting without sign-off).

## Out of scope / rules of engagement
No real borrower PII (none exists). No production data exfiltration. No DoS beyond agreed limits.
Honeytokens are live — touching them is expected to alert.

## Required deliverables before "remediated"
Written scope (pre-test) · executive report · technical report · reproduction steps · severity ratings ·
remediation plan · RETEST confirming critical/high closed. Only then does the production blocker lift —
and the GLBA/security audit is a SEPARATE required gate before real PII.
