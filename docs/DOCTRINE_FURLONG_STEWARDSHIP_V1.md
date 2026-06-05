# Doctrine — Furlong Stewardship v1

**Version:** `furlong-stewardship-v1.0`
**Type:** Content / UX / navigation integration. Does **not** change governance
rules, voting state, Alpha status, or human-authority requirements. Public
Alpha remains PENDING.

## Core language (authoritative)

> **Furlong Stewardship**
>
> Every journey benefits from trusted guides.
>
> Furlong's stewards help illuminate opportunities, pathways, considerations,
> and next steps.
>
> The journey remains yours. The decisions remain yours. We help you understand
> the map.

## Stewardship doctrine rules

- Stewards illuminate. Stewards do not decide.
- Stewards explain. Stewards do not determine outcomes.
- Stewards guide exploration. Stewards do not control journeys.
- Stewards help understand the map. Customers choose where to go.

## Domains persist independently of individuals

Stewardship is modeled as **domains**, not people. The domain is stable; the
`currentSteward` may change without altering homepage architecture or routes.

```
StewardshipDomain { domainId; domainName; stewardTitle; description;
  currentSteward; profileRoute; explorationSpecialistDomain;
  helpsIlluminate[]; questionsExplored[]; whenHumanReviewAppropriate[];
  heldForAlphaNote? }
```

`profileRoute` always derives from `domainId` (`/stewardship/<domainId>`), so a
steward change never moves a page.

## Current domains

| Domain | Title | Current Steward | Route |
|---|---|---|---|
| Financing & Capital | Steward of Financing & Capital | Stuart Fraass | `/stewardship/financing-capital` |
| Environmental & Compliance | Steward of Environmental & Compliance | Caitlin Hudson | `/stewardship/environmental-compliance` |
| Communications & Public Trust | Steward of Communications & Public Trust | Frances Fraass | `/stewardship/communications-public-trust` |

Future domains may be added without changing homepage architecture.

> **Environmental note (CCR-2026-002):** technical environmental engineering
> review remains **held for Public Alpha** and is conducted only by a qualified
> environmental reviewer when activated. Stewardship of the domain (continuity)
> is distinct from activating regulated technical review.

## Positioning rules

- Platform-first. Stewards are introduced **after** exploration, trust, and
  discovery content. **No steward is the homepage hero.**
- Profile pages use stewardship language only. **Avoid**: expert, guru, master,
  captain, salesperson, advisor-first positioning.
- No sales language, no approval / guarantee / official-determination language.
- Profile pages focus on: what pathways the steward helps illuminate, what
  questions they help people explore, and when human review may be appropriate.

## Exploration integration

When a customer reaches a point where human review becomes appropriate (after
value is shown), the exploration flow may show:

> **Need help exploring further?**
> You may continue exploring on your own or request stewardship review.

…then the relevant stewardship options. The customer always retains control.
Required mappings: property-land → Financing & Capital + Environmental &
Compliance; small-business-growth → Financing & Capital + Communications &
Public Trust; environmental-compliance → Environmental & Compliance.

## Enforcement — `verify:stewardship` fails closed if

- a required domain is missing;
- a title is not stewardship-language ("Steward of …");
- `profileRoute` is not derived from `domainId` (would not persist independently);
- a domain lacks description / helps-illuminate / questions / human-review guidance;
- forbidden-title / sales / approval / guarantee language appears;
- the environmental domain does not note technical review is held for Alpha;
- a required exploration→stewardship review mapping is missing or references an
  unknown domain.
