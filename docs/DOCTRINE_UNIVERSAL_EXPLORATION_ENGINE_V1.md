# Doctrine — Universal Exploration Engine v1

**Engine:** `universal-exploration-engine-v1.0`
**Status:** Customer-facing discovery framework. Advisory only. Public Alpha
remains PENDING.

## Core doctrine

> You choose what you want to explore. From there, you can personalize your
> journey or continue exploring the full map.

Every customer-facing module supports the same pattern after a visitor picks a
category on the homepage:

1. **Explore the Full Map** — general discovery without personalization.
2. **Focus My Exploration** — progressive narrowing.
3. **Narrow** by topic / geography / asset / project / commodity / concern.
4. **Show useful exploratory value BEFORE asking for personal information.**
5. **Offer deeper exploration or human review only AFTER value is shown.**

**No module may require personal identity information before providing general
exploratory value.**

## Master Volume traceability (synthesis only)

- Vol I — constitutional advisory posture; no autonomous determination.
- Vol II — disclosure boundaries; no approval / guarantee / eligibility /
  official-determination claims.
- Vol V — Data Transparency & User Sovereignty ("you choose what you explore";
  no information sale; no silent submission).
- Vol VI-A / CCR-2026-002 — environmental engineering review is HELD_FOR_ALPHA
  until a qualified reviewer is assigned.

## Two exploration modes

- `FULL_MAP` — broad discovery; value shown immediately; no personalization.
- `FOCUS_MY_EXPLORATION` — narrowing by dimension; value shown after the first
  narrowing choice; human review offered only once value is shown.

## Universal module interface

Each `ExplorationModule` declares: `moduleId`, `label`,
`plainEnglishDescription`, `routeBase`, `fullMapIntro`, `focusPrompt`,
`narrowingDimensions[]`, `firstValueOutputs[]`, `humanReviewRoutes[]`,
`sourceFamilies[]`, `alphaStatus`.

- **First-value outputs** are always free (`requiresPersonalInfo: false`,
  `allowedInFreeExploration: true`).
- **Human review routes** carry `triggerAfterValueShown: true`. A regulated
  technical review (e.g. environmental engineering) additionally carries
  `heldForAlpha: true` and is never auto-activated during Alpha.

## Required Alpha modules

`property-land`, `farms-agriculture`, `small-business-growth`,
`environmental-compliance`, `financing-capital`, `housing-development`,
`programs-incentives`, `not-sure-yet`.

## Enforcement — `verify:exploration-registry` fails closed if

- any required Alpha module is missing;
- a module lacks a Full Map intro or a Focus prompt;
- a module has no narrowing dimensions or no first-value outputs;
- any first-value output requires personal info before value is shown;
- any human-review route can appear before value is shown;
- any prohibited claim appears in customer-facing copy;
- `environmental-compliance` activates technical review without a
  qualified-reviewer hold;
- a module declares no source families.

## Runtime contract

`composeExplorationView({ moduleId, mode, selectedOptions })` returns the
current prompt, available options, selected path, first-value outputs, source
family hints, and human-review options (only after value is shown) — with
`requiresPersonalInfo: false` and advisory-only flags. No internal
module/governance jargon appears in customer-facing output.

## Out of scope (this build)

No payments, no subscription tiers, no login, no personal-information
collection before value is shown, no founder-first video.
