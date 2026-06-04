# Module 45 — Human Authority Registry Specification

**Module:** 45 — Human Authority Registry · **Route:** `/human-authority`
**Why it exists:** Vol III-B treats human oversight as constitutional-grade infrastructure. Right now the self-report shows 51 FAILs because no module can name the credentialed human who clears it. Module 45 is the canonical, machine-readable binding of **every clearable action to a named human authority** — so no gate clears without a human, and the self-report's `human_authority` column can resolve.
**Command (proposed):** `npm run verify:human-authority` → validates the registry, returns gate code. Consumed by `build:self-report`.
**Build order:** before Module 44; it clears the dominant failure mode and fixes the verdict-resolution semantics below.

---

## 1. What it is (and is not)

- **Is:** a registry that maps each module / gate / decision point → the **role(s)** authorized to clear it, the credential each role must hold, and the clearing rules (separation of duties, quorum, no-self-clear). It binds *roles*, not named individuals — individuals are assigned to roles in an access-control layer and recorded in the audit ledger at clear-time.
- **Is not:** an approval engine. It does not decide anything. It declares *who is permitted to* and *enforces that no one else (and no AI) can*. Consistent with "we facilitate, we do not decide."

---

## 2. The verdict-resolution fix (the important part)

This is what corrects the baseline's `0 BLOCKED_BY_DESIGN` and the wrong "FAIL → PASS" expectation. Every module carries an **`intent`** classification in its manifest; the self-report resolves `module_verdict` from `intent` + `human_authority` state:

| Module `intent` | human_authority before 45 | after 45 (authority assigned) | Resolves to |
|---|---|---|---|
| `alpha_required` (e.g. 03, 04, 05, 09, 13, 19) | FAIL (unassigned) | PASS | **PASS** |
| `intentionally_held` (e.g. 22–26, 27–41 production/live chain) | FAIL (unassigned) | PASS | **BLOCKED_BY_DESIGN** |
| `internal_support` (no clear action) | N/A | N/A | unchanged |

**Rule:** for an `intentionally_held` module, a satisfied `human_authority` means *"the human who would clear this is named, and the block is still deliberately on"* → `BLOCKED_BY_DESIGN`, **never** PASS. PASS for a held module would falsely signal production-readiness. This single rule is why 45 must define `intent` and the self-report must read it.

> **Action for the 42 runtime:** add `intent` to the manifest schema (or derive it from the existing block registry) and update the verdict roll-up to the table above. Until then, held modules stay FAIL — acceptable, but they must not be allowed to flip to PASS.

---

## 3. Registry entry schema

```json
{
  "binding_id": "auth-prod-final-authority",
  "module_id": "production-final-authority",
  "module_number": 36,
  "clearable_action": "authorize production final sign-off",
  "intent": "intentionally_held",
  "required_roles": ["Chief Governance Authority"],
  "credential": {
    "type": "named-officer",
    "must_hold": ["governance-officer-credential"],
    "verified_by": "access-control-layer"
  },
  "clearing_rule": {
    "mode": "quorum",
    "min_approvers": 2,
    "separation_of_duties": true,
    "no_self_clear": true,
    "ai_permitted": false
  },
  "evidence_required": ["signed-authorization", "linked-evidence-pack"],
  "audit_event": "authority.cleared",
  "status": "defined"
}
```

One binding per clearable action. A module with several gated actions has several bindings.

---

## 4. Roles (seed set — confirm/extend)

| Role | Clears | Notes |
|---|---|---|
| Governance Operator | day-to-day operator queue, reviews (05), notices (08, in-app) | Tier-1 operational |
| Credit/Eligibility Authority | the human credit/eligibility decision (07) | At the lender/agency — never Furlong, never AI |
| Source Legal Authority | source legal/licensing (23), promotion packets (24) | |
| Data Rights Officer | data-rights fulfillment (19) | Privacy accountability |
| Chief Governance Authority | promotion (14), final authority (36), activation (37), reliance (39) | Highest gate; quorum |
| Regulatory Liaison Authority | regulatory exam (40), response (41) | |

**Hard rule across all roles:** `ai_permitted: false` on every clearing action. The registry validation MUST reject any binding with `ai_permitted: true`.

---

## 5. Checks Module 45 performs (and feeds to self-report)

| Check | PASS | FAIL |
|---|---|---|
| **Coverage** | every gate / decision point in the manifest registry has ≥1 binding | any clearable action with no binding |
| **No-AI** | every binding has `ai_permitted: false` | any binding permits AI to clear |
| **Role filled** | every `required_role` maps to ≥1 credentialed individual in access control | role defined but unfilled (`role-unfilled`) → WARN, not FAIL, if intentionally_held |
| **Separation of duties** | bindings requiring it enforce clearer ≠ requester ≠ implementer | SoD flag set but not enforced at runtime |
| **No self-clear** | runtime refuses a clear where actor == requester | self-clear possible |
| **Quorum** | quorum bindings refuse to clear below `min_approvers` | clears with too few approvers |
| **Audit binding** | every clear emits `audit_event` to the append-only ledger with the human actor | clear with no ledger entry / no named actor |

The self-report's `human_authority` cell = PASS only if coverage + no-AI + (role-filled OR intentionally_held) + SoD + no-self-clear all hold for that module.

---

## 6. Pass/fail gate for `verify:human-authority`

Exit 0 only if: **100% coverage** of clearable actions, **zero** `ai_permitted: true`, **zero** self-clear paths, and every `alpha_required` module's role is filled. `intentionally_held` modules may have unfilled roles (WARN) — they're not being cleared yet — but must still have a defined binding and correct `intent`.

---

## 7. Definition of done

1. Manifest schema carries `intent` (alpha_required / intentionally_held / internal_support).
2. Every clearable action has a binding; `verify:human-authority` exits 0 for the Alpha-required set.
3. Self-report verdict roll-up updated to §2 table; held modules now read `BLOCKED_BY_DESIGN`, Alpha-required cleared modules read PASS.
4. Re-run `build:self-report`: the 51 FAILs resolve into PASS (alpha set) + BLOCKED_BY_DESIGN (held set); `0 BLOCKED_BY_DESIGN` is no longer zero.
5. A clear attempt with no/!named human, or by AI, or self-clear, or below quorum is refused and the refusal is logged.
