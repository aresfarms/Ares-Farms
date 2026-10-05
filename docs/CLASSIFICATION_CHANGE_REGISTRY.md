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
approver: Owner-controlled governance transition.
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
Owner-controlled governance transition.

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
status: RESOLVED
previousState: Role ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER classified ACTIVE_FILL (ASSUMED during Step-3 Annex projection; assumed former placeholder holder).
newState: Role ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER classified HELD_FOR_ALPHA.
reason: Environmental review is deferred from Alpha (Module 21 deferred per the open §9 B4 decision, default deferred); the former placeholder holder was not qualified to perform environmental engineering review, so the assumed fill was invalid; the role is correctly held, not filled. A held role requires no Alpha fill, so no gate green was bought.
approver: Owner-controlled governance transition; independent review per VIA-AUDIT-EXCEPTION-001 (independent review posture now superseded by AAR-2026-003).
effectiveDate: Build 39 (2026-06-04) operational; formal ratification at Public Alpha ceremony.
resolutionCriteria: Activates only when both (a) an environmental workflow is featured in scope and (b) a qualified environmental reviewer is assigned. Regulated-competency single point of failure — only Caitlin currently qualifies.
-->

### Previous State
- Role: `ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER`
- Classification: **ACTIVE_FILL** (ASSUMED during Step-3 Annex projection; former placeholder holder)

### New State
- Classification: **HELD_FOR_ALPHA**

### Reason for Change
Environmental review is deferred from Alpha. Environmental engineering review requires a qualified reviewer, and the former placeholder holder was not qualified to perform environmental engineering review — so the former person-bound assignment was invalid. Caitlin currently holds the relevant qualification (Environmental & Compliance steward), but the capability is not active in Alpha. Environmental compliance (Module 21) is **deferred** from Public Alpha per the open §9 B4 decision (default: deferred). Therefore the role is correctly **held for Alpha** rather than filled. Reflects actual operational state per VIA-GOVERNANCE-CLASSIFICATION-001 — not a change made to pass a gate.

### Governance Authority Approving Change
Owner-controlled governance transition; independent review per VIA-AUDIT-EXCEPTION-001 (independent review posture now superseded by AAR-2026-003).

### Effective Date
_[recorded at ceremony]_

### Activation / Resolution Criteria
Activates only when **both**: (a) an environmental workflow is featured in scope, **and** (b) a qualified environmental reviewer is assigned. NOTE: this is a regulated-competency single point of failure — only Caitlin currently qualifies; the Environmental & Compliance successor plan must account for this competency, not just governance continuity.

### Audit Notes
- A held role required no Alpha fill while the environmental workflow was genuinely deferred.
- This entry records the June correction only; it no longer describes current Alpha scope.

### Resolution / Supersession
**RESOLVED by CCR-2026-005.** The named governance authority recorded the Public Alpha §9 decision on August 11, 2026 to FEATURE Environmental Compliance in Alpha. CCR-2026-005 preserves the new state without pretending the independent reviewer or founder-quorum activation prerequisites have been satisfied.

---

## CCR-2026-005 — Environmental Compliance Featured-Scope Reconciliation

<!-- ccr:meta
id: CCR-2026-005
title: Environmental Compliance Featured-Scope Reconciliation
status: ACTIVE
previousState: Module 21 environmental compliance deferred from Public Alpha; ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER held under CCR-2026-002.
newState: Module 21 is FEATURED in Public Alpha; technical activation remains blocked pending a qualified independent environmental reviewer and required 2-of-3 founder sign-off.
reason: The signed Public Alpha decision recorded 2026-08-11 supersedes the earlier default-defer posture. No reviewer fill is claimed. Caitlin holds the relevant qualification but is the builder and deciding founder, so she may not self-clear the independent technical-review requirement.
approver: Owner scope decision recorded by Caitlin L. Hudson, PhD, PE on 2026-08-11; independent ceremony review remains pending.
effectiveDate: Owner scope decision recorded 2026-08-11; workflow activation remains pending its independent-review prerequisites.
resolutionCriteria: Assign a qualified independent environmental reviewer and record the required 2-of-3 founder sign-off; then remove the held operational role posture and re-run Public Alpha launch reconciliation.
-->

### Previous State
- Module 21 Environmental Compliance: **deferred from Public Alpha**.
- `ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER`: **HELD_FOR_ALPHA** under CCR-2026-002.

### New State
- Module 21 Environmental Compliance: **FEATURED in Public Alpha** by the signed August 11, 2026 owner decision.
- Technical environmental review: **not activated yet**.
- `ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER`: remains operationally held only as a fail-closed activation posture until an independent qualified reviewer is actually assigned.
- Required founder activation quorum: **not yet recorded**.

### Reason for Change
The earlier June classification accurately corrected an invalid placeholder reviewer while Environmental Compliance was deferred. It became stale when the named governance authority later chose to feature Environmental Compliance during Alpha. This entry reconciles the machine-readable governance state with that signed decision without manufacturing a reviewer assignment or treating the founder/builder as her own independent reviewer.

### Governance Authority / Review Posture
Owner scope decision recorded by Caitlin L. Hudson, PhD, PE. Independent ceremony review and the required founder quorum remain outstanding. This CCR does **not** authorize Alpha entry, production, an official environmental report, environmental clearance, or regulated reliance.

### Effective Date
Owner scope decision recorded August 11, 2026. Technical workflow activation remains pending the resolution criteria below.

### Activation / Resolution Criteria
All of the following must be recorded:
1. A qualified **independent** environmental reviewer is assigned.
2. The required **2-of-3 founder sign-off** records the FEATURED Module 21 activation decision.
3. The operational Annex no longer represents the reviewer requirement as a deferred capability.
4. The Public Alpha ceremony and launch-reconciliation checks are rerun successfully.

### Audit Notes
- CCR-2026-002 is retained as historical evidence and marked RESOLVED.
- No reviewer assignment is inferred from professional credentials alone.
- No gate is made green by reclassification.
- Production and external-action holds remain unchanged.

---

## CCR-2026-003 — Regulatory Liaison Authority reclassification

<!-- ccr:meta
id: CCR-2026-003
title: Regulatory Liaison Authority reclassification
status: ACTIVE
previousState: Role REGULATORY_LIAISON_AUTHORITY classified ACTIVE_FILL (ASSUMED; holder Caitlin Hudson).
newState: Role REGULATORY_LIAISON_AUTHORITY classified HELD_FOR_ALPHA.
reason: Regulatory examination/response gates (Modules 40-41) are BLOCKED_BY_DESIGN in Alpha; zero alpha_required bindings require this role (audit: 0 alpha_required / 2 intentionally_held). The assumed active fill was invalid and over-concentrated Caitlin.
approver: Owner-controlled governance transition; finalized at Build 39 commit.
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
Owner-controlled governance transition; _[recorded on PR merge]_.

---

## CCR-2026-004 — Source Legal Authority reclassification

<!-- ccr:meta
id: CCR-2026-004
title: Source Legal Authority reclassification
status: ACTIVE
previousState: Role SOURCE_LEGAL_AUTHORITY classified ACTIVE_FILL (ASSUMED; former placeholder holder).
newState: Role SOURCE_LEGAL_AUTHORITY classified HELD_FOR_ALPHA.
reason: Source legal/licensing review (Module 23) and source promotion are held in Alpha; source-intelligence/scraper activation is blocked (live-fetch = 0); zero alpha_required bindings require this role (audit: 0 alpha_required / 7 intentionally_held). The former person-bound assignment was also a domain mismatch.
approver: Owner-controlled governance transition; finalized at Build 39 commit.
effectiveDate: Build 39 commit (2026-06-04)
resolutionCriteria: Activates when source legal/licensing review activates (source-promotion path).
-->

**Status:** **FINALIZED at Build 39 commit.** PR-review audit confirms `SOURCE_LEGAL_AUTHORITY` participates in **zero** alpha_required bindings (audit: 0 alpha_required / 7 intentionally_held bindings — source-legal-review, source-promotion-packets, live-scraper-activation, governance-connector-certification-review, source-ingestion-review, source-production-readiness-review, connectors-certification, all intentionally_held).

### Previous State
- Role: `SOURCE_LEGAL_AUTHORITY`
- Classification: **ACTIVE_FILL** (ASSUMED; former placeholder holder)

### New State
- Classification: **HELD_FOR_ALPHA**

### Reason for Change
Source legal & licensing review (Module 23) and source promotion are held in Alpha; source-intelligence/scraper activation is blocked (live-fetch = 0). No alpha_required capability requires it. The former person-bound assignment was also a domain mismatch (source legal is not communications/public trust). Held until source promotion activates.

### Activation / Resolution Criteria
Activates when source legal/licensing review activates (source-promotion path).

### Approver / Effective Date
Owner-controlled governance transition; _[recorded on PR merge]_.

---

## DOCUMENT_VERIFICATION_REVIEWER scope confirmation — superseded by AAR-2026-003

Not a reclassification. PR-review audit confirms scope is borrower-document completeness/escalation only:

| Binding | Action | Scope |
|---|---|---|
| `auth-document-evidence-reconciliation-review` | process document evidence reconciliation finding | completeness/escalation review (no control verification, no audit certification) |
| `auth-portal-borrower-documents-review` | review borrower documents portal posture | posture review (no control verification, no audit certification) |

Superseded by AAR-2026-003. `DOCUMENT_VERIFICATION_REVIEWER` is now assigned to Caitlin Hudson for borrower-document completeness/escalation only.
