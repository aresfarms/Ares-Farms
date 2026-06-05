# Environmental Qualification Successor Plan

**Status: NOTE COMPLETE + SUCCESSOR PLAN RECORDED.**

This document closes the open action flagged by **CCR-2026-002**: the
environmental engineering review role is a regulated-competency single point of
failure (SPOF). The SPOF *note* was already recorded in the Classification
Change Registry and the Vol VII Operational Annex; this document is the
*successor plan* that note demanded.

**Doctrine references**
- `docs/CLASSIFICATION_CHANGE_REGISTRY.md` — **CCR-2026-002** (ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER → HELD_FOR_ALPHA).
- `docs/governance/VOL_VII_OPERATIONAL_ANNEX.md` — authority roster + held roles.
- `docs/DOCTRINE_VIA_GOVERNANCE_CLASSIFICATION_001.md` — a classification may not be changed solely to pass a gate.
- `docs/DOCTRINE_VIA_AUDIT_001_005_INDEPENDENT_VERIFICATION.md` — builder ≠ independent verifier.
- `docs/MODULE_21_ENVIRONMENTAL_COMPLIANCE_REVIEW.md`, Environmental v2 modules
  (Compliance / Risk Assessment / Escalation, Builds 28–30).

---

## 1. Current state

- **Environmental qualification currently resides with Caitlin Hudson.** She is
  the only person currently qualified (Environmental & Compliance steward) to
  perform environmental engineering review.
- **Stuart Fraass is not qualified** to perform environmental engineering review;
  the Step-3 assumption that assigned him this role was invalid and was corrected
  by CCR-2026-002.
- **Caitlin is also the builder**, so under VIA-AUDIT-001 she may not be the
  independent verifier of her own environmental review work. This compounds the
  SPOF: the one qualified person is conflicted for independent verification.

## 2. Held posture during Alpha

- **Environmental review remains HELD_FOR_ALPHA.** Module 21 (Environmental
  Compliance Review) and the Environmental v2 workflows are deferred from Public
  Alpha; no environmental determination is featured or relied upon in the Alpha
  cohort.
- A held role requires no Alpha fill, so the Alpha human-authority gate is
  unaffected — **no gate green was bought** by holding it (the requirement is
  dormant, not removed).
- Because environmental review is held, the SPOF is **not** an Alpha blocker. It
  becomes blocking only at the activation trigger (Section 7).

## 3. Activation requires a qualified environmental reviewer

Environmental review may leave HELD_FOR_ALPHA **only** when a qualified
environmental reviewer is assigned (Section 4) **and** an environmental workflow
is actually featured in scope. Until both hold, the role stays held. Activation
without a qualified, independent reviewer is prohibited.

## 4. Successor qualification requirements

A successor environmental reviewer must hold:

- A current professional environmental qualification appropriate to the
  jurisdiction and the environmental scope being activated (e.g., a licensed
  environmental engineer / qualified environmental professional, current and in
  good standing).
- Demonstrated competency in the specific review type being activated
  (compliance review, risk assessment, escalation adjudication) — not merely a
  general credential.
- No disqualifying conflict of interest for the workflow under review.
- Independence from the builder for any work requiring independent verification
  (VIA-AUDIT-001): the reviewer of record must not be the person who built the
  artifact under review.

## 5. Qualified replacement criteria (acceptance checklist)

A candidate is an accepted replacement when **all** are recorded:

1. Credential verified — current license/qualification on file, in scope.
2. Competency verified for the specific environmental review type(s) to activate.
3. Independence confirmed (builder ≠ verifier for the relevant artifacts).
4. Onboarded to the governed environmental modules and the replay/audit posture.
5. Recorded in the Vol VII Operational Annex and via a new CCR moving the role
   from HELD_FOR_ALPHA to ACTIVE_FILL (per VIA-GOVERNANCE-CLASSIFICATION-001 —
   the reclassification is logged, never silently changed).

## 6. Knowledge-transfer requirements

Before the role activates with a successor:

- Caitlin (current qualified steward) documents the environmental review
  methodology, decision criteria, escalation thresholds, and the mapping to the
  governed Environmental modules (21, and Environmental v2).
- A shadow period: the successor performs reviews alongside the current steward
  until both agree competency is demonstrated.
- All transferred knowledge is recorded in version control (no undocumented tribal
  knowledge), and the successor's independence boundary is written down.
- Hand-off is recorded in the Annex + a CCR; the evidence is checkpointed into
  the build-preservation archive.

## 7. SPOF mitigation strategy

The mitigation is layered, not a single fix:

1. **Hold (current):** environmental review is deferred from Alpha, so the SPOF
   carries no live operational risk during the cohort.
2. **Do not activate single-threaded:** never bring environmental modules out of
   HELD_FOR_ALPHA while only one qualified person exists *and* that person is the
   builder. Activation requires a qualified reviewer **plus** an independent
   verification path.
3. **Cross-qualification target:** establish at least a second qualified
   environmental reviewer (employee or engaged qualified professional) before any
   sustained environmental workflow goes live, so the role is never one-deep.
4. **Independence separation:** ensure the reviewer of record and the independent
   verifier are different people for any environmental determination.
5. **Successor plan kept current:** review this plan whenever the environmental
   scope or the qualified-person roster changes; record changes via CCR.

This plan does **not** remove the SPOF today — it records the constraint, the
acceptance criteria for a successor, and the rule that environmental review stays
held until the SPOF is genuinely mitigated.

## 8. Trigger conditions — leaving HELD_FOR_ALPHA

Per CCR-2026-002, the environmental role activates **only when both** hold:

- (a) An environmental workflow is **featured in scope** (a real environmental
  review is required by the product surface being offered), **and**
- (b) A **qualified environmental reviewer is assigned** meeting Sections 4–5,
  with an independent verification path (Section 7).

When (a) and (b) are met, record a new CCR moving the role from HELD_FOR_ALPHA to
ACTIVE_FILL, update the Vol VII Operational Annex, and re-run
`verify:human-authority`. Until then, environmental review remains held and is
not relied upon.
