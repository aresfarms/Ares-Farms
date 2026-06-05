# Doctrine: Public Accessibility — WCAG 2.2 AA

**Doctrine ID:** `DOCTRINE_PUBLIC_ACCESSIBILITY_WCAG_AA_V1`  
**Version:** `public-accessibility-wcag-aa-v1.0`  
**Build Phase:** Build 50 — Homepage Cleanup + Accessibility Gate  
**Status:** Active  
**Public Alpha:** PENDING

---

## 1. Purpose

This doctrine establishes the accessibility requirements for every public-facing
page in the Furlong platform. Accessibility is not a feature — it is a baseline
property of the platform. Every public page must be navigable by keyboard, must
communicate meaning without color alone, and must be usable by visitors relying
on assistive technology.

The governing standard is **WCAG 2.2 Level AA**.

---

## 2. Scope

### 2.1 Covered Pages

All pages listed below are governed by this doctrine:

| Route | Description |
|---|---|
| `/` | Homepage — compass, map, discovery |
| `/onboarding` | Onboarding entry |
| `/explore/property-land` | Exploration category |
| `/stewardship` | Stewardship gateway |
| `/stewardship/financing-capital` | Financing stewardship domain |
| `/stewardship/environmental-compliance` | Environmental stewardship domain |
| `/stewardship/communications-public-trust` | Communications stewardship domain |
| `/about` | About Furlong |
| `/trust` | Trust and data governance |
| `/data-rights` | Data rights |
| `/financing-pathways` | Financing pathways |
| `/readiness` | Readiness assessment |
| `/portal/borrower` | Borrower portal entry |

### 2.2 Exclusions

Internal admin pages, operator dashboards, and lender portals are out of scope
for this doctrine. They are governed separately by their own module readiness gates.

---

## 3. Governing Requirements

### 3.1 WCAG 2.2 Level AA — Required

| WCAG ID | Requirement | Verification |
|---|---|---|
| 1.1.1 | Non-text content has text alternative | Static + axe |
| 1.3.1 | Info and relationships conveyed structurally | Static + axe |
| 1.3.2 | Meaningful sequence | Manual |
| 1.3.3 | Sensory characteristics do not rely on shape/color/size/location alone | Manual |
| 1.4.1 | Color not the only visual means of conveying info | Static + axe |
| 1.4.3 | Text contrast ≥ 4.5:1 (normal), 3:1 (large) | Static (pattern) + axe |
| 1.4.4 | Text resizes to 200% without loss of content | Manual |
| 1.4.11 | Non-text UI contrast ≥ 3:1 | axe |
| 2.1.1 | All functionality available via keyboard | Static + axe |
| 2.1.2 | No keyboard trap | Manual |
| 2.4.3 | Focus order that preserves meaning and operability | Manual |
| 2.4.7 | Focus visible on all interactive elements | Static + axe |
| 2.5.3 | Label in name — accessible name contains visible label | axe |
| 2.5.5 | Touch target ≥ 44×44px (AAA) / practical 40px (AA) | Static |
| 3.3.2 | Labels or instructions on form inputs | Static + axe |
| 4.1.2 | Name, role, value on UI components | Static + axe |

### 3.2 Map-Specific Requirements

The Living Opportunity Map (animated, SVG-based) has additional requirements:

| ID | Requirement |
|---|---|
| map-1 | Animated map has text equivalent in story card (aria-live polite + atomic) |
| map-2 | Map animation halts when prefers-reduced-motion: reduce is set |
| map-3 | Fallback communicates the story without the visual map |
| map-4 | Map SVG has role="img" and descriptive aria-label |
| map-5 | Decorative compass watermark is aria-hidden and alt="" |
| map-6 | Node labels scale with zoom and do not clip at viewBox edges |
| map-7 | Phase indicator uses text label in addition to color dots |

---

## 4. Homepage Accessibility Posture (Build 50)

### 4.1 Structure

The homepage must follow the lighthouse structure:

```
Compass (aria-hidden, decorative)
↓
Hero (h1, sub, CTA)
↓
Living Opportunity Map (aria-label on section, aria-live on card)
↓
Explore Dropdown (form, select with aria-label, submit button)
↓
Trust Strip
↓
What Furlong Is Not (institutional blue/gold — not a warning box)
↓
Footer (navigation landmark, stewardship link)
```

### 4.2 Single Exploration Entry Point

The homepage must have **exactly one** exploration entry point:
a `<select>` dropdown inside a `<form>` that routes to `/onboarding`.

The following are explicitly prohibited:
- Dual explore cards ("Explore Full Map" / "Focus My Exploration")
- Category card grid (8 expanded category links)
- Duplicate "What would you like to explore today?" headings

### 4.3 Compass Watermark Placement

The compass watermark must be at the **page shell level** (`position: relative`
on the outermost `<div>`), not inside any `overflow: hidden` container.

Both watermarks must be:
- `aria-hidden="true"` (decorative, not content)
- `pointer-events: none`
- `z-index: 0` (below all content)
- Opacity 3%–8%

### 4.4 "What Furlong Is Not" Styling

This section must use institutional styling:
- **Background:** Furlong navy (`#162033` or equivalent dark blue)
- **Heading color:** Gold (`#c9a84c` or equivalent)
- **Icon/mark color:** Gold
- **Body text:** Near-white (`#e8effa` or equivalent)
- **Prohibited:** Yellow (#fffdf0, #f1c40f, #b45309) — caution/warning styling
  is inappropriate for institutional disclosure language

---

## 5. Verification Architecture

### 5.1 Static Analysis Gate — `verify:accessibility`

File: `src/scripts/verifyPublicAccessibility.ts`

Runs source-level pattern checks against all public page source files.
Does not require a running server. Runs in CI without browser.

**Checks covered:** ~40 static assertions across:
- Map component ARIA attributes
- Focus-visible on all interactive elements
- Color contrast (known bad patterns banned)
- Touch target sizes
- Homepage Build 50 structural requirements
- Cross-page source structure

**Exit code:** 0 (all pass) or 1 (any fail)

### 5.2 Browser Smoke Test — `smoke:accessibility`

File: `src/scripts/publicAccessibilitySmokeTest.ts`

Uses Playwright + axe-core when browsers are installed.
Falls back to source-level checks when Playwright browsers unavailable.

**Setup for full browser testing:**
```bash
npx playwright install chromium
npm run smoke:accessibility
```

**Acceptance criteria checked:**
1. Homepage has exactly one exploration prompt
2. Dropdown is accessible (has accessible label)
3. No duplicated CTA
4. No exposed category-card wall
5. Accessibility static gate passes

### 5.3 CI Execution Order

```
npx tsc --noEmit          # type safety
npm run build              # compilation
npm run verify:accessibility    # static gate (no server needed)
npm run smoke:accessibility     # browser smoke (degrades gracefully)
npm run verify:customer-journey # content gate
npm run verify:disclosures      # disclosure gate
npm run verify:no-personal-docs # privacy gate
```

---

## 6. Privacy Posture Intersection

The accessibility gate must not introduce privacy violations. All pages verified
by this doctrine must also satisfy:

- **No geolocation API calls** on public pages (navigator.geolocation banned)
- **No visitor identification** on any page verified here
- **No exact addresses** shown on public pages
- **"The map reveals opportunities, not the visitor"** — must be preserved as
  a code-level governance comment in LivingOpportunityMap.tsx

---

## 7. Manual Review Requirements

The following items cannot be verified statically and require periodic manual review:

1. Actual color contrast ratios (static checks ban known failures; full audit requires browser)
2. Focus order that preserves meaning and operability
3. Keyboard trap absence (tab order completeness)
4. Text resize to 200% without content loss or overlap
5. Label in name — accessible name matches visible label
6. Sensory characteristics (size/shape/location-only patterns)
7. Meaningful sequence (reading order)

**Review cadence:** Before each Public Alpha activation event.

---

## 8. Version Lineage

| Version | Build | Change |
|---|---|---|
| v1.0 | Build 50 | Initial doctrine — 13 public pages, 40+ static checks, Playwright integration, homepage Build 50 structure |

---

## 9. Governance Seal

```
docRef:    docs/DOCTRINE_PUBLIC_ACCESSIBILITY_WCAG_AA_V1.md
version:   public-accessibility-wcag-aa-v1.0
buildPhase: Build 50 — Homepage Cleanup + Accessibility Gate
publicAlpha: PENDING
privacy: "The map reveals opportunities, not the visitor."
```

Human review required before modifying governance posture in Section 4 or 6.
