# BUILD DOCTRINE — Governed Federated Module Ecosystem

**Owner:** Caitlin · **Date:** 2026-06-12 · **Severity:** Constitutional · **Status:** Required build doctrine
**Code:** `src/lib/platform/moduleEcosystemRegistry.ts` · **Gate:** `verify:module-ecosystem`

## 1. Core rule

Furlong is **not a banker web portal**. Furlong is a governed **Decision Intelligence Platform** built from
separate, interoperable modules. The public hub informs, compares, explains, and routes. Professional modules
perform specialized work only when intentionally activated.

## 2. Hard distinction

**Furlong Core MAY provide:** property intelligence; pathway discovery; ownership reality; transaction reality;
financing intelligence; risk comparison; due-diligence categories; program awareness; alternatives; constraints;
known / unknown / cannot-determine outputs.

**Furlong Core does NOT:** underwrite; approve; qualify; broker loans; submit applications; make legal/tax/
financial determinations; decide for the user; force a transaction path.

**Professional modules** (separate but connected; can be active / inactive / replaced / licensed / gated /
paywalled / human-reviewed): Five Borough Capital / Stuart Fraass financing module; environmental/compliance
module; communications/public-trust module; future licensed provider modules.

## 3. Five Borough Capital boundary

Five Borough Capital is **not Furlong**. It may connect as a professional financing module.
- Furlong may say: *"This property may fit these financing pathways."*
- Five Borough may, under its own professional authority, say: *"Based on your actual financials and
  documentation, here is how this financing may be structured."*

**The build must not merge those two layers.**

## 4. Module architecture requirement

Each module must have: its own doctrine; activation flag; public/private boundary; input contract; output
contract; eligibility gate; review gate if professional/licensed; audit/replay record; fallback if inactive; no
hard dependency on the public hub unless explicitly required. (Enforced by the registry type + verifier.)

## 5. Federation rule

Prefer: orchestration over ownership; connection over absorption; references over duplication; module contracts
over monolith logic; professional handoff over hidden platform advice; independent operability over central
dependency. **Do not build Furlong as a single centralized service that owns every spoke.**

## 6. Output rule

Furlong outputs: *"Here are your paths and options."* Professional modules output: *"Here is the professional
service you requested under that module."* The user must always be able to distinguish: Furlong public
intelligence · paid/professional module service · licensed human review · third-party provider path.

## 7. Anti-drift rule

Furlong must never be reduced to: loan portal; listing portal; calculator portal; lead-generation funnel;
"100% financing" sales page; bank intake form; standard real estate website; broker CRM; single-product sales
funnel. **If a proposed feature pushes Furlong toward a standard banker webportal, reject it or refactor it into
the module ecosystem.**

## 8. Activation examples (graceful degradation)

Financing intelligence may be live while Five Borough is inactive. Property intelligence may be live while
financing is gated. Environmental review may be a paid module without exposing internal compliance logic
publicly. Saved journeys may exist without professional services. **Each spoke must degrade gracefully.**

## 9. Required fallback language (locked)

> "Furlong can explain the pathway and what information matters, but this professional service is not active
> here yet. You may continue with general decision intelligence or consult a qualified professional."

## 10. Acceptance tests

- Furlong financing output does not claim borrower qualification. *(verify:financing-node + output gate — live)*
- Five Borough professional-service language does not appear in free public Navigator output. *(verifier greps
  public surfaces; full Navigator assertion folds into verify:navigator after the discovery merge)*
- Turning Five Borough off does not break public financing intelligence; turning financing off does not break
  property/pathway intelligence. *(registry independence — no module dependsOnHub; no cross-imports)*
- Paywalled professional modules do not leak private functionality publicly. *(publicSurface=false enforced)*
- Public hub never silently acts as a licensed professional. *(advisory-only + NO_DECISION_FOR_USER gates)*
- User can clearly tell when leaving Furlong Core for a professional module. *(handoff must be explicit opt-in —
  asserted on Five Borough's input contract)*

## 11. Constitutional lock

**Furlong is the map. Modules are optional guided routes. Professionals are separate service providers.
The user chooses the path.**

---

*Branch note:* captured on `build-module-ecosystem-doctrine` (off post-Step-2 `main @ a61e9bd`) so the frozen
discovery branch and the merge sequence stay untouched. After the discovery merge, fold the Navigator-output
acceptance assertions into `verify:navigator`.
