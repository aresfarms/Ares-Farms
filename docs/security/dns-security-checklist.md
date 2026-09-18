# DNS Security Checklist — DOMAIN-ASSET-001

**Status:** ALPHA_PENDING. Manual founder attestation required — do not assume any item is done.

Run this per domain before any production DNS cutover. Record the reviewer, date, and evidence;
update `last_reviewed_at` / `reviewed_by` and the attestation fields in
[`domainAssetManifest.ts`](../../src/security/domainAssetManifest.ts).

## Registrar account
- [ ] MFA/passkeys enabled (no SMS-only).
- [ ] Auto-renew enabled.
- [ ] Transfer lock / registrar lock enabled.
- [ ] WHOIS privacy enabled (where legally available).
- [ ] Contact records current.
- [ ] Recovery methods documented; not solely held by one founder.

## DNS zone hygiene
- [ ] No wildcard (`*`) records without explicit, recorded review.
- [ ] No unused subdomains pointing at abandoned services.
- [ ] No dangling CNAMEs (target still exists and is controlled by us).
- [ ] No stale verification TXT records unless still required.
- [ ] Nameservers recorded in the manifest.
- [ ] Every change has an audit entry and is reviewable.

## Email authentication (sending domains)
- [ ] SPF present and correct.
- [ ] DKIM configured.
- [ ] DMARC published — **begin in `p=none` (monitoring)**, then move to `quarantine`, then `reject`
      once validated.
- [ ] Non-sending domains: consider a null SPF + DMARC reject to prevent spoofing.

## Production cutover gates (all must hold)
- [ ] Founder multi-party approval recorded for any DNS authority change.
- [ ] GCP deployment review complete (Cloud Run / LB / managed SSL).
- [ ] Security hardening review complete.
- [ ] Human approval recorded for the cutover.
- [ ] No public PII workflow enabled by the cutover alone.

Until every box is checked and attested, production DNS cutover remains **blocked**.
