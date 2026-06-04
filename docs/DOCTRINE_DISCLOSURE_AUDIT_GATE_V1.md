# Module 44 — Disclosure Audit Gate Specification

**Module:** 44 — Disclosure Audit Gate · **Route:** `/disclosure-audit`
**Why it exists:** every public/customer-facing surface must carry the advisory / no-reliance disclosures, and no surface may emit a prohibited claim (approved, guaranteed, AI-decided, etc.). Module 44 supplies the **canonical disclosure set** and the **prohibited-claims corpus** that the self-report's `disclosures_present` and `claims_controls` columns consume — replacing per-surface guesswork with one source of truth.
**Command (proposed):** `npm run verify:disclosures` → audits every surface, returns gate code. Consumed by `build:self-report`.
**Build order:** after Module 45; together they complete the Public Alpha entry criteria.

```json
{
  "disclosure_id": "user-data-sovereignty",
  "applies_to": ["borrower","lender","public"],
  "required_text_canonical":
  "You remain in control of when your information moves from exploration to engagement. Furlong does not secretly submit, sell, or distribute your information.",
  "match_mode": "semantic",
  "placement": "visible-on-render",
  "severity_if_missing": "FAIL"
}
```

---

## 1. What it is

Two canonical registries plus an auditor:

1. **Disclosure registry** — the required disclosure strings, keyed by `surface_class`, with match mode.
2. **Prohibited-claims corpus** — the language that must never reach a customer surface, with severity.
3. **Auditor** — renders each surface, checks required disclosures are present and prohibited claims are absent/blocked, emits per-surface PASS/FAIL.

It enforces presentation-layer doctrine; it does not change what a surface *does*.

---

## 2. Disclosure registry schema

```json
{
  "disclosure_id": "advisory-only",
  "applies_to": ["borrower", "lender", "sponsor", "public"],   // surface_class list
  "required_text_canonical": "This information is advisory only and is not an approval, guarantee, or official determination.",
  "match_mode": "semantic",        // exact | normalized | semantic
  "placement": "visible-on-render", // must be present without interaction
  "severity_if_missing": "FAIL"
}
```

### Required disclosure set (seed — confirm against Customer Version doctrine)

| disclosure_id | Asserts | Applies to |
|---|---|---|
| `advisory-only` | advisory, not approval/guarantee/determination | all external |
| `no-reliance` | no legal or regulatory reliance | all external |
| `no-public-verification` | not a public verification / official record (unless authorized) | all external |
| `furlong-not-lender` | Furlong does not lend or decide | borrower, lender |
| `ai-tier1-only` | AI assists completeness only; no credit/eligibility decisions | borrower, lender |
| `data-rights` | you may request an accounting of your data | borrower |
| `free-for-borrowers` | borrowers pay nothing | borrower |

`internal` and `gate` surface classes → `disclosures_present = N/A (internal surface)`.

---

## 3. Prohibited-claims corpus schema

```json
{
  "claim_id": "approval-language",
  "patterns": ["approved", "you qualify", "guaranteed", "eligible for $", "pre-approved"],
  "match_mode": "semantic+regex",
  "context_exempt": ["explaining what Furlong does NOT do"],  // negation-aware
  "severity": "FAIL",
  "expected_behavior": "blocked-or-redacted-before-render"
}
```

### Corpus categories (seed)

| claim_id | Forbidden language (examples) | Severity |
|---|---|---|
| `approval-language` | approved, you qualify, pre-approved, guaranteed | FAIL |
| `decision-language` | we decided, denied, adverse action issued | FAIL |
| `ai-decision-language` | the system determined eligibility, AI approved | FAIL |
| `reliance-language` | official record, you may rely on this, legally binding | FAIL |
| `commitment-language` | committed funds, locked rate, sponsor guaranteed | FAIL |
| `verification-language` | publicly verified, certified by Furlong | WARN→FAIL |

Matching must be **negation-aware** — "Furlong does NOT approve loans" is compliant doctrine, not a violation. The `context_exempt` field carries this; the auditor must not flag exempted negated contexts.

---

## 4. Auditor checks (feed self-report)

| Check | Source | PASS | FAIL |
|---|---|---|---|
| **disclosures_present** | rendered surface DOM vs disclosure registry | all required disclosures for that surface_class present & visible-on-render | any required disclosure missing or interaction-gated |
| **claims_controls** | run prohibited-claims corpus against surface + API responses | 100% of corpus blocked/redacted; zero leak | any prohibited claim renders to a customer |
| **negation-safety** | exempted negated contexts | doctrine "does NOT" statements pass | auditor false-flags a compliant negation |
| **coverage** | surface registry | every external surface audited | any external surface unaudited |

---

## 5. Pass/fail gate for `verify:disclosures`

Exit 0 only if: every external surface carries its full required disclosure set, **zero** prohibited claims render (corpus 100% blocked), and coverage = 100% of external surfaces. Reconcile surface count here too — resolve the 18-vs-19 public-surface discrepancy as part of coverage.

---

## 6. How it lands in the self-report

- `disclosures_present` cell ← per-surface disclosure result (N/A for internal/gate).
- `claims_controls` cell ← per-surface corpus result (N/A only if surface emits no customer-facing claims).
- Adds platform roll-up line: `disclosure_audit: __/__ surfaces pass`.
- Both columns can only reach PASS once 44 ships its registries; before that they should read FAIL/`registry-not-yet-built (Module 44 dependency)` — same honest-gap pattern as the 45 dependency.

---

## 7. Definition of done

1. Disclosure registry + prohibited-claims corpus exist, versioned, and traceable to Customer Version doctrine.
2. `verify:disclosures` exits 0 across all external surfaces; negation-safety verified (no false positives on doctrine "does NOT" language).
3. Self-report `disclosures_present` and `claims_controls` flip from the 44-dependency FAIL to PASS for compliant surfaces.
4. Surface-count coverage reconciles (18 vs 19 resolved).
5. A planted prohibited claim in any surface is caught and blocks the gate (red-team self-test passes).

---

## Sequencing note

With **45** (authority) and **44** (disclosures) both green, the Public Alpha entry criteria in the Alpha Definition (§6) are satisfiable: the self-report exits 0 for the Alpha-required set, held modules read `BLOCKED_BY_DESIGN`, disclosures and claims controls pass, and every Alpha decision point has a named human. That is the gate to open Public Alpha.
