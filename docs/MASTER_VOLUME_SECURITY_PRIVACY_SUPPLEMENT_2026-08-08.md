# Master Volume Security & Privacy Supplement — 2026-08-08

**Status:** Current-build supplement; does not supersede the Master Volume Series.  
**Scope:** Security, privacy, identity, access, document provenance, payment/Plaid controls, domains, resilience, and post-update verification.  
**Authority:** Master Volume Series + current governed repository implementation.  

## 1. Purpose
This supplement reconciles the Master Volume governance stack with the security/privacy controls implemented during the 2026-08-06 through 2026-08-08 build cycle. It preserves the constitutional rule that the build cannot self-certify production readiness.

## 2. State separation
- **Repository/build:** current controls may be verified from code, migrations, CI policy, and conformance scripts.
- **Local portal:** stopped by the 2026-08-08 macOS update and requires restart before local UI verification.
- **Staging:** independently re-verified after Google Cloud re-authentication. `furlong-core` is healthy and 100% traffic remains on revision `furlong-core-00381-v4k`; later August 7-8 zero-trust and Plaid privacy controls are implemented in the repository but are not yet deployed to that revision.
- **Production:** remains blocked pending the applicable human, external, resilience, DNS, legal, and security gates.

## 3. Controls materially advanced in this build cycle
- Versioned, purpose-specific consent and action-gated authorization.
- Consumer data-rights workflows for access, export, correction, restriction, deletion, and human review.
- Per-file upload attestation plus document chain-of-custody and exact-byte cryptographic hashing.
- Malware quarantine/scanning before document visibility or downstream signing workflows.
- Professional-access boundaries and provider-neutral identity-evidence architecture.
- Stripe payment provenance, fraud decisioning, 3DS policy, and governed Stripe Connect onboarding.
- Zero-trust joiner/mover/leaver lifecycle with per-user session-version revocation.
- Passkey/WebAuthn MFA for privileged roles; SMS-only MFA is not an accepted privileged method.
- Per-user local password hashing using scrypt; no password is stored plaintext.
- Plaid restricted-data persistence uses ciphertext-only records with per-record AES-256-GCM envelope encryption; the master wrapping key is held in Secret Manager and is not stored in PostgreSQL.
- Plaid-specific consent, retention, provider-revocation, and cryptographic purge controls were added to the governed privacy runtime.
- Vulnerability management now includes CodeQL/SCA/secret scanning, Trivy filesystem and container-image scanning, SBOM generation, PR security gates, and a scheduled macOS endpoint posture scanner for enrolled endpoints.
- Public privacy and data-retention policies are published over HTTPS on the isolated GitHub Pages policy surface; production application domains remain launch-gated.

## 4. Verified staging state at 2026-08-08 review
- Google Cloud account re-authenticated successfully as the authorized Ares Farms operator.
- `furlong-core` latest ready revision is `furlong-core-00381-v4k` and receives 100% current traffic.
- `furlong-scanner`, `furlong-stripe-webhook`, and the isolated `furlong-public-privacy` service are deployed.
- The serving core revision predates the later passkey/MFA, per-user password, cleaned standalone security pages, and Plaid encrypted-store/privacy commits. Those controls are repository-implemented but require schema/runtime promotion before they may be represented as deployed staging controls.
- `QUARANTINE_MODE=off` remains a transitional staging setting; document-signing paths separately require clean scanner evidence, but global fail-closed quarantine is not yet certified.
## 5. Remaining production blockers
The following remain intentionally open and are not waived by this supplement:
- Apply and verify governance migrations `0050` through `0052` before promoting the dependent zero-trust and Plaid runtime.
- Complete staging smoke tests for passkey enrollment/verification, session revocation, password first-factor flow, and Plaid encryption/deletion lifecycle.
- Complete organization-wide enrollment of every in-scope employee/contractor endpoint in the vulnerability/patch posture program.
- Complete immutable backup provisioning plus restore testing and recovery certification.
- Complete DNS/registrar security review, including registrar-account MFA/passkey attestation, before production-domain cutover.
- Complete provider/vendor security, privacy, residency, termination, signing-provider, lender-delivery, and environmental-adapter certifications applicable to live workflows.
- Transition quarantine from the current staging transitional posture to certified fail-closed enforcement before live document reliance.
- Complete external penetration testing, GLBA/security review, red-team/social-engineering review, and required remediation/retest.
- Fill the independent production Security Authority/certification function; the technical builder/steward does not independently certify all controls she built.

## 6. Plaid questionnaire posture
Plaid questionnaire responses must distinguish implemented controls from deployment status. TLS/HTTPS transport, consent/data-rights governance, the privacy and retention policies, secure secret handling, CI vulnerability scanning, and the Plaid ciphertext-only storage design are implemented. The encrypted Plaid runtime may be represented as deployed only after migrations, Secret Manager injection, and staging conformance are verified together.
## 7. Recommended next hardening sequence
1. Promote the verified schema prerequisites and then deploy the zero-trust/Plaid runtime to staging.
2. Run targeted staging smoke tests and rollback if any access-control or encrypted-storage invariant fails.
3. Remove/deprecate the legacy shared-secret fallback after per-user first-factor and passkey flows are proven in staging.
4. Complete provider-neutral identity binding with Stripe Identity as the active proofing adapter without storing raw identity documents.
5. Bind payment-risk authorization to provider-neutral identity evidence rather than the older ID.me-specific metadata field.
6. Complete endpoint enrollment, backup/restore certification, quarantine fail-closed certification, and external security reviews before production activation.

## 8. Security responsibility and separation of duties
Caitlin Hudson is the current Technical Infrastructure Steward and Governance Authority and is the monitored staging security contact at `chudson@aresfarmsinc.com`. The formal independent production Security Authority certification seat remains deliberately unfilled. This preserves the Master Volume requirement that the builder of security controls cannot unilaterally certify those same controls for production reliance.

## 9. Constitutional posture preserved
This supplement does not activate production, waive human review, authorize live credit decisions, authorize government determinations, permit public PII reliance, or satisfy external penetration/audit obligations by assertion. Unverified controls remain unverified; partial controls remain partial; external gates remain external.
