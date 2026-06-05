# Classification Change Registry

Per VIA-GOVERNANCE-CLASSIFICATION-001. Records every classification change (tier or severity) that affects verification outcomes, gate behavior, audit reporting, or operational status.

Each CCR carries a machine-readable `ccr:meta` HTML-comment block (one `key: value` line per field) directly below its heading. The meta block is the canonical parse target for `build:self-report`, which emits the active entries into `build-self-report.json` (`classificationChangeRegistry.activeEntries[]`) and the `## Active Classification Changes` section of `build-self-report.md` on every run. The prose below each meta block is the human narrative; the two must agree. Required fields per entry: `id`, `title`, `status`, `previousState`, `newState`, `reason`, `approver`, `effectiveDate`, `resolutionCriteria`. `status` ∈ `ACTIVE | RESOLVED | VOIDED`. An ACTIVE entry missing any required field, or a malformed meta block, fails `build:self-report` closed. RESOLVED / VOIDED entries are emitted as historical and do not count as active.

---

## CCR-2026-001 — Build 38 Human Authority Severity Reclassification

<!-- ccr:meta
id: CCR-2026-001
title: Build 38 Human Authority Severity Reclassification
status: RESOLVED
previousState: Finding GATE_AUTHORITY_UNASSIGNED classified FAIL — contributed to self-report gate failure.
newState: Finding GATE_AUTHORITY_UNASSIGNED classified WARN / Operational Finding — reported but does not fail the build self-report gate.
reason: The finding represents operational governance state, not a software, configuration, implementation, security, or conformance defect; the platform implementation remains conformant.
approver: Founder Governance Review — approved by majority governance review.
effectiveDate: Build 38 (2026-06-04)
resolutionCriteria: Resolves when required authority assignments are recorded and verify:human-authority reports zero unfilled alpha-required authorities. Met at Build 39 — Vol VII Operational Annex populated; verify:human-authority exits 0.
-->

### Previous State
- Finding: `GATE_AUTHORITY_UNASSIGNED`
- Classification: **FAIL**
- Impact: contributed to self-report gate failure.

### New State
- Finding: `GATE_AUTHORITY_UNASSIGNED`
- Classification: **WARN / Operational Finding**
- Impact: reported as a finding but does not fail the build self-report gate.

### Reason for Change
The finding represents operational governance state rather than a software defect, configuration defect, implementation defect, security defect, or conformance defect. Unassigned authorities indicate required human role assignments have not yet been recorded in the operational roster. The platform implementation remains conformant.

### Governance Authority Approving Change
Founder Governance Review — approved by majority governance review.

### Effective Date
Build 38.

### Activation / Resolution Criteria
Finding automatically resolves when:
- Required authority assignments are recorded.
- `verify:human-authority` reports zero unfilled alpha-required authorities.

### Audit Notes
- No authority requirement was removed.
- No alpha-required authority was reclassified to HELD, DEFERRED, or BLOCKED_BY_DESIGN.
- Only the severity classification was changed.
- The underlying governance requirement remains active.

---

## CCR-2026-002 — Environmental Engineering Reviewer Reclassification (Step-3 assumption correction)

<!-- ccr:meta
id: CCR-2026-002
title: Environmental Engineering Reviewer Reclassification (Step-3 assumption correction)
status: ACTIVE
previousState: Role ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER classified ACTIVE_FILL (ASSUMED during Step-3 Annex projection; assumed holder Stuart Fraass).
newState: Role ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER classified HELD_FOR_ALPHA.
reason: Environmental review is deferred from Alpha (Module 21 deferred per the open §9 B4 decision, default deferred); Stuart cannot legally perform environmental engineering review, so the assumed fill was invalid; the role is correctly held, not filled. A held role requires no Alpha fill, so no gate green was bought.
approver: Founder Governance Review (2-of-3); independent review per VIA-AUDIT-EXCEPTION-001 (Stuart + Frances).
effectiveDate: Build 39 (2026-06-04) operational; formal ratification at Public Alpha ceremony.
resolutionCriteria: Activates only when both (a) an environmental workflow is featured in scope and (b) a qualified environmental reviewer is assigned. Regulated-competency single point of failure — only Caitlin currently qualifies.
-->

### Previous State
- Role: `ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER`
- Classification: **ACTIVE_FILL** (ASSUMED during Step-3 Annex projection; assumed holder: Stuart Fraass)

### New State
- Classification: **HELD_FOR_ALPHA**

### Reason for Change
Environmental review is deferred from Alpha. Environmental engineering review requires a qualified reviewer, and **Stuart cannot legally perform environmental engineering review** — so the assumed Stuart assignment was invalid. Caitlin currently holds the relevant qualification (Environmental & Compliance steward), but the capability is not active in Alpha. Environmental compliance (Module 21) is **deferred** from Public Alpha per the open §9 B4 decision (default: deferred). Therefore the role is correctly **held for Alpha** rather than filled. Reflects actual operational state per VIA-GOVERNANCE-CLASSIFICATION-001 — not a change made to pass a gate.

### Governance Authority Approving Change
Founder Governance Review (2-of-3); independent review per VIA-AUDIT-EXCEPTION-001 (Stuart + Frances).

### Effective Date
_[recorded at ceremony]_

### Activation / Resolution Criteria
Activates only when **both**: (a) an environmental workflow is featured in scope, **and** (b) a qualified environmental reviewer is assigned. NOTE: this is a regulated-competency single point of failure — only Caitlin currently qualifies; the Environmental & Compliance successor plan must account for this competency, not just governance continuity.

### Audit Notes
- A held role requires no Alpha fill, so the Alpha gate is unaffected (no green was bought by this change).
- The capability is genuinely deferred; the requirement is not removed, only dormant until activation.

---

## CCR-2026-003 — Regulatory Liaison Authority reclassification

<!-- ccr:meta
id: CCR-2026-003
title: Regulatory Liaison Authority reclassification
status: ACTIVE
previousState: Role REGULATORY_LIAISON_AUTHORITY classified ACTIVE_FILL (ASSUMED; holder Caitlin Hudson).
newState: Role REGULATORY_LIAISON_AUTHORITY classified HELD_FOR_ALPHA.
reason: Regulatory examination/response gates (Modules 40-41) are BLOCKED_BY_DESIGN in Alpha; zero alpha_required bindings require this role (audit: 0 alpha_required / 2 intentionally_held). The assumed active fill was invalid and over-concentrated Caitlin.
approver: Founder Governance Review (2-of-3); finalized at Build 39 commit.
effectiveDate: Build 39 commit (2026-06-04)
resolutionCriteria: Activates when regulatory examination/response capabilities activate (production/regulatory path).
-->

**Status:** **FINALIZED at Build 39 commit.** PR-review audit confirms `REGULATORY_LIAISON_AUTHORITY` participates in **zero** alpha_required bindings (audit: 0 alpha_required / 2 intentionally_held bindings — `auth-production-regulatory-examination`, `auth-production-regulatory-response`, both intentionally_held).

### Previous State
- Role: `REGULATORY_LIAISON_AUTHORITY`
- Classification: **ACTIVE_FILL** (ASSUMED; holder Caitlin Hudson)

### New State
- Classification: **HELD_FOR_ALPHA**

### Reason for Change
Regulatory Liaison governs the regulatory examination/response gates (Modules 40–41), which are BLOCKED_BY_DESIGN in Alpha. No alpha_required capability requires it; the assumed active fill was invalid and added unnecessary concentration to Caitlin. Reflects actual operational state per VIA-GOVERNANCE-CLASSIFICATION-001.

### Activation / Resolution Criteria
Activates when regulatory examination/response capabilities activate (production/regulatory path).

### Approver / Effective Date
Founder Governance Review (2-of-3); _[recorded on PR merge]_.

---

## CCR-2026-004 — Source Legal Authority reclassification

<!-- ccr:meta
id: CCR-2026-004
title: Source Legal Authority reclassification
status: ACTIVE
previousState: Role SOURCE_LEGAL_AUTHORITY classified ACTIVE_FILL (ASSUMED; holder Frances Fraass).
newState: Role SOURCE_LEGAL_AUTHORITY classified HELD_FOR_ALPHA.
reason: Source legal/licensing review (Module 23) and source promotion are held in Alpha; source-intelligence/scraper activation is blocked (live-fetch = 0); zero alpha_required bindings require this role (audit: 0 alpha_required / 7 intentionally_held). The assumed Frances assignment was also a domain mismatch.
approver: Founder Governance Review (2-of-3); finalized at Build 39 commit.
effectiveDate: Build 39 commit (2026-06-04)
resolutionCriteria: Activates when source legal/licensing review activates (source-promotion path).
-->

**Status:** **FINALIZED at Build 39 commit.** PR-review audit confirms `SOURCE_LEGAL_AUTHORITY` participates in **zero** alpha_required bindings (audit: 0 alpha_required / 7 intentionally_held bindings — source-legal-review, source-promotion-packets, live-scraper-activation, governance-connector-certification-review, source-ingestion-review, source-production-readiness-review, connectors-certification, all intentionally_held).

### Previous State
- Role: `SOURCE_LEGAL_AUTHORITY`
- Classification: **ACTIVE_FILL** (ASSUMED; holder Frances Fraass)

### New State
- Classification: **HELD_FOR_ALPHA**

### Reason for Change
Source legal & licensing review (Module 23) and source promotion are held in Alpha; source-intelligence/scraper activation is blocked (live-fetch = 0). No alpha_required capability requires it. The assumed Frances assignment was also a domain mismatch (source legal is not communications/public trust). Held until source promotion activates.

### Activation / Resolution Criteria
Activates when source legal/licensing review activates (source-promotion path).

### Approver / Effective Date
Founder Governance Review (2-of-3); _[recorded on PR merge]_.

---

## DOCUMENT_VERIFICATION_REVIEWER scope confirmation (no CCR — stays ACTIVE_FILL → Stuart)

Not a reclassification. PR-review audit confirms scope is borrower-document completeness/escalation only:

| Binding | Action | Scope |
|---|---|---|
| `auth-document-evidence-reconciliation-review` | process document evidence reconciliation finding | completeness/escalation review (no control verification, no audit certification) |
| `auth-portal-borrower-documents-review` | review borrower documents portal posture | posture review (no control verification, no audit certification) |

Stays **ACTIVE_FILL → Stuart Fraass**. The ASSUMED tag is dropped; confirmation recorded in `docs/AUTHORITY_ASSIGNMENT_REGISTRY.md`.
