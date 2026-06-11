# Platform Security Hardening — Master (FortKnox)
Status: SECURITY_HARDENING_GOVERNANCE = ALPHA_PENDING. Not merged. Not production-ready.

Canonical machine mirror: src/security/securityHardeningManifest.ts (controls A–N, each VERIFIED
implemented | partial | doctrine-only | missing | required-external + evidence). The build cannot
self-declare readiness; gate requires all Alpha-blocking controls IMPLEMENTED + a human review flag.

## Architecture threat picture
Public anonymous storefront · operator wall (/internal, NextAuth, Module 45) · governed external
ingestion (gov feeds + future broker submissions) · append-only governance ledgers · anonymous-token
consent core · future PII modules (counsel-gated) · AI-assisted ingestion · supply chain (npm/Cloud Run).

## What is REAL today (implemented + tested)
Deny-by-default perimeter + rate limiting · CSRF on server actions · security headers (next.config) ·
hash-chained audit ledger (tamper detection) · consent tokens hashed at rest + PII-write DLP · ingest
sanitization before store+render · AI prompt-injection screen · multi-party founder governance (quorum,
all-founder control-disable, Stuart-as-steward) · two-channel high-risk verification · incident switches
(freeze/lockdown/revoke/intake-disable) · honeytokens · security dashboard · secret/SCA/SBOM CI.

## What is PARTIAL / DOCTRINE / MISSING (with blocking production gates)
MFA/step-up (IdP/IAP) · session revocation invalidation · role separation at IAM · PII encryption at
rest (no PII yet) · bot protection · image scanning + signed provenance · backup/restore drills ·
breach-notification (COUNSEL). All carry blockingForProduction=true in the manifest.

## External, cannot be done in-house (block production)
Third-party penetration test · GLBA/security audit · red-team. Production stays blocked until critical/
high findings are remediated and retested.
