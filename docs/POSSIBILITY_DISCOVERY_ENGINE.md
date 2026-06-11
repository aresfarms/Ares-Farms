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
