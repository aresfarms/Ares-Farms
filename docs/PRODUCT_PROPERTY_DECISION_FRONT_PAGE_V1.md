# FURLONG Property Decision Front Page — UX Contract v1.0

**Product contract:** PROPERTY-DECISION-FRONT-PAGE-001  
**Companion doctrine:** PROGRESSIVE-INTELLIGENCE-001  
**Status:** implementation contract  
**Applies to:** customer property analysis before detailed workspace expansion

## Purpose

The first property-analysis screen is a decision front page, not a full report dump.

A customer arriving with a resolved property should immediately understand:

1. where they are in the FURLONG journey,
2. which property record they are viewing,
3. the three strongest property plans produced from the same governed evidence,
4. that deeper material exists only after they choose a plan.

The initial screen must not require the customer to read methodology, long disclosures, evidence tables, financing assumptions, report-commerce copy, property-type controls, or detailed lane content before choosing a plan.

## Initial-screen hierarchy

### 1. Compact journey rail

Use the canonical five stages:

- **EXPLORE** — Start with a place
- **UNDERSTAND** — Facts, risks, economics
- **PREPARE** — Readiness + reusable file
- **FINANCE** — Verified provider fit
- **OPERATE** — Keep the record useful

The journey control is navigation chrome. It must remain visually compact and may not become five large instructional cards.

### 2. Property identity masthead

Show only:

- FURLONG seal,
- **Furlong · The Land Ledger**,
- property title,
- location/address already present in the governed record,
- the existing data-verification date,
- the short land-ledger trust line.

Do not repeat property identity again inside the decision component.

### 3. Three-plan decision front

Headline:

**Furlong property decision**

Supporting line:

**Three property plans, ranked from the same evidence**

Render exactly the ranked scenarios returned by the canonical ScenarioRankingPlan. The UI must not reorder or invent a different winner.

Each plan card shows only:

- rank,
- candidate-role label,
- scenario title,
- short scenario summary,
- property/project score,
- property/project financing-fit score,
- the note that borrower underwriting is not evaluated,
- one primary action: **Open this plan**.

No methodology paragraph appears above the cards.

## Initial state

No plan is expanded on first render.

Until the customer chooses a plan, the detailed property workspace is hidden from both visual presentation and the accessibility tree.

The hidden area includes, at minimum:

- property-type correction controls,
- lane tabs and detailed property facts,
- progressive-intelligence evidence panel,
- comparison table,
- finance calculations,
- report/pro-forma controls,
- report-commerce offer,
- detailed disclaimers and methodology.

The loading-state warning remains visible when source gathering is incomplete.

## Selected-plan state

Choosing **Open this plan**:

1. marks that plan as selected,
2. reveals a compact selected-plan detail area,
3. reveals the existing governed detailed workspace below,
4. preserves the original ranking and evidence state,
5. does not create or imply a new verification event.

A customer may switch plans without losing entered property data.

## Selected-plan detail tabs

The selected-plan area uses six progressive-disclosure tabs:

### Summary
Show the scenario title, summary, rank, overall scenario posture, and current plan status.

### Evidence
Show the scenario's governed reason list. Do not transform missing evidence into favorable evidence.

### Risks / constraints
Show scenario conditions and the canonical walk-away gates under a secondary disclosure.

### Economics
Show the existing scoring dimensions only:
- property fit,
- market viability,
- lifecycle resilience,
- tax resilience,
- infrastructure resilience,
- total property/project score.

Do not invent NOI, cap rate, DSCR, cash flow, valuation, or price assumptions that are not already in the governed model.

### Financing fit
Show property/project financing fit separately from borrower underwriting and final lender approval.

### Next steps
Show the scenario conditions as the evidence/actions that still need resolution. A customer can then continue into the detailed workspace below.

## Methodology disclosure

The long ranking rule is not part of the initial decision front.

It appears only inside a collapsed **How ranking works** disclosure after a plan has been selected.

## Commerce placement

The Property Report / Property Decision Report offer is not visible on the initial three-choice screen.

It becomes available only after a customer selects a plan.

The selection itself is not consent to purchase and must not start checkout.

## Disclosure discipline

Keep a single short footer line on the decision front:

> Advisory only — not a loan approval, appraisal, permit, environmental clearance, or lender commitment.

Long-form limitations remain in the existing detailed surfaces.

## Responsive behavior

### Desktop
- Three plan cards may appear in one row when space permits.
- Selected-plan detail appears directly beneath the cards.
- Detailed workspace follows below the selected-plan detail.

### Mobile
- Cards stack vertically.
- Each card retains a minimum 44px action target.
- Selected-plan tabs horizontally scroll when needed.
- No hover-only information.

## Accessibility

- The three plan selectors are real buttons.
- Selection uses `aria-pressed`.
- Selected-plan detail is a labeled region.
- Detail tabs use `role="tablist"`, `role="tab"`, and `role="tabpanel"`.
- Keyboard activation must work without pointer input.
- Hidden detailed workspace uses the HTML `hidden` attribute while no plan is selected.
- Score meaning must not depend on color alone.

## Evidence and ranking safety

The front page MUST NOT:

- alter canonical rank,
- hide a material adverse condition from the selected plan detail,
- convert unknown evidence to zero,
- fabricate a completion percentage,
- imply borrower approval from property/project financing fit,
- substitute tax assessment for transaction price,
- manufacture urgency,
- force the customer to purchase to reveal already-known facts.

## Acceptance criteria

1. The initial resolved-property screen contains journey rail, Land Ledger masthead, and three ranked choices before detailed content.
2. No detailed lane workspace is exposed until a plan is selected.
3. Exactly one selected-plan detail region is visible at a time.
4. Switching plans changes the selected-plan detail but does not recompute or reorder the plan.
5. The ranking rule is collapsed behind **How ranking works**.
6. Report-commerce UI is hidden until selection.
7. Existing governed evidence, financing, property-type, progressive-intelligence, comparison, and report surfaces remain intact after reveal.
8. Deep/report views bypass the selection gate so existing report/export behavior is not broken.
