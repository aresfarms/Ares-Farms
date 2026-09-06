# Master Volume Change Register — 2026-09-04

## Change set

**Change ID:** MVS-PARITY-2026-09-04  
**Purpose:** Reconcile the current Master Volume Series to the actual executable Furlong build after the September 3–4 owner-control, multi-provider Capital Network, property-intelligence, operating-model, valuation and execution-reliability changes.

## Audit finding

The constitutional architecture was already present in the Series and the build: `FACILITATION-001` / `CANON-FACILITATE-001`, `CONST-FAIR-001` lender neutrality, and `ECON-CONFLICT-001` recommendation/economic neutrality. The actual Program Registry also already separated property-side facts from person-side factors and marked all person-side factors `verifiable_by_furlong: false`.

A semantic drift nevertheless existed in older exported Volume II and Volume IV sections. Legacy `REG-SCORE-001`, `OPS-SCORE-001/002`, and portions of the SBA runbooks described Furlong Core as performing personal-credit/DTI/net-worth/net-income style scoring or verification. That wording did not match the current nonresidential runtime, which is property/project anchored and leaves borrower/business underwriting to the selected provider.

A second active-route audit also found two real runtime remnants that documentation alone could not fix: `/api/test-score` still accepted credit/liquidity-style applicant inputs, and `/api/rank` still used liquidity plus an SBA-style score in ordering. The portfolio demo was feeding that legacy rank contract. Those active surfaces were changed to property/project-only inputs and now reject personal-financial scoring fields. Historical/dead scoring modules are quarantined rather than treated as current platform authority.

The machine-readable version pointers were also stale: the current registry still reflected the September 2 build, `docs/versions.json` still reflected the June snapshot, and the source snapshot/build protocol listed older governing-version numbers.

A testing-phase property review then exposed a separate property-use defect in the farm lane. The imported-address path could resolve official parcel acreage after the place-intelligence bundle had already calculated its agricultural ranking with `acres = null`. Prime-soil evidence could therefore elevate commodity row crops even though the official parcel record later supplied acreage, and the old explanation could describe an acreage-unknown parcel as "small." The same surface also mixed gross and net per-acre figures under one apparent ranking and used crop-level `BEST FIT` / highest-and-best-use language even though development, subdivision, agritourism, energy/storage, infrastructure, entitlement and market alternatives had not been compared on a common basis.

The current build now treats a farm ranking as an **agricultural enterprise screen**, not a property-wide highest/best-use conclusion. Resolved parcel acreage is reconciled into the screen before publication; missing acreage fails closed; prime soil alone cannot make row crops the answer; gross/net/startup bases are labeled; and property-wide alternatives remain separate until legal, physical, entitlement/infrastructure, market and economic evidence support a conclusion. Jurisdiction-specific zoning interpretation is source-cited and otherwise fails closed.

## Reconciliation action

1. Added `MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md` as the controlling scoped amendment for current property/program/provider behavior.
2. Added `docs/current-build-parity.json` as the machine-readable hard-rule mirror.
3. Added `verify:master-volume-build-parity` and chained it into both `verify:master-volumes` and the strict mirror gate, so runtime/schema drift now fails Master Volume verification.
4. Reconciled the affected USDA/FSA/SBA, scoring, facilitation, lender-neutrality and economic-conflict requirement/reconciliation rows to the current nonresidential boundary.
5. Registered the September 3–4 Capital Network, execution reliability, property intelligence, operating model, valuation and owner-control build artifacts and proof commands.
6. Updated the current-version registry and `docs/versions.json` to the September 4 build and canonical schema target `0057`.
7. Remediated the active `/api/rank`, `/api/test-score`, property diagnostic scoring service and portfolio demo so current nonresidential scoring is property/project-only and forbidden personal-financial scoring inputs fail closed.
8. Marked the original applicant-credit scoring baseline as quarantined migration/history code and added a parity check that active API routes cannot import that superseded path.
9. Corrected the farm/land use-analysis path so resolved parcel acreage is reconciled before agricultural ranking, crop rankings are explicitly agricultural-only, unlike economic bases are labeled, property-wide alternatives remain separate, and unsupported zoning interpretations fail closed. Added `verify:farm-use-integrity` as a permanent regression gate.
10. Preserved all historical PDFs unchanged. Earlier wording remains versioned evidence; the later scoped amendment controls only where it expressly supersedes a conflicting older implementation description.

## Current hard boundary

For nonresidential property, Furlong may evaluate and rank the property/project, transaction economics, program/property fit and provider appetite. Furlong does not use personal credit score, personal income, household DTI, personal assets/liquidity/net worth or a similar personal-financial profile to rank the property, pathway or provider. The selected provider may separately perform the borrower/business underwriting its program requires. Residential is the separately governed exception.

Capital Network routing remains borrower-choice based: no lead sale, no file auction, no shotgun routing, no compensation-based ranking and no affiliate preference. Selection alone shares no file; provider/package/purpose/channel consent remains a separate governed gate.

The Farm Financial Health self-check remains available as an optional browser-side calculator. Its figures stay on the user's device and are explicitly excluded from Furlong nonresidential property scoring, pathway ranking and provider matching.

## Current implementation state

- Canonical schema target: `0057`.
- Capital Network runtime: `capital-network-runtime-v1.1.0`.
- Execution reliability runtime: `capital-network-execution-reliability-v1.0.0`.
- Multi-provider network code exists; real provider certification and production delivery remain controlled operational gates.
- Migrations `0056` and `0057` are applied in the controlled staging/testing database; permanent production promotion remains separate and is not implied by this source-build record.
- Property operating model, type-aware property valuation, and farm/land property-use integrity screening are implemented advisory build capabilities.

## Standing proof

- `npm run verify:master-volume-build-parity`
- `npm run verify:master-volumes`
- `npm run verify:master-volume-mirror`
- `npm run verify:program-registry`
- `npm run verify:capital-network`
- `npm run verify:capital-network-execution`
- `npm run verify:property-operating-model`
- `npm run verify:property-value-indication`
- `npm run verify:farm-use-integrity`
- `npm run build`

Any later material runtime/schema change must update the controlling Master Volume pointer and parity mirror in the same change set. A passing historical doctrine count is not sufficient if the executable hard rules have drifted.
