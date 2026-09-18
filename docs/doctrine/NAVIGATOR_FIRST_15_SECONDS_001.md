# NAVIGATOR — FIRST 15 SECONDS — NAVIGATOR-FIRST-15-SECONDS-001

- **Owner:** Caitlin
- **Status:** Doctrine / specification (NO UI change in this step)
- **Gate:** `npm run verify:navigator-experience`
- **Applies to:** the Furlong Navigator first-touch surface (`/discover` default
  flow + `src/components/navigator/FurlongNavigator.tsx`).

> **Constitutional lock**
> Furlong's first 15 seconds are not onboarding. They are an invitation.
> The user does not need to fit the platform. The platform must make room for
> the user's story.

This doctrine exists because the UX branches before it rearranged interface
elements without first defining the **feeling** to hit. Layout work is not done
when the elements are tidy; it is done when a first-time visitor feels invited
to talk. Future Navigator UX work must satisfy this spec.

## 1. Core doctrine (constitutional rule)

**The first 15 seconds of Furlong must feel like a trusted guide inviting a
conversation, not a portal asking for intake.**

In the first 15 seconds, Furlong should make the user feel:

- welcome
- curious
- unjudged
- unpressured
- not sold to
- not evaluated
- not qualified
- not trapped in a form
- free to start messy
- safe to ask a strange question
- confident that the system will help them think

## 2. What the first screen must NOT feel like

- a bank portal
- a lender intake form
- a real estate lead funnel
- a government application
- a CRM
- a financial planning questionnaire
- a chatbot gimmick
- a self-help worksheet
- a brochure
- an onboarding flow
- a dashboard
- a checklist

## 3. First-screen emotional target

The first screen should communicate **"Tell me what's going on."** — never
**"Please begin our process."**

The user should not feel they must know the correct category before they begin.
They may begin with: a dream · a fear · a property · a life event · a business
idea · a weird question · a financial concern · a messy story · nothing clear at
all.

## 4. Interaction rule

The **input is the primary visual and functional center.** Everything else is
secondary. The page gets out of the way and lets the user talk. The input must
NOT be buried below: marketing copy · repeated headers · large panels · rows of
starter chips · explanations of Furlong · system controls · long disclaimers ·
process descriptions. Legal disclosures may remain but must not visually
dominate the first interaction.

## 5. Opening language target

Tone: plain · calm · human · short · curious · nonjudgmental.

**Acceptable openings:** "What are you trying to figure out?" · "What's going
on?" · "Tell me what you're looking at." · "Bring a property, a goal, or a
problem."

**Forbidden openings (identity-first / category-first):** "Who are you?" · "Tell
us about yourself." · "What is your profile?" · "What type of user are you?" ·
"Please select a pathway."

## 6. Example handling

Examples may exist but must be **subtle** — suggestions, not categories.

- **Allowed:** one quiet line, e.g. `Examples: farm · business · inherited
  property · financing · job loss · just exploring`.
- **Not allowed:** large chip wall · checklist · category picker · worksheet
  grid · onboarding flow · any decision tree before the user speaks.

## 7. Controls rule

Save, continue, privacy, start-over, and data-rights controls may exist but must
not dominate first touch — they belong in **secondary** position. The user
should see the invitation to speak **before** seeing system-management controls.

## 8. Success criteria

A reviewer seeing the first-touch screen should say:

> "This feels like I can just start talking."

NOT: "This feels like I need to fill something out." · "This feels like a bank."
· "This feels like a website explaining itself." · "This feels like a chatbot
toy."

## 9. Anti-drift assertions (enforced by `verify:navigator-experience`)

Future UX work must NOT reintroduce, on the first-touch surface:

1. an **identity-first** opening prompt ("who are you", "tell us about
   yourself", "what type of user", "your profile", "select a pathway");
2. a large **Discovery-Promise panel** (a "we'll help you explore" block of
   value-prop pills);
3. a large **starter-chip wall** (a clickable category grid before the user
   speaks);
4. **duplicated** page-level and widget-level headers/titles;
5. the input **buried** below explanatory content (the opening line + input must
   precede pathway/decision/results panels and the controls footer in source
   order);
6. **application / intake / qualification / registration / submission** language
   on first touch.

The gate enforces what is statically checkable in source (1, 2, 3, 4, 6 and the
opening-language contract); the felt criteria in §8 remain a **human review**
step — the gate is a floor, not a substitute for founder review.

## 10. Review status of the existing UX branches (informational; do NOT merge)

| Branch | Status |
|---|---|
| `build-navigator-conversational-ux @ edddcea` | rejected by founder review — too worksheet/onboarding-like |
| `build-navigator-radical-simplification @ bc5b948` | improved, but still too much page/portal feeling |
| `build-navigator-foundation @ 55d36dc` | right direction structurally (kitchen-table), but NOT approved |

Do not merge these UX branches unless separately approved by founder review.

`build-navigator-debug-001 @ 4c36037` is **not** a UX branch — it carries
business-expansion regression tests + better client-side error logging and may
be considered separately for merge.

## 11. Scope

Doctrine/specification only. No Navigator UI, routing, security, privacy,
blocker counts, financing, or production posture changes in this step.
