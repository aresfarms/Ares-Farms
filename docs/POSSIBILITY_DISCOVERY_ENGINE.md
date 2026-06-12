# Possibility Discovery Engine — the guided, possibility-first front door

Caitlin's vision (2026-06-11). **Additive** to the existing guided-intake + token +
consent + tailored-report loop. **Not merged, Alpha PENDING.**

> "Before we recommend a property, program, financing option, grant, conservation
> pathway, business opportunity, or strategic plan, understand what you're trying to
> accomplish. We're not here to sell you something — we help you understand your
> possibilities." Flow: **Person → Goals → Constraints → Possibilities → Pathways →
> Recommended Actions.** The property search is ONE possible destination — never THE one.

## What was built

| File | Role |
|---|---|
| `src/lib/discovery/possibilityEngine.ts` | The deterministic Tier-1 routing layer (ISOMORPHIC — runs in the browser). Maps anonymous answers + the verified feed → the 10 outputs. Education + routing, never determination. |
| `src/lib/discovery/discoveryConfig.ts` | `DISCOVERY_PRIMARY` feature flag (default ON) + the preserved `BROWSE_HREF`. |
| `src/components/discovery/DiscoveryEngine.tsx` | The anonymous, in-session wizard (Steps 1–7 + optional property prefs) and the Possibility Map render (the 10 outputs, with Human Review made prominent). |
| `src/app/(public)/discover/page.tsx` | `/discover` — the primary front door. Server-renders the verified feed into the wizard; browse stays one click away. |
| `src/app/(public)/page.tsx` | Home page gains a prominent "What are your possibilities?" CTA (gated on the flag; additive — nothing removed). |
| `src/scripts/verifyDiscoveryEngine.ts` | `verify:discovery-engine` — proves the doctrine across 210 intake combinations. |

## The 10 outputs (Final AI Routing Layer)
1 Possibility Map · 2 Recommended Pathways · 3 Risks & Constraints · 4 Available Programs ·
5 Financing Options · 6 Revenue Opportunities · 7 Environmental Opportunities · 8 Property
Opportunities (only when property is relevant) · 9 Suggested Next Actions · 10 **Human Review
Recommendations** (always present, the safety valve).

## How the guardrails are enforced
1. **Anonymous — interests, not qualifications.** The routing layer is a PURE function
   that runs in the browser from in-session answers + the feed the page already rendered.
   **Nothing about the person is sent to a server**, so there is no identity to store (same
   doctrine as `GuidedIntake`). No PII anywhere. Sensitive signals (savings/credit/retirement)
   only shape the person's own map and are never transmitted or sold. *(verify asserts the
   engine + wizard contain no `fetch`/POST/network and no PII fields.)*
2. **Education + routing, never determination.** Every output is a possibility to EXPLORE +
   "confirm with a licensed advisor / the agency." No output says a person qualifies / is
   eligible / is approved. *(verify runs every rendered string through the content-claims
   policy — 0 BLOCK — plus an affirmative-eligibility word grep, across 210 combinations.)*
   This is the reconciliation with the no-"may fit" rule: a PROPERTY place-fact stays verified
   + definitive elsewhere; a PERSON-side pathway is offered as a possibility and routed to a
   licensed human. Different surfaces, both honest.
3. **Person-eligibility = the licensed human's call.** Output #10 is always present and
   prominent; every possibility item names *who* confirms it. Furlong decides nothing.
4. **AI Routing Layer = Tier-1 advisory only.** The shipped layer is a deterministic rule map
   (replay-safe, Vol III) — it generates possibilities/education, never credit/eligibility/
   approval calls. A real LLM could later slot behind the same governed interface.
5. **Verified-only property/program FACTS.** Property counts come straight from the verified
   guided-intake feed; "No" to property yields no property counts; nothing says "may fit".

## Browse is preserved (Caitlin: keep what we have until I see this working)
Discovery is the **primary** front door (`DISCOVERY_PRIMARY=true`, env-overridable). The
existing property map / Explore / browse stays a fully-usable **secondary** path, linked from
both the home CTA context and inside the wizard. Nothing existing was removed. Flip the default
later with one env var.

## Crexi / CoStar — partner, don't compete (Caitlin 2026-06-11, recorded for counsel)
Complementary, not competitive — they sell the listing; Furlong helps with acquiring +
everything after. A **licensed listing feed/API** (Crexi / CoStar / LoopNet) could SOURCE
inventory for the property module while Furlong adds the coordination layer. Path: a **licensed
data partnership, NOT scraping**, subject to their terms + counsel. No code change here — noted
so it isn't lost.

## Verify results
`verify:discovery-engine` PASS (210 combinations) · full prior suite still green
(module-separability, consent-model, listing-engine, place-fact-claims, internal-auth,
postgres-migration) · `tsc --noEmit` clean · `npm run build` exit 0 (`/discover` in the route
manifest) · `/discover` and the home CTA render (HTTP 200).

---

## Update (2026-06-11) — Conversational, AI-guided interview

The static form was rebuilt into a **conversational interview**: one adaptive question
at a time, each next question chosen from the last answer. It feels like a guide, not a form.

| File | Role |
|---|---|
| `src/lib/discovery/conversationEngine.ts` | DETERMINISTIC floor (isomorphic): canonical slots, structured option sets, adaptive ordering (`allowedNextSlots`, `remainingSlots`), and answer→typed-`DiscoveryAnswers` mapping. Runs with or without the AI. |
| `src/lib/discovery/interviewPolicy.ts` | The guardrails baked into the guide: hardened/ jailbreak-resistant system prompt, verified-fact grounding (real `PROGRAM_REGISTRY` names + verified feed), and the pure guards — banned-determination, PII, injection, `validateAssistantTurn`, the structured-output schema. |
| `src/lib/discovery/aiInterview.ts` | SERVER-only Tier-1 driver: calls `claude-opus-4-8` (adaptive thinking, structured output, no prefills), validates every turn, falls back to the floor on missing key / error / uncertainty, and logs each turn PII-free. |
| `src/app/api/public/discovery/converse/route.ts` | Public, anonymous interview API: folds option codes into typed answers, PII/injection-guards free text, picks the next question (AI → floor), or signals map-ready. `askedSlots` ensures a Skipped optional is never re-asked. |
| `src/components/discovery/DiscoveryEngine.tsx` | Rebuilt as a chat: renders one question + structured options at a time, posts interests only to our own converse API, then renders the verified map. |

**Grounding guarantee:** the AI only conducts the interview. The Possibility Map (the 10
outputs) is still produced by the **verified deterministic engine** from the accumulated
answers + the verified feed — the model can never invent a program, number, or eligibility
result. Determination language, PII, and injection are refused in code; the deterministic floor
is the active path whenever `ANTHROPIC_API_KEY` is unset.

**Verify + proof:** `verify:discovery-engine` PASS (210 map combinations + conversational
floor adaptivity + the AI guardrails as pure functions + no-key fallback + the Skip-loop
regression). Full suite green; tsc clean; build exit 0. Live eyes-on: a real browser
click-through walked the interview to the rendered map — all 10 sections, Human Review
prominent, verified counts, **zero "you qualify" language**. A skipped optional no longer loops
(bug caught by the rendered click-through and locked out by a regression test).

---

## Update (2026-06-11) — count honesty + scoping, and discovery flow-state resolution

**Count honesty + scoping (verified-facts integrity).** The map's property count was the
top-8-states subtotal shown as if it were a total (the old "343"). Fixed in
`possibilityEngine.propertyOpportunities`:
- `VerifiedPropertyCounts` now carries `total` (the TRUE count for the scope across **all**
  states — never silently capped), `totalStates`, `scopeLabel`, `scopeAllCategories`,
  `states` (top-N shown), `statesShown`, `truncated`.
- The count is **scoped to interests** (farmer/land → farm & ranch & land categories from the
  verified feed, not all types). Whole-state OZ/HUBZone are shown only in the all-types view
  (omitted when scoped, so they can't overclaim a subset).
- The render labels the scope and state count, and adds "Showing the top N of M states — the
  total above counts every state" whenever truncated. Rendered proof: *"9 verified current
  farm & ranch & land listings across 6 states · as of 2026-06-11."*

**Discovery flow-state resolution (Master Volume VI separation).** `/discover` no longer
defaults to the persona intake for place/property entrypoints:
- `src/lib/discovery/discoveryFlow.ts` — `resolveDiscoveryFlow({route,query,entrypoint,priorState})`
  returns `place-facts | opportunity-zone | property-discovery | possibilities-persona` (query
  `?mode`/`?topic` > path segment > entrypoint hint > prior state > default persona).
- `src/components/discovery/PlaceFirstDiscovery.tsx` — place-first card: location inputs
  (address/parcel/county/state) FIRST, then verified place-fact coverage (OZ, USDA rural,
  FEMA, NPS, NMTC) with source + confidence + disclaimers; persona only as a secondary link.
  Honest: live per-address lookup is gated (Module 22/23), so it never fabricates — it routes
  to the verified inventory where the facts are attached.
- `/discover` page resolves the flow before rendering; `/discover/opportunity-zone` path
  entrypoint added. Anonymous still means "no account," not "skip place facts."

**Verify:** new `verify:discovery-flow` (resolver units + structural + live SSR: place URLs
render the place-first card and NOT the persona card). `verify:discovery-engine` extended with
a count-honesty section (10-state feed proves no silent cap + truncation labeling + scoping).
Full suite green; tsc clean; build exit 0 (`/discover/opportunity-zone` in the manifest). Live
eyes-on confirmed both: place-first OZ card renders location-first, and the persona map shows
the honest scoped count.

---

## Update (2026-06-11) — Furlong Navigator (authoritative spec + addendum)

The core experience is now **Furlong Navigator** — the governed conversational front door
("the pro forma for whatever you own or are looking at"; mission: pathways they didn't know
existed, with evidence and transparency). Public copy never says "AI questionnaire."

**Shipped this slice (build sequence §9 steps 1, 2, 4, 5, 7 + addendum artifacts):**
- **CTA cleanup (§2):** hero renders EXACTLY two CTAs — primary "Start your journey here" →
  `/discover` (Navigator), secondary "What are your possibilities?" → `/explore` (map/wheel).
  Duplicate under-map CTA removed; tour + capstone untouched.
- **`src/lib/navigator/propertyPrivacyDoctrine.ts`** — CONST-PROPERTY-PRIVACY-001: ownership
  refusal (15 paraphrases tested; pursue/buy asks NOT overreached), Fair-Housing steering
  refusal incl. proxies ("good/safe/diverse"), HOPA 55+ designation passes (designation in,
  profiling out), ONE locked gentle redirect line that never hints the data exists.
- **`intakeScrubber.ts`** — architectural lock: owner + protected-class fields stripped at
  ingestion (deep, recursive); `assertNoBannedFields` proves absence at the DATA layer.
- **`listingIntake.ts`** — Crexi/Zillow/Redfin/LoopNet URL or address → property reference by
  parsing the pasted TEXT only; zero network calls (never scrapes/republishes the listing);
  parcel-grade resolution stays gated (address-text until activation).
- **`possibilityCheck.ts`** — the three-answer engine (YES—how / NO—why + honest reroute /
  CAN'T-DETERMINE—why + who to confirm with) with Possibility Confidence, evidence-linked
  "We showed this because…", effort/risk/time-to-start/evidence matrix, and the discovery
  graph (pool→event→parking→storage→dog-park→RV→micro-campground). HONESTY: no fabricated
  dollar bands — the range-with-basis+last-verified contract is first-class, and numbers
  degrade to "market band pending — confirm locally" until Layer B synthesis is verified.
- **`narrativeInterpreter.ts`** — the spine (Person→Story→Assets→Constraints→Pathways→…→
  Journey) walked from the visitor's OWN WORDS; both entry modes (open discovery / bring-your-
  own-dream); proactive widening line.
- **`/api/public/navigator/converse`** — refusal gates FIRST, then interpretation; the locked
  "property qualifies ≠ you qualify" seam renders with pathways; every turn logged PII-free.
- **`FurlongNavigator.tsx`** — ONE conversation, ONE free-text box, NO chip grid/persona
  picker; pathway cards with all addendum fields; graph chain render; anonymous Journey
  Memory in sessionStorage only (continue-your-journey; no identity, nothing server-stored).

**Verification (`verify:navigator`, run pure + LIVE):** 15 ownership + 12 steering probes
refused with the locked line against the running API; HOPA passes; scrubber proven at the data
layer; listing links parsed never fetched; three-answer outputs carry confidence/why-shown/
matrix; graph chains ≥5; hero = exactly 2 CTAs (DOM-counted), none after tour; G-5 isolation
(verify:internal-auth) green. **Eyes-on:** home hero + the full farmer conversation to rendered
pathways screenshotted; ownership probe rendered the exact refusal; "owner" appears only as
the word "landowners" in copy. A repeated-question wart caught by eyes-on was fixed
(non-advancing turns now acknowledge instead of repeating verbatim).

**Honest scope notes for review:** Layer A (ordinance engine), Layer B/D (comps synthesis +
prediction), and the tier gate (§8) are NOT in this slice — pathway legality returns
CAN'T-DETERMINE with the right confirm-with route until Layer A wires, and no revenue number
renders until Layer B verifies. The prior chip-based interview + place-first card remain in
the tree (place-facts flows still resolve to the place-first card; the chip interview is no
longer mounted as the entry flow).
