# Build 45 — Universal Exploration Engine Foundation

**Doctrine:** `docs/DOCTRINE_UNIVERSAL_EXPLORATION_ENGINE_V1.md`
**Engine:** `universal-exploration-engine-v1.0`

> Note on numbering: this is a second build labeled "Build 45" (the customer
> homepage PR also used 45). It is delivered on its own branch
> `build-45-universal-exploration-engine` / PR.

## Goal

A reusable exploration framework every customer-facing module can use so that,
after a visitor selects a category on the homepage, every module offers the same
customer-friendly pattern: Full Map → Focus My Exploration → narrow → value
before personal info → deeper exploration or human review only after value.

## What was built

| File | Role |
|---|---|
| `src/lib/exploration/explorationTypes.ts` | Types (`ExplorationMode`, `ExplorationModule`, dimension/option/first-value/human-review), required-module list, prohibited-claim detector. |
| `src/lib/exploration/explorationRegistry.ts` | The 8 required Alpha exploration modules with dimensions, options, first-value outputs, human-review routes, source families. |
| `src/lib/exploration/explorationRuntime.ts` | `composeExplorationView({moduleId, mode, selectedOptions})` — prompt, options, selected path, first value, source hints, human review (only after value). |
| `src/scripts/verifyExplorationRegistry.ts` | `verify:exploration-registry` — fails closed on the registry contract. |
| `src/scripts/explorationRegistrySmokeTest.ts` | `smoke:exploration-registry` — proves modes, option coverage, value-before-review, env hold, prohibited-claim detection. |
| `docs/DOCTRINE_UNIVERSAL_EXPLORATION_ENGINE_V1.md` | Canonical doctrine. |

npm scripts: `verify:exploration-registry`, `smoke:exploration-registry`.
CI: both added after the build-self-report steps.

## Modes

`FULL_MAP` (general discovery, value immediately) and `FOCUS_MY_EXPLORATION`
(narrowing; value after the first choice; human review only once value is shown).

## Required Alpha modules

`property-land`, `farms-agriculture`, `small-business-growth`,
`environmental-compliance`, `financing-capital`, `housing-development`,
`programs-incentives`, `not-sure-yet`. Notable coverage:
- property-land: hotels, RV parks, mobile home parks, unusual/distressed.
- farms-agriculture: crops, flowers, livestock, specialty animals, timber,
  greenhouse, conservation, value-added, agritourism.
- financing-capital: USDA, SBA, conventional, seller financing, working capital.
- environmental-compliance: advisory; technical review **HELD_FOR_ALPHA** until a
  qualified reviewer (CCR-2026-002).
- not-sure-yet: suggested paths from simple starting points.

## Constitutional posture

Advisory only — no approval / guarantee / eligibility / official-determination
claims (enforced by the prohibited-claim detector). No personal identity
information required before value. No payments, no subscription tiers, no login.

## Verification

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run smoke:exploration-registry` | PASS |
| `npm run verify:exploration-registry` | PASS (8 modules, 0 findings) |
| `npm run verify:no-personal-docs` | PASS |
| `npm run verify:disclosures` | PASS |
| `npm run verify:customer-journey` | PASS |
| `npm run build:self-report` | PASS |
| `npm run build` | exit 0 |

## Acceptance

- [x] `smoke:exploration-registry`, `verify:exploration-registry`,
  `verify:no-personal-docs`, `verify:disclosures`, `verify:customer-journey`,
  `build:self-report`, `build` all pass.
- [x] Public Alpha remains PENDING. No founder votes recorded.
- [x] No payments. No personal information collected before value is shown.
