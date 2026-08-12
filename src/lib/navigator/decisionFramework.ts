/**
 * Navigator Decision Framework (constitutional addendum, 2026-06-11).
 *
 * The Navigator is NOT a search engine, calculator, listing portal, lender,
 * broker, or recommendation engine. Every completed journey attempts to answer
 * the FOUR canonical questions:
 *   1. What is realistically achievable?
 *   2. What obstacles exist?
 *   3. What alternatives exist?
 *   4. Which path appears to have the highest probability of success?
 *
 * This module derives those four outputs DETERMINISTICALLY from the three-
 * answer pathway assessments — synthesis of what was already honestly assessed,
 * never a new claim. The probability assessment is plain-language, RELATIVE,
 * and advisory: no guarantees, no promises, no official determinations. The
 * goal is not to tell visitors what they should do — it is to help them
 * understand what is realistically possible. "Pathways, not promises."
 */

import type { PathwayAssessment } from "./possibilityCheck";

export const DECISION_FRAMEWORK_VERSION = "navigator-decision-framework-v0.1.0";

export const PATHWAYS_NOT_PROMISES = "Pathways, not promises.";

export interface DecisionSummary {
  /** 1 — opportunities realistically available given goals/assets/constraints/evidence. */
  achievable: { pathway: string; how: string }[];
  /** 2 — the constraints that affect success (legal, HOA, market, data, …). */
  obstacles: { pathway: string; obstacle: string; confirmWith: string[] }[];
  /** 3 — reroutes, adjacent pathways, and connected possibilities. */
  alternatives: { from: string; alternative: string }[];
  /** 4 — plain-language RELATIVE probability assessment. Advisory only. */
  probability: {
    assessment: string;
    /** The pathway with the strongest relative footing today (if any). */
    leadingPathway: string | null;
    advisory: string;
  };
}

const LEVEL_SCORE = { low: 2, medium: 1, high: 0 } as const;
const CONF_SCORE = { high: 3, medium: 2, low: 1, "cant-determine": 0 } as const;

/** Relative standing of a pathway today (higher = stronger footing). Not a promise. */
function relativeScore(p: PathwayAssessment): number {
  const answer = p.answer === "YES" ? 4 : p.answer === "CANT_DETERMINE" ? 1 : 0;
  return answer * 4 + CONF_SCORE[p.confidence] * 2 + LEVEL_SCORE[p.effort] + LEVEL_SCORE[p.risk] + CONF_SCORE[p.evidenceStrength === "high" ? "high" : p.evidenceStrength === "medium" ? "medium" : "low"];
}

/** Derive the four canonical outputs from the assessed pathways. Pure. */
export function deriveDecisionSummary(pathways: PathwayAssessment[]): DecisionSummary {
  const achievable = pathways
    .filter((p) => p.answer === "YES")
    .map((p) => ({ pathway: p.title, how: p.detail }));

  const obstacles = pathways
    .filter((p) => p.answer === "NO" || p.answer === "CANT_DETERMINE")
    .map((p) => ({ pathway: p.title, obstacle: p.detail, confirmWith: p.confirmWith }));

  const titleOf = (id: string) => pathways.find((p) => p.id === id)?.title ?? id.replace(/-/g, " ");
  const alternatives: { from: string; alternative: string }[] = [];
  for (const p of pathways) {
    if (p.reroute) alternatives.push({ from: p.title, alternative: p.reroute });
    for (const n of p.graphNeighbors.slice(0, 1)) {
      alternatives.push({ from: p.title, alternative: `Connected pathway worth a look: ${titleOf(n)}.` });
    }
  }

  // Relative probability — advisory, plain-language, never a guarantee.
  const ranked = [...pathways].sort((a, b) => relativeScore(b) - relativeScore(a));
  const lead = ranked[0];
  const leadStrong = lead && relativeScore(lead) > 0;
  const assessment = leadStrong
    ? lead.answer === "YES"
      ? `Of the pathways we can assess today, "${lead.title}" appears to have the highest relative likelihood of success — it's a ${lead.answer === "YES" ? "broadly available arrangement" : "possibility"} with ${lead.effort} effort, ${lead.risk} risk, and ${lead.evidenceStrength} evidence behind it. The others mostly wait on confirmations (ordinances, HOA documents, or market data) before their odds can be read honestly.`
      : `None of the pathways can be called likely yet — most wait on confirmations (ordinances, HOA documents, or market data). "${lead.title}" currently has the strongest relative footing to investigate first, based on effort, risk, and evidence so far.`
    : "We don't have enough verified evidence to rank these pathways yet — every one needs a confirmation first. That's an honest answer, not a failure.";
  return {
    achievable,
    obstacles,
    alternatives: alternatives.slice(0, 8),
    probability: {
      assessment,
      leadingPathway: leadStrong ? lead.title : null,
      advisory:
        "This is a relative, probability-oriented read of what we can verify today — advisory only. " +
        "No guarantees, no promises, no official determinations. " + PATHWAYS_NOT_PROMISES,
    },
  };
}
