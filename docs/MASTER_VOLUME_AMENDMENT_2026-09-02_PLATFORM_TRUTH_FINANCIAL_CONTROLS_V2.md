# FURLONG MASTER VOLUME AMENDMENT
## Platform Truth & Borrower Financial Controls — v2.0

**Document ID:** FURLONG-MASTER-AMEND-PLATFORM-TRUTH-FINCTRL-2026-09-02-V2  
**Effective:** 2026-09-02  
**Classification:** CONFIDENTIAL — INTERNAL USE ONLY  
**Status:** Current supplementary governance record  
**Supersession:** Supersedes the earlier September 2, 2026 Platform Truth & Financial Controls supplement wherever implementation filenames, migration identifiers, doctrine-inventory counts, or certification status differ.

## 1. Constitutional truth rule
Furlong shall not describe a platform capability as implemented, live, certified, production-ready, or operational unless the corresponding platform artifact and verification evidence exist in the current build state. Conversely, a materially significant control implemented in the platform shall be represented in the Master Volume governance record or an explicitly incorporated amendment.

The controlled parity sequence is: **Master requirement → registered platform requirement → implementation artifact → verification evidence → deployment/migration evidence → controlled-promotion state → Master claim.** A break anywhere in that chain blocks the stronger claim.

## 2. Borrower financial-control chain
Before a borrower-facing professional-service charge may be authorized, Furlong requires an advance accepted scope, a BorrowerProtectionFeeControl, advance fee disclosure, module attribution, and verified evidence of actual work. Revenue recognition, refunds, distributions, and reconciliation require additional durable lineage described below.

The platform now contains source-controlled schema and runtime controls for the following canonical chain:

1. `engagement_scope_acceptances` — accepted scope, version, hash, quoted amount/rate, acceptance actor/method/time, module and service attribution.
2. `borrower_protection_fee_controls` — fee type, maximum/rate controls, advance disclosure, regulatory basis, waiver conditions, enforcement mechanism, borrower acceptance, and scope linkage.
3. `service_delivery_evidence_records` — actual work performed, responsible actor, evidence references, billable units/eligible amount, and independent verification state.
4. `governed_payment_records` — processor reference, scope/fee/work-evidence linkage, module attribution, amount/purpose/status, treasury and revenue references, and explicit `live_capture` state.
5. `module_revenue_attribution_records` — provider entity, module/service, gross/refund/net amounts, contributor share, platform overhead, restrictions, tax posture, and related-party review reference where applicable.
6. `governed_refund_records` — payment lineage, provider refund reference, amount, reason, status, approval, and treasury-ledger reference.
7. `treasury_reconciliation_records` — period controls, internal ledger, processor settlement, bank/custody, accounting system, recognized revenue/refund evidence, variance disposition, separate reconciler and attestation actors, and distribution release state.
## 3. Runtime enforcement and separation of states
`src/lib/treasury/borrowerFinancialControlStore.ts` evaluates the chain fail-closed. Engagement readiness is distinct from payment authorization; payment authorization is distinct from revenue recognition; revenue recognition is distinct from treasury distribution; and all four are distinct from production payment-connector promotion.

Actual-work evidence is required and verified before this control chain reports payment authorization readiness. A governed payment record must reference the actual-work evidence used to authorize it. Module revenue attribution is recorded separately from the payment record so gross amount, refunds, provider share, platform overhead, restrictions, tax posture, and related-party review remain independently auditable.

Treasury distribution cannot be released until reconciliation is complete, unresolved variance is zero, the required source evidence is present, and reconciliation and attestation are performed by different actors.

**Hard boundary:** These controls do not activate live production payment capture. `PRODUCTION-PAYMENT-CAPTURE-001` remains `awaiting_controlled_promotion`; production credentials, webhook verification, live connector controls, refund/dispute handling, treasury reconciliation, monitoring, rollback, and incident-response gates remain independently required.

## 4. Implementation evidence
Current source-controlled implementation:

- `src/db/schema/borrowerFinancialControls.ts`
- `src/db/schema/environmentalComplianceRecords.ts` — generalized `borrower_protection_fee_controls` fields while retaining environmental-specific protections
- `src/db/schema/treasury.ts`
- `src/lib/treasury/borrowerFinancialControlStore.ts`
- `src/lib/db/migrations/0054_borrower_financial_control_chain.sql`
- `src/scripts/borrowerFinancialControlConformance.ts`
- `src/lib/modules/moduleRegistry.ts` — Module 12 dependency/governance wiring
- `docs/master-volume-requirements.json`
- `docs/master-volume-doctrine-inventory.json`
- `src/scripts/masterVolumeConformanceTest.ts`

Verification command: `npm run verify:borrower-financial-controls`.

The database migration is source-controlled as migration **0054**. Source-control presence is not evidence that the migration has been applied to staging or production. Applied-migration evidence must be recorded separately before either environment is described as having the durable tables in its deployed database.

## 5. Current Master Volume mirror audit
The current doctrine denominator is derived from the current `Furlong_Master_Cross_Reference_Index.pdf` in the Master Build Volume directory. The inventory groups only exact alphanumeric-equivalent extraction variants; no semantic aliases are guessed.

Current audit result on 2026-09-02:

- 264 raw stable identifiers extracted from the current index.
- 253 canonical identifiers after exact extraction-variant normalization.
- 253/253 canonical identifiers individually registered in `docs/master-volume-requirements.json`.
- 0 current-index doctrines silently omitted from the registry.
- 208 current-index doctrines are still registered as `unreconciled` and therefore are **not** certified as mirrored to platform implementation.
- Full Master Volume mirror certification is **BLOCKED** until those doctrine-by-doctrine reconciliations reach a supported status.

The earlier September 2 supplementary record used a different doctrine count. This v2 record supersedes that count with the reproducible current-index inventory above.

`PLATFORM-ECONOMICS-001` remains explicitly `unreconciled`. The platform now has the BorrowerProtectionFeeControl and treasury/financial-control portions, but this amendment does not claim the full seven-object federated economics architecture is implemented until each required canonical object and its runtime behavior is proven.
## 6. Master-document metadata reconciliation
The current Master Build directory also contains version metadata drift that must not be hidden. The current running headers show Volume I v31.0, Volume II v25.0, Volume IV v23.0, and Master Cross-Reference Index v24.0 while their cover Version narratives begin at older revisions. Volume V's cover Version field is 10.0 while a legacy footer identifier still reads v2.0. These are document-maintenance defects, not evidence that platform capabilities changed.

The current-truth registry records both the current pointer and the drift. A refreshed Unified TOC v1.1 uses current filenames, page counts, and governing version pointers and identifies this amendment as a supplementary record. Historical PDFs remain preserved rather than silently overwritten.

## 7. Required future change procedure
For every future material change:

1. identify the controlling Master doctrine(s);
2. register the requirement and implementation state;
3. implement schema/runtime/UI/runbook behavior as applicable;
4. add deterministic verification evidence;
5. apply and verify migrations/deployment separately from source code;
6. preserve controlled-promotion boundaries for live external actions;
7. update the current Master registry, TOC/supplement, and cross-reference material;
8. run the strict mirror gate before making a full parity or certification claim.

`npm run verify:master-volumes` proves the registered requirement checks that are currently implemented or otherwise explicitly governed. `npm run verify:master-volume-mirror` is the stricter certification gate and must fail while any current-index doctrine remains unregistered or `unreconciled`.

## 8. Current status statement
As of this amendment, the requested borrower financial-control chain is implemented in source-controlled platform schema/runtime and conformance-tested. It is not, by that fact alone, proof that migration 0054 has been applied in any deployed database; it does not activate live production payment capture; and it does not constitute full Master Volume mirror certification.

**FINAL RULE:** Furlong may state only the strongest status supported by the complete evidence chain. Documentation certainty may never exceed platform reality, and platform behavior may never outrun its governing Master record.
