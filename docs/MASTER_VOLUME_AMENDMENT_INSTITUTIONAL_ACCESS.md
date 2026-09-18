# Master Volume Series Amendment — Institutional Evidence Access, ABAC, and Compelled Disclosure

**Amendment ID:** MV-AMD-2026-07-26-INSTITUTIONAL-ACCESS-001  
**Status:** Active attributed governance amendment  
**Authority:** Human governance direction recorded during the controlled-promotion sequence  
**Applies to:** Volumes I, II, III, III-B, IV, V, VI, and VII

## Constitutional Rule

No attorney, auditor, governmental official, examiner, agency representative, or other institutional reviewer receives data authority from role, title, email domain, uploaded paperwork, credential possession, anonymous-token possession, or professional standing alone.

Institutional data access requires all of the following:

1. authenticated principal identity;
2. independently verified professional or official credential;
3. an opaque verification token bound to that exact principal, email, legal name, and role;
4. independently corroborated client, agency, examination, engagement, or legal-process authority;
5. an explicit matter, tenant, subject, module, purpose, action, jurisdiction, and time scope;
6. a current per-request ABAC decision;
7. field-level minimum-necessary disclosure before payload construction;
8. immutable access, denial, verification, export, and closure evidence.

Professional credential numbers, identification scans, masked suffixes, hashes, HMACs, or other derivatives of the credential number may not be persisted after the authoritative verification request completes. Furlong retains only the independently issued verification result and a random opaque platform token bound to the verified principal.

## Volume I — Authority and Separation of Duties

- Identity, professional standing, and matter authority are separate proofs.
- A single actor may not both validate compelled-disclosure authority and approve security release.
- Institutional verification tokens are non-transferable.
- Uploaded documents are evidence to evaluate, never self-authenticating authority.

## Volume II — Regulatory and Legal Disclosure

- Every disclosure must satisfy purpose limitation and minimum-necessary scope.
- Legal hold and disclosure authority are separate states.
- A legal hold prevents deletion or alteration but does not authorize access.
- Notice may be required, delayed, prohibited, or pending legal review; delayed or prohibited notice requires a scheduled review.

## Volume III / III-B — Technical and Runtime Enforcement

- RBAC selects a lane only; ABAC governs each request.
- Authorization attributes include principal, role, credential receipt, authority receipt, matter, tenant, subject, module, purpose, action, classification, jurisdiction, consent, legal-hold state, time window, and step-up authentication.
- Unauthorized fields must be removed before packet, hash, timeline, API response, or export construction.
- Successful decisions issue only short-lived, scope-bound capability tokens.
- Exports require step-up authentication.

## Volume IV — Operational Ceremony

- Credential and authority must be rechecked at onboarding, new matter creation, sensitive export, expiration, identity change, anomaly, and compelled-disclosure initiation.
- Compelled disclosure requires verified process, scope manifest, legal hold, independent legal and security approvals, selector-bound release, immutable event logging, automatic expiry, and post-access review.
- Original grant issuers may not independently close their own surveillance findings.

## Volume V — Canonical Doctrines

This amendment extends classification, consent, sovereignty, purpose limitation, controlled disclosure, replay, observability, explainability, and human authority doctrines to every institutional review request.

## Volume VI — Integration

Institutional portals and evidence packets must consume the canonical credential, authority, ABAC, disclosure-ceremony, and surveillance runtimes. Parallel role-only or query-string authority paths are prohibited.

## Volume VII — Conformance Proof

Mandatory proof commands:

- `npm run verify:institutional-credential-verification`
- `npm run verify:institutional-legal-authority`
- `npm run verify:institutional-abac-disclosure`
- `npm run verify:compelled-disclosure-ceremony`
- `npm run verify:institutional-access-surveillance`
- `npm run verify:governed-evidence-review-portal`

Cloud Build must fail before image construction if any required artifact or verifier is absent.
