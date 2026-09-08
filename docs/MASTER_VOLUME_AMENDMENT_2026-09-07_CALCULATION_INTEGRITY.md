# Master Volume scoped amendment — Calculation and evidence integrity

Effective September 7, 2026 (America/New_York); build work recorded September 8 UTC.
Authority: owner's combined instruction to correct platform calculations, property soils, asking prices and BPO evidence. Implementation record, not attorney approval, appraisal certification or all-platform certification.

## Controlling requirements

This supplements the September 5 Product Coherence amendment and Vol III TECH-PROV-001 / TECH-SCORING-001 and Vol V CANON-EXPL-001. Older wording claiming an acreage-based best crop, an assessment-based market estimate, generic rents as verified property NOI, or assured borrowing/coverage is superseded within this scope.

1. Current verified asking/contract evidence and an explicitly entered offer are transaction-price inputs. They remain distinct from a market-value opinion. Raw tax assessment is only a tax fact.
2. Market screens require either at least three distinct recent, reviewed, subject-bound adjusted closed sales, or property NOI plus source-backed market cap-rate evidence. State farm averages and tax/index calculations are contextual benchmarks only. No arbitrary range or automatic generic size/time adjustment.
3. Government transfer records are candidate evidence, not automatically arm's-length sales or adjusted comparables. Duplicate deed/multi-parcel consideration, publication lag, asset differences, condition and concessions require review.
4. Crop suitability uses the actual soil evidence scope. An address point, parcel point, map-unit component percentage, and whole-parcel intersection are different. Mapped pH is not measured field pH. Alfalfa is not interchangeable with grass hay; no blanket geographic ban and no silent assumption of liming or drainage improvements.
5. No agricultural winner or whole-parcel NOI without complete acreage allocation and current, source-backed, comparable alternatives. Missing evidence is not proof that farming cannot work.
6. Missing rate, expense, income or acquisition price is not zero. Explicit zero remains valid where mathematically meaningful; losses remain negative. Monthly and annual payment frequencies are explicit. Net lease income requires owner-paid costs.
7. Unverified what-if arithmetic stays labeled as such and cannot populate an approved underwriting result or automatically generated export income projection. County hazard ratings cannot be converted into invented building-code requirements or construction premiums.
8. Website and report must preserve the canonical calculation's status, source date and limitations. Never turn missing comparable evidence into an assessment fallback.

## Implemented scope in this source revision

- Canonical debt arithmetic; loss and missing-input handling in operating and draft pro-forma models, including blank form fields. Manual income capitalization is a separate what-if result, not a Value Screen.
- FSA structure screening compares the proposed loan, not the purchase price, with dated program ceilings; an unspecified blended structure remains pending. The FY2026 guarantee ceiling requires refresh on October 1.
- Residential debt and remaining-balance arithmetic share the canonical functions. Negative equity remains negative; residential HPI/FHA equity projections are not used for farm property.
- Valuation context/market-screen separation; recent, distinct, subject-bound comp evidence gate.
- Maryland parcel-outline soil map-unit lookup with boundary/query hashes; acreage weights and field tests remain unresolved.
- Maryland recent government-transfer candidate discovery (agricultural filtering for agricultural subjects), with source dates and deed-scope warnings.
- New York SalesWeb official-batch route and Delaware county-specific coverage declarations; no current NY/DE batch imported in this revision. New Castle live metadata checked; latest annual layer observed is 2024.
- Seven-day current-asking observation policy, exact full-address matching and source activation gate. General commercial listing websites remain subject to their existing source controls; public visibility alone does not grant automated reuse.
- Regression gates for evidence, numerical boundaries, soil scope and output parity.

## Not implemented or not certified by this amendment

This is NOT proof that every calculation, module, report, source, user verification or provider workflow is certified. Detailed calculation review beyond the generated candidate inventory, field-level soils/acreage weighting, authenticated review/import of complete BPO evidence, current general-market asking-price feeds, and full live customer/export verification remain separate work. The historical Master Volume PDFs are preserved; this scoped record must not be described as rewriting their entire conformance matrix.

No production promotion, new source approval, user onboarding certification or legal sign-off is implied by a passing local test. Cloud revision and test evidence belong in the associated build record.

## Repeatable checks

Run `npm run verify:calculation-integrity`, `npm run verify:farm-use-integrity`, `npm run verify:property-value-indication`, `npm run verify:property-operating-model`, `npm run verify:financing-program-fit`, `npm run verify:master-volume-build-parity`, `npx tsc --noEmit` and `npm run build`. Any failure blocks release of these changes; investigate the failing evidence rather than removing the gate.
