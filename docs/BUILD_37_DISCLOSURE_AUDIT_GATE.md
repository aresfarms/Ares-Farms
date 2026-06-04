# Build 37 — Module 44 Disclosure Audit Gate v1

**Doctrine:** `docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md`
**Runtime:** `src/lib/disclosure-audit/disclosureAuditGateRuntime.ts`
**Runtime version:** `disclosure-audit-gate-runtime-v0.1.0`
**Spec version:** `module-44-disclosure-audit-gate-spec-v1.0`
**Module:** 44 — Disclosure Audit Gate · **Route:** `/governance/disclosure-audit-gate`
**API:** `POST /api/governance/disclosure-audit-gate`
**Sibling builds:** Build 34 Module 42 Build Self-Report · Build 35 Public Alpha Profile v1 · Build 36 Module 45 Human Authority Registry v1

---

## Why this build

The Module 42 Build Self-Report shipped two stub cells dependent on Module 44: `disclosures_present` (token-count heuristic) and `claims_controls` (claimsProfile presence). Per the Module 44 spec, every public / customer-facing surface must carry the canonical advisory disclosures and no surface may emit a prohibited claim. Build 37 supplies the canonical disclosure registry and prohibited-claims corpus, runs a deterministic static auditor, and flips the self-report cells from stub heuristics to sourced verdicts.

Together with Module 45 (Human Authority Registry, shipped in Build 36), Module 44 closes the loop on the Public Alpha entry criteria (§6).

---

## What shipped

### Runtime

- `src/lib/disclosure-audit/disclosureAuditGateRuntime.ts` (~900 lines)
  - `deriveSurfaceClass(manifest)` — classifies every module as `public | borrower | lender | sponsor | internal | gate` from the manifest audience + claimsProfile.
  - `DISCLOSURE_REGISTRY` — 8 canonical disclosures (advisory-only, no-reliance, no-public-verification, Furlong-not-lender, AI-tier1-only, data-rights, free-for-borrowers, user-data-sovereignty) with applicable surface classes, semantic match tokens, placement (`visible-on-render`), and severity-if-missing.
  - `PROHIBITED_CLAIMS_CORPUS` — 6 canonical claim categories (approval-language, decision-language, ai-decision-language, reliance-language, commitment-language, verification-language) with regex patterns and `NEGATION_EXEMPT_PATTERNS` for doctrine "Furlong does NOT approve" carve-out.
  - `detectProhibitedClaim(text, patterns, exemptions)` — sentence-aware detector with negation safety; the doctrine's compliant negation patterns do not trigger violations.
  - `auditModuleDisclosures(manifest)` — per-surface disclosure coverage result.
  - `auditModuleClaims(manifest, injectedSampleText?)` — per-surface prohibited-claim leak result with red-team injection support.
  - `moduleDisclosureResolutionFor(manifest)` — exported helper consumed by Build 34 Build Self-Report.
  - `composeDisclosureAuditGate(input)` — full evidence pack: surface results, findings, signals, summary, exit code.
  - 4 finding categories (`DISCLOSURE_MISSING`, `PROHIBITED_CLAIM_LEAKED`, `SURFACE_COUNT_DISCREPANCY`, `NEGATION_SAFETY_FAILURE`) and 4 governed signals (`disclosure_coverage_alignment`, `claims_block_alignment`, `negation_safety_alignment`, `surface_count_alignment`).

### CLI gate

- `npm run verify:disclosures` — exits 0 only when every external surface carries every required disclosure, zero unexempted prohibited-claim leaks, surface count reconciles between registry and gateway, and any red-team injection is caught.

### API + page

- `src/app/api/governance/disclosure-audit-gate/route.ts` — governed `POST` with full runtime guard, version lineage, RESTRICTED classification, explainability, observability, replay-verification, evidence persistence.
- `src/app/governance/disclosure-audit-gate/page.tsx` — internal reviewer page with a red-team injection field that lets reviewers verify the corpus catches a planted claim.

### Smoke test

- `src/scripts/disclosureAuditGateSmokeTest.ts` validates:
  - version + doc seal,
  - registry shape (every disclosure has tokens, applicable surface classes, `visible-on-render` placement; every corpus entry has patterns + exemption patterns + expected behavior),
  - **negation safety** — 12 doctrine negation samples ("Furlong does not approve loans.", "Not a lender commitment.", etc.) must NOT trigger any corpus category,
  - **red-team self-test** — 6 prohibited-claim samples (approval, decision, AI decision, reliance, commitment, verification) must be caught by the corpus,
  - aggregate red-team injection through the composer flips the exit code to 1 and emits `PROHIBITED_CLAIM_LEAKED` findings,
  - `moduleDisclosureResolutionFor` consumer helper resolves `trust` (public) to PASS and `governance` (internal) to N/A,
  - module manifest + event contract + 14 governed handoffs conformance.

### Build 34 Build Self-Report consumer update

- `src/lib/build-self-report/buildSelfReportRuntime.ts`:
  - `buildDisclosuresCheck` now imports `moduleDisclosureResolutionFor` and returns the §1 result (PASS / FAIL / WARN / N/A with the resolver's reason) — replaces the 2-of-4 token heuristic.
  - `buildClaimsControlsCheck` now consults Module 44 — replaces the claimsProfile-presence heuristic with the full prohibited-claims corpus result.
  - Self-report numbers stable: 9 PASS / 39 PASS_WITH_WARNINGS / 24 FAIL / 29 BLOCKED_BY_DESIGN — the §2 Module 45 fix held, Module 44 sourced the cells without regressions.

### Registries

- `src/lib/modules/moduleRegistry.ts` — `governance-disclosure-audit-gate` (Module 44) added; 14 consumer modules updated to consume the new event.
- `src/lib/modules/eventContractRegistry.ts` — `governance.disclosure.audit.gate.verified` event registered (RESTRICTED, production-blocked, replay-required).
- `src/lib/modules/handoffMap.ts` — 14 governed handoffs added (human-authority-registry, build-self-report, public-alpha-profile, data-transparency-posture, build-preservation, doctrine-gap-ledger, module-readiness, applications, documents, data-rights, evidence-packets, audit-replay, governance, reviews).
- `src/scripts/moduleConformanceTest.ts` — Module 44 reservation removed; the module sequence is now contiguous through 45.

### CI

- `.github/workflows/ci.yml` — new step `Disclosure Audit Gate v1` runs `npm run smoke:disclosure-audit-gate`.

### npm

```
"smoke:disclosure-audit-gate": "tsx src/scripts/disclosureAuditGateSmokeTest.ts"
"verify:disclosures":         "tsx src/scripts/disclosureAuditGateCli.ts"
```

---

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run smoke:disclosure-audit-gate` | PASS (8 disclosures, 6 claim categories, 27 external surfaces all PASS, baseline exit=0, red-team injection caught and gate blocks) |
| `npm run verify:disclosures` | PASS — exit 0 (100% coverage, zero leaks, surface count reconciled 27 vs 27) |
| `npm run verify:module-manifests` | PASS — 102 modules, highest=45, sequence contiguous |
| `npm run smoke:build-self-report` | PASS (numbers stable post-integration) |
| `npm run smoke:human-authority-registry` | PASS |
| `npm run smoke:public-alpha-profile` | PASS |
| `npm run smoke:cross-module-replay` | PASS (102 modules, 92 event contracts, 576 handoffs) |
| `npx tsx src/scripts/publicSurfaceSmokeTest.ts` | PASS (27 surfaces, no public source intelligence leak) |
| `npx tsx src/scripts/redactionSmokeTest.ts` | PASS |
| `npm run build` | PASS (Next.js compiled successfully) |

---

## Constitutional posture preserved

- **No customer-facing publication.** The runtime audits surfaces, it never publishes.
- **No autonomous determination.** No approval, denial, decision, certification, verification, commitment.
- **Negation-aware.** Doctrine compliant negations ("Furlong does NOT approve") are recognized and not flagged.
- **Surface count reconciled.** Registry (27) vs gateway (27) — no §5 18-vs-19 discrepancy remains.
- **Red-team self-test passes.** A planted prohibited-claim sample is caught and blocks the gate.
- **Replay-safe + audit-safe + conflict-preserving + federation-scoped + production-blocked.**
- **Every finding resolves to `REQUIRES_HUMAN_REVIEW`.**
- **`internal-governance` claims profile** — no public surface, no information sale, no silent submission, no marketing lead, no notice send, no live external action.

---

## Definition-of-done check against the spec

| §7 item | Status |
|---|---|
| Disclosure registry + prohibited-claims corpus exist, versioned, traceable to Customer Version doctrine | DONE — 8 disclosures + 6 corpus categories sealed at `disclosure-audit-gate-runtime-v0.1.0` against `module-44-disclosure-audit-gate-spec-v1.0`; every entry carries `source_doctrine`. |
| `verify:disclosures` exits 0 across all external surfaces; negation-safety verified | DONE — CLI gate exits 0; smoke test asserts 12 doctrine negation samples never trigger violations. |
| Self-report `disclosures_present` and `claims_controls` flip from Module 44 dependency to PASS | DONE — `buildDisclosuresCheck` and `buildClaimsControlsCheck` now consume Module 44 resolution. |
| Surface-count coverage reconciles (18 vs 19 resolved) | DONE — registry (27) vs gateway (27) reconciled; `surface_count_alignment` signal READY. |
| Planted prohibited claim is caught and blocks the gate (red-team self-test) | DONE — smoke test asserts 6 categories of red-team injections are caught; aggregate composer injection flips exit to 1. |

---

## Sequencing note

With **45** (authority) and **44** (disclosures) both green, the Public Alpha entry criteria (§6) are satisfiable: the self-report exits 0 for the Alpha-required set, held modules read `BLOCKED_BY_DESIGN`, disclosures and claims controls pass, and every Alpha decision point has a named human. That is the gate to open Public Alpha.
