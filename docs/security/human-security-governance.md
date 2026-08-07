# Human Security Governance (groups C/D/E)
Status: ALPHA_PENDING. Code mirror: securityGovernanceVerification.ts, humanVerificationPolicy.ts,
securityIncidentRunbook.ts.

## Founder protection invariants (enforced in code + tested)
- No single founder can: change production permissions · rotate master credentials · disable audit/
  replay/security/governance runtime · export sensitive financial/PII records. (Quorum ≥2; control-
  disable = ALL founders.)
- Stuart = financial STEWARD, not unilateral override: financial high-risk / treasury / financial export
  require Stuart + at least one additional founder. Stuart alone is always refused.

## Founder procedures (executable via the incident runbook)
- Compromise: forensicLockdown → globalSessionRevocation → treasuryFreeze → multi-party key rotation.
- Account lockout: disable the IdP identity (IAP), revoke sessions, multi-party re-enable.
- Emergency recovery: multi-party master-credential rotation; restore from tested backup only.
- Incapacitation/succession: a surviving founder + the institution's designated successor reach quorum;
  no single party gains unilateral control. (Constitutional — confirm wording with counsel.)
- Security-event escalation: every refusal/critical event is a hash-chained security event surfaced on
  the dashboard.

## Social-engineering policy (group D)
- Two-channel verification for ALL high-risk requests (access, password/MFA, money/wire, keys, exports,
  permissions, production changes, vendor). Urgency = RED FLAG, never a reason to skip verification.
- Email cannot authorize an email-originated sensitive request. Second channel must be phone/video/
  in-person/passkey-signed and DIFFERENT from the origin channel.
- Every high-risk approval records verifier + channel + timestamp + rationale + audit reference.
- Human-security-trap tests simulate: urgent access request, fake wire, fake password/MFA reset, fake
  vendor — all must be REFUSED without out-of-band verification.

## Treasury / financial (group E)
Multi-party approval for movements + financial-data exports · emergency freeze · anomaly events · key
custody (multi-party) · NO payment/card data stored, PCI processor only · financial module access
logged + replayable (module is counsel-gated; pattern ready).

## Breach notification — REQUIRES COUNSEL (placeholder)
On a confirmed breach involving PII, counsel determines notification obligations per regime (state laws,
GLBA). This is NOT automated; it is a human + legal step. Placeholder only.
