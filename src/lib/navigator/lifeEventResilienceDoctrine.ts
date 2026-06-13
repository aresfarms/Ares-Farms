/**
 * LIFE-EVENT-RESILIENCE-001 — registry + guardrail contract (doctrine-only,
 * 2026-06-12). Doc: docs/doctrine/LIFE_EVENT_RESILIENCE_001.md
 *
 * CORE RULE: Furlong needs the NUMBERS, not the NAMES. Life-event property
 * support (divorce, death, job loss, partition, …) works from property value,
 * mortgage balance, payment, ownership structure, timeline, and each party's
 * goal — by RELATIONSHIP CATEGORY only, never personal identity.
 *
 * CONSTITUTIONAL LOCK: life events change the question; they do not change the
 * privacy rule. All existing guardrails (owner/resident privacy, private-
 * address limits, harassment/stalking protections, advice boundaries,
 * decision-neutrality, professional-module separation) remain fully in force.
 *
 * NO public feature flow is activated by this module (LIFE_EVENT_FLOWS_LIVE
 * stays false); it is the contract any future life-event flow must satisfy.
 */

export const LIFE_EVENT_DOCTRINE_ID = "LIFE-EVENT-RESILIENCE-001";
export const LIFE_EVENT_FLOWS_LIVE = false;

export const COVERED_LIFE_EVENTS = [
  "divorce", "separation", "co-borrower exit", "death", "inheritance", "estate property",
  "partition", "buyout", "foreclosure risk", "job loss", "income shock", "relocation",
  "disability or health disruption", "business failure", "retirement transition",
  "family hardship", "forced sale risk",
] as const;

export const ALLOWED_CORE_SUPPORT = [
  "estimated property value range", "mortgage balance", "estimated equity", "monthly carrying cost",
  "affordability runway", "sale path", "refinance path", "buyout path", "rental/hold path",
  "temporary bridge path", "foreclosure-avoidance questions to ask",
  "partition / estate / divorce property options at a general level", "documentation checklist",
  "professional handoff points", "risks, costs, timelines, and tradeoffs",
] as const;

/** §5 — relationship category is ENOUGH; personal identity is never needed. */
export const ALLOWED_RELATIONSHIP_CATEGORIES = [
  "spouse", "ex-spouse", "co-owner", "parent", "sibling", "friend", "estate", "trustee",
  "lender", "landlord", "tenant", "buyer", "seller",
] as const;

/** §5 — identity fields Furlong must never require or expose. */
export const BANNED_IDENTITY_FIELDS = [
  "spouse name", "ex-spouse name", "co-owner name", "parent/sibling/friend name",
  "deceased person name", "neighbor name", "owner/resident identity",
  "personal contact information", "private-party targeting information",
] as const;

/** §6 — required framing, locked verbatim. */
export const LIFE_EVENT_FRAMING =
  "I do not need names to help map the property options. I can work from property value, mortgage balance, " +
  "monthly payment, ownership structure, timeline, and what each party is trying to accomplish.";

/** §7 — advisory boundary. */
export const LIFE_EVENT_NOT_PROVIDED = [
  "legal advice", "divorce advice", "foreclosure legal strategy", "bankruptcy advice", "tax advice",
  "court strategy", "lender approval", "binding valuation", "professional representation",
] as const;
export const LIFE_EVENT_MAY_PROVIDE = [
  "general pathway comparison",
  "questions to ask a lawyer, lender, CPA, mediator, court, servicer, or licensed professional",
  "decision-neutral options and tradeoffs",
] as const;

/** §9 — required output shape for life-event responses. */
export const LIFE_EVENT_OUTPUT_SHAPE = [
  "What Furlong can help with", "What information is needed", "Paths available", "Numbers that matter",
  "Risks / deadlines", "Professionals to consult", "Decision remains yours",
] as const;

/** §10 — gates that life-event flows may NEVER bypass. */
export const LIFE_EVENT_NON_BYPASSABLE_GUARDRAILS = [
  "owner/resident privacy", "private-address acquisition limits", "harassment/stalking protections",
  "legal/tax/financial-advice boundaries", "decision-neutrality gate", "professional-module separation",
] as const;

/** A response text honors identity minimization if it never asks for a name. */
export function asksForPersonalName(text: string): boolean {
  return /\b(?:what(?:'s| is)\s+(?:your|their|his|her)\s+name|full\s+name|name\s+of\s+(?:your|the)\s+(?:spouse|ex|co-?owner|sibling|parent|deceased|neighbor)|(?:your|their|his|her|the)\s+(?:spouse|ex(?:-spouse)?|co-?owner|sibling|parent|partner|neighbor|deceased)(?:'s)?\s+(?:full\s+)?name)\b/i.test(text);
}
