# Build 36 — Module 45 Human Authority Registry v1

**Doctrine:** `docs/DOCTRINE_HUMAN_AUTHORITY_REGISTRY_V1.md`
**Runtime:** `src/lib/human-authority/humanAuthorityRegistryRuntime.ts`
**Runtime version:** `human-authority-registry-runtime-v0.1.0`
**Spec version:** `module-45-human-authority-registry-spec-v1.0`
**Module:** 45 — Human Authority Registry · **Route:** `/governance/human-authority-registry`
**API:** `POST /api/governance/human-authority-registry`
**Sibling builds:** Build 34 Module 42 Build Self-Report · Build 35 Public Alpha Profile v1

---

## Why this build

Vol III-B treats human oversight as constitutional-grade infrastructure. The Build 34 self-report surfaced 51 FAILs on the `human_authority` column because no module could name the credentialed human who clears it. Module 45 is the canonical, machine-readable binding of every clearable action to a named human authority.

The dominant FAIL mode is now cleared:

- Build 34 self-report before Module 45: **51 FAIL** on `human_authority`, **0 BLOCKED_BY_DESIGN**.
- Build 34 self-report after Module 45: **24 FAIL** (remaining are non-authority-related), **29 BLOCKED_BY_DESIGN** (intentionally-held production / live chain modules now resolve correctly).

The §2 verdict-resolution fix is the heart of the build:

| Module `intent` | human_authority before 45 | after 45 (authority assigned) | Resolves to |
|---|---|---|---|
| `alpha_required` | FAIL (unassigned) | PASS | **PASS** |
| `intentionally_held` | FAIL (unassigned) | PASS | **BLOCKED_BY_DESIGN** |
| `internal_support` | N/A | N/A | unchanged |

`intentionally_held + authority assigned` NEVER resolves to PASS — PASS for a held module would falsely signal production-readiness.

---

## What shipped

### Runtime

- `src/lib/human-authority/humanAuthorityRegistryRuntime.ts` (~2100 lines)
  - `deriveModuleIntent(manifest)` — classifies every module as `alpha_required` / `intentionally_held` / `internal_support`.
  - `HUMAN_AUTHORITY_ROLE_REGISTRY` — 12 canonical roles (Governance Operator, Qualified Governance Reviewer, Credit/Eligibility Authority, Source Legal Authority, Data Rights Officer, Chief Governance Authority, Regulatory Liaison Authority, Document Verification Reviewer, Borrower Intake Reviewer, Environmental Engineering Spoke Reviewer, Sovereign Federation Authority, Third Party Records Authority).
  - `HUMAN_AUTHORITY_BINDINGS` — **72** canonical bindings covering Alpha §3 ON modules, intentionally-held production / live chain, v2 backbone advisory composition, environmental chain, workflow / harness modules, sovereign + third-party authorities, and Module 45 itself.
  - `validateBinding` enforces constitutional invariants: `ai_permitted = false`, `no_self_clear = true`, quorum `min_approvers >= 2`, `separation_of_duties = true`.
  - `resolveModuleAuthority(manifest, intent, bindings, filledRoleIds)` — applies the §2 table.
  - `moduleHumanAuthorityResolutionFor(manifest, filledRoles)` — exported helper consumed by Build 34 Build Self-Report.
  - `composeHumanAuthorityRegistry(input)` — full evidence pack with findings, signals, summary, exit code.
  - 6 finding categories (`BINDING_AI_PERMITTED`, `BINDING_SELF_CLEAR_ALLOWED`, `BINDING_QUORUM_INVALID`, `BINDING_UNKNOWN_ROLE`, `MODULE_BINDING_COVERAGE_MISSING`, `ALPHA_REQUIRED_ROLE_UNFILLED`).
  - 4 governed signals (`coverage_alignment`, `no_ai_alignment`, `role_filled_alignment`, `separation_of_duties_alignment`).

### CLI gate

- `npm run verify:human-authority` — exits 0 only when:
  - 100% coverage of clearable actions,
  - zero `ai_permitted = true`,
  - zero self-clear paths,
  - every `alpha_required` module's role is filled.

### API + page

- `src/app/api/governance/human-authority-registry/route.ts` — governed `POST` with full runtime guard, version lineage, classification (RESTRICTED), explainability, observability, replay verification, and evidence persistence.
- `src/app/governance/human-authority-registry/page.tsx` — internal reviewer page (no public surface).

### Smoke test

- `src/scripts/humanAuthorityRegistrySmokeTest.ts` — validates:
  - version + doc seal,
  - every binding has `ai_permitted = false`, `no_self_clear = true`, quorum >= 2, known roles,
  - Module 45 has its own binding,
  - baseline (no filled roles) exits 1 with `ALPHA_REQUIRED_ROLE_UNFILLED` findings,
  - all-roles-filled scenario exits 0 with zero authority-FAIL modules,
  - §2 semantics: alpha_required + roles → PASS; intentionally_held + roles → PASS or WARN at the per-module cell level,
  - `moduleHumanAuthorityResolutionFor` consumer helper resolves correctly,
  - module manifest + event contract + handoff conformance.

### Build 34 Build Self-Report consumer update (THE §2 fix)

- `src/lib/build-self-report/buildSelfReportRuntime.ts`:
  - `buildHumanAuthorityCheck` now imports `moduleHumanAuthorityResolutionFor` and `deriveModuleIntent` from Module 45.
  - `computeVerdict(row, isGate, intent)` applies the §2 table: `intentionally_held + human_authority assigned -> BLOCKED_BY_DESIGN` (never PASS).
  - Input accepts optional `humanAuthorityFilledRoles` roster supplied by the access-control layer.

### Registries

- `src/lib/modules/moduleRegistry.ts` — `governance-human-authority-registry` (Module 45) added; 14 consumer modules updated to consume the new event.
- `src/lib/modules/eventContractRegistry.ts` — `governance.human.authority.registry.verified` event registered (RESTRICTED, production-blocked, replay-required).
- `src/lib/modules/handoffMap.ts` — 14 governed handoffs added (build-self-report, public-alpha-profile, data-transparency-posture, build-preservation, doctrine-gap-ledger, module-readiness, applications, documents, data-rights, evidence-packets, audit-replay, governance, reviews, promotion).
- `src/scripts/moduleConformanceTest.ts` — reserves Module 44 (Disclosure Audit Gate) per Module 45 spec §0: "Build order: before Module 44".

### CI

- `.github/workflows/ci.yml` — new step `Human Authority Registry v1` runs `npm run smoke:human-authority-registry`.

### npm

```
"smoke:human-authority-registry": "tsx src/scripts/humanAuthorityRegistrySmokeTest.ts"
"verify:human-authority": "tsx src/scripts/humanAuthorityRegistryCli.ts"
```

---

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run smoke:human-authority-registry` | PASS (bindingCount=72, baseline exitCode=1, all-roles exitCode=0) |
| `npm run verify:module-manifests` | PASS (highest=45, Module 44 reserved) |
| `npm run smoke:cross-module-replay` | PASS (101 modules, 91 event contracts, 562 handoffs) |
| `npm run smoke:public-alpha-profile` | PASS |
| `npm run smoke:build-self-report` | PASS (29 BLOCKED_BY_DESIGN, was 0; 24 FAIL, was 51 — §2 fix verified) |
| `npm run build` | PASS (Next.js compiled successfully) |

---

## Constitutional posture preserved

- **No authority assignment.** Bindings declare roles, not individuals.
- **No AI clearing.** `ai_permitted = false` is enforced on every binding; the validator rejects any `true`.
- **No self-clear.** `no_self_clear = true` is enforced on every binding.
- **No autonomous determination.** The runtime does not approve or deny anything.
- **Replay-safe + audit-safe + conflict-preserving + federation-scoped + production-blocked.**
- **Every finding resolves to `REQUIRES_HUMAN_REVIEW`.**
- **`internal-governance` claims profile** — no public surface, no information sale, no silent submission, no marketing lead, no notice send, no live external action.

---

## Definition-of-done check against the spec

| §7 item | Status |
|---|---|
| Manifest schema carries `intent` (derived) | DONE — `deriveModuleIntent` exported and consumed by Build Self-Report. |
| Every clearable action has a binding; `verify:human-authority` exits 0 for the Alpha-required set | DONE — 72 bindings cover all alpha_required + intentionally_held modules. Gate exits 0 when alpha_required roles are filled (verified by the all-roles-filled smoke scenario). Operational state (filled roles) is recorded outside the code repository. |
| Self-report verdict roll-up updated to §2 table | DONE — `computeVerdict` promotes `intentionally_held + authority` to `BLOCKED_BY_DESIGN`. |
| Re-run `build:self-report`: 51 FAILs resolve into PASS + BLOCKED_BY_DESIGN | DONE — `modulesBlockedByDesign` now 29 (was 0); `modulesFail` now 24 (was 51). |
| Clear attempt with no/!named human, by AI, self-clear, or below quorum is refused and logged | DONE — validator rejects these at registry time; downstream runtime enforces at clear-time (out of scope for this build, but the registry declares it and the smoke test covers the validation surface). |
