# Public Site — Definition of Done (the single source of truth)

This is the one thing the build (and you) check against. Every future instruction becomes: **"make `verify:public` pass against this document."** If something isn't on this list, it isn't a requirement; if it's here, it isn't done until it's true on the rendered page.

> **Reconciliation note (Build 56).** This document is reconciled to the shipped
> four-page consolidation. Two earlier expectations were intentionally superseded
> and are recorded here so the gate and the page agree:
> - **IA — consolidation wins.** The public site is four pages (Explore · What We
>   Do · Trust & Your Data · Our Story) plus a standalone `/accessibility`. The
>   former standalone `/data-rights` is folded into `/trust#your-data`; `/data-rights`
>   and `/stewardship` 308-redirect (`next.config.mjs`). There is no separate
>   `/contact` route — contact/feedback is reached from the Our Story / Accessibility
>   pages.
> - **Homepage — current copy kept.** The homepage uses the "Clear waters, no
>   surprises" section (which contains the "How we work with you" trust list and the
>   "What Furlong Is Not" panel) rather than a separate "Explore Your Possibilities"
>   below-map CTA. The single journey CTA lives on the map capstone.

Source files (the verbatim content — never paraphrase):
- Copy: `src/lib/public-content/publicCopyRegistry.ts`, `src/lib/public-content/publicAlphaSurfaceContent.ts`
- Disclosures (single source of truth): `src/components/public/Disclosures.tsx`
- Map: `src/components/public/PublicMapExperience.tsx`, `src/app/(public)/layout.tsx`, `americasJourneyTour.ts`, `americasJourneyImages.ts`, `americasJourneyNowImages.ts`
- Lane icons: the approved Tabler set (map-pin, tractor, building-store, leaf, building-bank, building-community, gift, compass)

## A. The shell (every public page)
- [ ] Exactly **one** header, rendered only in `(public)/layout.tsx`. No page or component renders a second nav. (The legacy "Borrower Portal / Furlong" header is deleted.)
- [ ] Small footer — links only, not a second top-nav restyle.
- [ ] Watermark renders **once in the layout**, `position: fixed; inset: 0; place-items: center; pointer-events: none; z-index: 0`. The compass SVG exists in `/public` (not a broken image). Opacity 0.10 home / 0.06 subpages.
- [ ] No public page imports internal/governance/console/old-mega-page components.
- [ ] **PERMANENT public/internal isolation (always enforced).** No public page may LINK to or RENDER any
  internal route — `/internal`, `/governance`, `/operator-queue`, `/applications`, `/documents`,
  `/reviews`, `/rules`, `/decisions`, `/notices`, `/audit-replay`, `/connectors`, `/partners`,
  `/billing`, `/reports`, `/promotion`, `/case-command`, `/source-*`, `/production-*`,
  `/exception-remediation`, `/module-readiness`, `/portal/*`, `/lender/*`, `/sponsor/*` — nor the
  internal surface index (strings "Governed Platform", "internal surfaces", "Master Volume runtime").
  Internal/operator/governance consoles live behind auth in a separate `(internal)` segment, never in a
  layout public pages inherit. `verify:public` route-isolation FAILS the build if any internal link or
  index string appears on a public route. Public nav = Explore · What We Do · Trust & Your Data · Our
  Story, only. (See `BUILD_FIX_INTERNAL_NAV_LEAK.md`.)

## B. Homepage
- [ ] In order: America 250 banner → **FURLONG** → hero "blend" copy (LARGE H1 **"Every journey starts somewhere."** → prominent tagline **"Mapping America's land, funding, and business opportunities."** → subhead **"Use 250 years of land and financial history to map your next venture — property, farming, or small business — on your terms."** → trust tag **"Zero tracking. Total transparency."**) → the **interactive map** → the **single** journey CTA on the map's **capstone** card ("Ready to begin your Journey?" → `/explore`) → the **"Clear waters, no surprises"** section (which contains the **"How we work with you"** trust list and the **"What Furlong Is Not"** panel, plus the compact `<Disclosures>`) → footer.
- [ ] Exactly **one** journey CTA, and it lives on the map capstone — no duplicate below-map button, no CTA repeated as subtitle + button.
- [ ] Homepage does NOT show: onboarding, a category wall, full Furlong Story, internal/module/governance text, or a duplicate nav.

## C. The map (`PublicMapExperience`)
- [ ] Recognizable continental US (custom Albers projection), never zoomed into one region.
- [ ] Loads **complete + static** with the first place showing and a **"Begin the journey ▶"** button. A visitor who never clicks still gets a finished story.
- [ ] On Begin: marker travels; at each place a photo **pops up on the map at the location**, fading **then → now**; a short "why this is America's story" line shows. Then it advances.
- [ ] **Jump navigation:** the progress dots are clickable controls (`aria-label="Go to stop N"`, keyboard-focusable, visible active state); **⇤ Start** jumps to the first stop and **End ⇥** to the capstone; Prev/Next wrap circularly and are never disabled.
- [ ] Ends on the **capstone**: "What's your story? / Where does your journey begin?" → CTA links to **`/explore`**.
- [ ] Every image shows its **visible credit + source link**. `prefers-reduced-motion` → static, manual stepping, no auto-travel.
- [ ] Content rule: **hidden-gem tour** — 3 lesser-known places per state (not famous landmarks); each fact verified against an authoritative source; each image rights-cleared.
- [ ] **Present-day (NOW) images:** every `pd`/`cc-verify`-tier NOW entry has a real image `src` (public-domain/CC0; the four former cc-verify stops use Carol M. Highsmith Archive / LoC images). Only `commission`-tier stops may stay text-only until original photography lands.

## D. The pages (verbatim approved copy)
- [ ] The public IA is four pages — **Explore** (home), **What We Do** (`/compass`), **Trust & Your Data** (`/trust`), **Our Story** (`/about`) — plus a standalone **`/accessibility`**.
- [ ] `/about`, `/trust` (including the `#your-data` data-rights content), and `/accessibility` render the approved plain-English copy **word-for-word**. No technical jargon, no hex codes, no contrast ratios on the accessibility page.
- [ ] `/data-rights` and `/stewardship` **308-redirect** (`/data-rights → /trust#your-data`, `/stewardship → /compass`). The data-rights plain-English copy and the 5 data rights render inside `/trust`.
- [ ] `/explore` = the 8 lanes, each with its approved icon; text labels kept (icons decorative, `aria-hidden`); lanes stay no-account (link to `/explore?lane=`, never `/onboarding`).
- [ ] Each external page renders its required disclosures **visible on render**, via the shared `<Disclosures>` component (advisory-only, not-a-lender, free-for-borrowers, your-data-is-yours, the 5 data rights, etc.). Canonical disclosure prose lives only in `<Disclosures>` — no per-page duplication.
- [ ] "Contact" / feedback is reached from the **Our Story / Accessibility** pages (no separate `/contact` route under the four-page IA).

## E. Truth & gates
- [ ] `verify:public` is **green** (it bundles every check below).
- [ ] The **rendered page** at localhost matches this document. The bot's "all green" is not evidence — the page is.
- [ ] Public Alpha remains **PENDING**; nothing merged until you say so.

## How to use this with the bot
Give the bot one bounded task at a time, each phrased as: *"Do X. Then run `verify:public` and paste the full output. Do not relax any check."* You then run `verify:public` yourself and look at the page. Done = green gate + page matches this doc.
