# MODULE-SOVEREIGNTY-AUDIT-001

- **Date:** 2026-06-15 · **Scope:** `main` · **Mode:** audit + verification only
- **Gate:** `npm run verify:module-sovereignty` (`src/scripts/verifyModuleSovereignty.ts`)
- **Companion:** `verify:module-ecosystem` (locks §4 contract fields) +
  `docs/doctrine/GOVERNED_FEDERATED_MODULE_ECOSYSTEM.md`.

> Proves Furlong Core and all governed modules remain **federated, separable,
> independently operable** — Core does not bleed into module identity/ownership/
> data/routing/obligations; professional modules never merge into Core. Closes
> nothing, activates nothing.

## Result: PASS — no hidden coupling, no professional-service bleed

13 modules enumerated; every sovereignty check passes; one non-fatal finding
(Media governance location) reported for owner confirmation.

## 1. Module register & boundary classification

| Module | kind | steward (derived) | activation | public | disable-safe |
|---|---|---|---|---|---|
| property-intelligence | core_intelligence | Furlong Core | active | yes | ✅ |
| ownership-intelligence | core_intelligence | Furlong Core | deferred | yes | ✅ |
| transaction-reality | core_intelligence | Furlong Core | deferred | yes | ✅ |
| environmental | professional | Furlong-governed, separately operated | gated | no | ✅ |
| compliance | core_intelligence | Furlong Core | active | no | fail-closed |
| financing-intelligence | core_intelligence | Furlong Core | gated | yes | ✅ |
| five-borough-capital | licensed_professional | external licensed professional | inactive | no | ✅ |
| source-intelligence | core_intelligence | Furlong Core | active | no | ✅ |
| risk-intelligence | core_intelligence | Furlong Core | deferred | yes | ✅ |
| climate | core_intelligence | Furlong Core | gated | yes | ✅ |
| historic-property | core_intelligence | Furlong Core | gated | yes | ✅ |
| agricultural | core_intelligence | Furlong Core | active | yes | ✅ |
| future-modules | future | unassigned (enters via registry) | inactive | no | ✅ |

Each module carries the full sovereignty contract (id, activation, public/private
boundary, input + output contract, eligibility/deps, fallback, `dependsOnHub=false`).

## 2–10. Sovereignty assertions (all PASS)

- **§3 Core ≠ professional internals:** no Core file (navigator/discovery libs +
  components) imports a professional/licensed module internal — connection is via
  registry/contract only.
- **§4 No doctrine mutation:** constitutional lock intact; no module hard-depends
  on the hub (federation rule).
- **§5 Five Borough:** `licensed_professional`, **INACTIVE**, non-public,
  never-merged-into-core doctrine, explicit opt-in (no silent submission), not
  renderable while inactive.
- **§6 Compass to Capital:** Financing Intelligence **gated**
  (`FINANCING_NODE_LIVE=false`); domain doctrine keeps it **financing-neutral, not
  automatically Five Borough**.
- **§7 Environmental / Compliance / Media separately governed:** Environmental =
  professional/gated/non-public; Compliance = governed core, **fail-closed**;
  distinct doctrine refs. (Media — see finding below.)
- **§8 Inactive → unavailable/deferred, not broken:** every non-active module has
  a graceful fallback; inactive professional modules are non-renderable (degrade,
  no crash).
- **§9 No silent action:** constitutional doctrine forbids Core to silently
  underwrite/approve/qualify/broker/submit/decide; each professional module has
  no silent path (inactive-nonrenderable or explicit opt-in).
- **§10 Registry/contract only:** every module declares input+output contracts;
  no hidden hub coupling.

## Simulation — Core with modules OFF (graceful degradation)

| Scenario | Core routes | Graceful | Hidden dep | Result |
|---|---|---|---|---|
| all optional modules off | ✅ | ✅ | none | PASS |
| Financing off | ✅ | ✅ | none | PASS |
| Five Borough off | ✅ | ✅ | none | PASS |
| Environmental off | ✅ | ✅ | none | PASS |
| Media off (separately governed) | ✅ | ✅ | none | PASS |
| all optional declared but inactive | ✅ | ✅ | none | PASS |
| **Compliance off** | n/a | **fail-closed** (gates block) | none | PASS (safe) |

Always-on core set (`property-intelligence`, `agricultural`, `compliance`,
`source-intelligence`) keeps routing regardless of optional module state. No
crash, no hidden dependency, no professional-service bleed, no decision-for-user,
no financing/lender collapse.

## Findings

### Hidden couplings
- **None detected.** Core imports no professional internals; all connections run
  through the registry/contract; `dependsOnHub=false` for all 13.

### Medium (reported, non-fatal)
- **No explicit `steward`/owner field on `EcosystemModule`.** Stewardship is
  currently *derived from `kind`* (core→Furlong, licensed_professional→external,
  professional→Furlong-governed-separately). Recommend adding an explicit
  `steward` field so ownership is asserted, not inferred. (Not changed here.)
- **Media (image-rights / Module 23) is governed OUTSIDE the ecosystem registry**
  via PENDING image-rights records. Functionally separate (so it doesn't bleed
  into Core), but it is not represented as a registry module. Confirm this remains
  intentional, or register it as a governed module.

## Posture
Audit only. No product/production/DNS/financing activation, no blocker closure.
**10 blockers OPEN; `combinedProductionReady=false`.**
