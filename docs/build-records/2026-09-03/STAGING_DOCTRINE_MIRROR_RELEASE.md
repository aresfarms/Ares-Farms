# Staging Doctrine-Mirror Release — 2026-09-03

Status: DEPLOYED AND VERIFIED IN STAGING. Production remains blocked.

- Source commit: `348f6b2` (`align runtime verifier with direct vpc cold starts`).
- Governed Cloud Build: `e1971102-9ac1-4ed4-8a28-c5e5c936edde` — SUCCESS.
- Core digest: `sha256:593b50afe7ad78ff2bf145ae674c17e45e1e182e397cc77805c21d23922a111f`.
- Migrator digest: `sha256:ab418e4d1e93ebc154424bcdad8c35adbb3b2fb0e4c0c970108c3e55c15af46e`.
- Scanner digest: `sha256:3db57045d40c441a31a936a464ff4aaa93d978280416d81a5b640237b0d63489`.
- On-demand scans: all three final digests = 0 HIGH, 0 CRITICAL, 0 UNASSESSED.
- Binary Authorization: one `furlong-release-approval` attestation verified for each final digest.
- Migration execution: `furlong-db-migrate-pp7dl` — SUCCESS; migrations 0054 and 0055 applied; canonical set = 49 files.
- Runtime grants: DML-only; runtime owns no objects and has no schema CREATE authority.
- Runtime privilege proof: `furlong-runtime-verify-nvs46` — PASS, 11/11 checks, 0 failures.
- Core revision: `furlong-core-00420-wrq` — Ready, 100% traffic, final core digest.
- Scanner revision: `furlong-scanner-00020-9l8` — 100% traffic, final scanner digest.
- Scanner verification: `furlong-scanner-security-verify-rf4dv` — SUCCESS.
- Stripe webhook revision: `furlong-stripe-webhook-00005-wm9` — Ready, 100% traffic, final core digest.
- Webhook unsigned control probe: HTTP 400 `Missing stripe signature`; governance guard executed.
- IAP explicitly reasserted on core after image promotion; unauthenticated `/sign-in` returns Google OAuth 302.
- IAP accessors include Caitlin Hudson and Stuart Fraass; the IAP service agent retains Run invoker authority.
- Authenticated `/health/live` = HTTP 200 `{ok:true}`.
- Authenticated `/health/ready` = HTTP 200 `{ok:true,ready:true}` proving runtime DB connectivity.
- Authenticated `/professional-access` = HTTP 200 on the new revision.
- Live professional surface separates Commercial Debt Broker from Funding Lender and truthfully marks unfinished professional lanes closed.
- `/lender-desk` correctly redirects an unauthenticated application session to `/sign-in?callbackUrl=%2Flender-desk`.
- Master Volume mirror: 0 unregistered and 0 unreconciled doctrine IDs; 53 doctrines remain truthfully partial or awaiting controlled promotion.
- Borrower financial controls and institutional assurance conformance both PASS; live payment capture remains separately gated.
