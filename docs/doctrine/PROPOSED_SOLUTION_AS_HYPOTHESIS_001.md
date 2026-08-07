# PROPOSED SOLUTION AS HYPOTHESIS — PROPOSED-SOLUTION-AS-HYPOTHESIS-001

- **Owner:** Caitlin
- **Status:** Doctrine + implemented conversation layer
- **Code:** `src/lib/navigator/proposedSolutionHypothesis.ts`, router tier 4.38 in
  `src/lib/navigator/navigatorTurnRouter.ts`
- **Gate:** `npm run verify:proposed-solution-hypothesis`

> **Constitutional lock**
> Furlong does not blindly optimize the first answer the user gives. Furlong
> helps the user understand whether that answer is actually serving the
> destination.
>
> Furlong is not a fulfillment engine. Furlong is a pathway intelligence engine.
> The first thing a user asks for may be correct — it may also be only one
> possible route. Furlong's job is to show the map before narrowing the road.

## 1. Core doctrine

A user's stated asset or expansion plan is **valid**, but it is **not
automatically the final destination.** Furlong respects the user's stated path
while also asking what the user is trying to accomplish.

The stated path is treated as a **hypothesis** to test against: objective ·
risk · capital · time · concentration · alternatives · opportunity cost ·
ownership reality.

## 2. What this layer does NOT do

- Does **not** tell the user their path is wrong.
- Does **not** decide for the user.
- Does **not** steer.
- Does **not** block the stated path.
- Does **not** remove existing regulated-business / asset routing.

## 3. Trigger — proposed-solution (expansion) inputs

This runs BEFORE narrow asset-route language and fires only on a **scale /
portfolio / expansion** signal — never on an ordinary single goal. Examples that
trigger it:

- "I own a laundromat and want to buy 10 more in Ohio"
- "I own a farm and want five more farms"
- "I want to buy ten RV parks"
- "I want to buy another hotel"
- "I want a portfolio of self-storage facilities"
- "I want to buy 20 rental houses"
- "I want to buy a $10M property"
- "I want to expand into Albuquerque"

A bare quantity that is a **size or budget** ("100 acres", a dollar figure tied
to one parcel) does NOT trigger it.

## 4. Required response behavior

For a proposed-solution input, Navigator (turn intent `EXPLORE_PROPOSED_SOLUTION`):

1. **Acknowledges** the stated path ("More laundromats could be the right path.").
2. **Validates** it might be the right path ("Before we assume it is…").
3. **Asks the objective** the user is actually trying to achieve.
4. **Offers comparison** against alternatives (smaller/larger/diversified/
   different class/wait).
5. **Keeps the stated path open** ("If you already know this is the path, just
   say so and we'll work through it directly.").

The classifier-style "X is a real, regulated acquisition…" language **may appear
later**, after the objective is understood — never as the first response.

## 5. Objective discovery categories (none mandatory)

more monthly income · building enterprise value · resale/exit value · passive
ownership · replacing a job · family wealth · diversification · geographic
expansion · tax/program strategy · lifestyle change · operational scale ·
retirement income · inflation hedge · community/stewardship · "I just like this
asset". The user may decline all of them and confirm the stated path.

## 6. Alternative-pathway comparison

After the objective is known, Navigator may compare the stated path against a
smaller/larger version, a diversified portfolio, a different asset class, a
wait/pause path, a professional-review path, or a do-nothing-for-now path. It
shows tradeoffs and never recommends one as best. **The decision remains the
user's.**

## 7. Concentration-risk framing (neutral, not a warning label)

When the user proposes many of the same asset, the reply includes a practical
thinking point: owning more of the same asset builds scale but can concentrate
risk in one industry, labor model, utility profile, and market — worth comparing
before committing, not a reason to avoid it.

## 8. Confirmation honors the user

If the user confirms ("I just want ten more laundromats", "just want…", "go with
that", "proceed"), or has already been asked this turn-cycle
(`journey.proposedSolutionAsked`), the layer steps aside and the **existing asset
routing continues** — for laundromats, the regulated-business acquisition path
(licensing, permitted use, environmental, building condition, utilities, operator
experience).

## 9. First-response tone

Human, not a memo. Preferred: "That could be the right path." · "Before we assume
it is…" · "What are you trying to accomplish?" · "Let's compare the routes." ·
"If you still want that path, we can absolutely work through it." Forbidden as a
first response: classifier/compliance/underwriting/checklist/category-label
phrasing.

## 10. Scope / posture

Conversation-and-doctrine layer only. No change to security, privacy, blocker
counts, financing gating, or production posture. Existing regulated-business and
asset routing preserved; this layer precedes it and always yields to user
confirmation.
