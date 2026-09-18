/**
 * POST /api/public/discovery/converse — the conversational discovery interview.
 *
 * Anonymous + Tier-1 advisory. Input is the interview answers + visible turns +
 * the latest answer (a slot + chosen option codes, optional free text). The route:
 *   1. PII-guards + injection-guards any free text (never stored, never echoed);
 *   2. folds the chosen option codes into the typed answers (deterministic);
 *   3. decides: map-ready, or the next question — trying the AI guide first and
 *      falling back to the deterministic floor on any failure/uncertainty;
 *   4. logs the turn (PII-free).
 * The Possibility Map itself is produced by the verified deterministic engine on
 * the client from the accumulated answers + the verified feed — the model never
 * fabricates programs, numbers, or eligibility.
 */

import { NextResponse } from "next/server";

import { guidedIntakeFeed } from "@/lib/property/guidedIntakeFeed";
import { PROGRAM_REGISTRY } from "@/lib/capital-graph/programRegistry";
import {
  emptyInterview, applyAnswer, remainingSlots, hasEnoughForMap, questionForSlot,
  SLOT_OPTIONS, type InterviewState, type SlotId, type QuestionStep,
} from "@/lib/discovery/conversationEngine";
import { groundingFacts, looksLikePII, looksLikeInjectionOrOffTopic } from "@/lib/discovery/interviewPolicy";
import { aiNextQuestion, logInterviewTurn, hashTranscript, type Turn } from "@/lib/discovery/aiInterview";
import type { DiscoveryAnswers } from "@/lib/discovery/possibilityEngine";

export const runtime = "nodejs";

interface Body {
  answers?: Partial<DiscoveryAnswers>;
  turns?: Turn[];
  /** Slots already presented (so a SKIPPED optional is never re-asked). */
  askedSlots?: SlotId[];
  lastAnswer?: { slot: SlotId; values?: string[]; freeText?: string };
}

function feedDerived() {
  const feed = guidedIntakeFeed();
  const availableStates = feed.states.filter((s) => s.total > 0).sort((a, b) => b.total - a.total).map((s) => s.abbr);
  const catLabels: Record<string, string> = { homes: "Homes", "farms-ranches": "Farms & Ranches", land: "Land", commercial: "Commercial", hospitality: "Hospitality", businesses: "Businesses", misc: "Misc" };
  const catSet = new Map<string, string>();
  for (const s of feed.states) for (const k of Object.keys(s.byCategory)) catSet.set(k, catLabels[k] ?? k);
  const availableCategories = [...catSet.entries()].map(([value, label]) => ({ value, label }));
  return { feed, availableStates, availableCategories };
}

export async function POST(req: Request) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { body = {}; }

  const { feed, availableStates, availableCategories } = feedDerived();
  let state: InterviewState = {
    ...emptyInterview(availableStates, availableCategories),
    answers: {
      goals: [], resources: [], constraints: [], values: [],
      ...body.answers,
    } as DiscoveryAnswers,
  };

  const turns: Turn[] = Array.isArray(body.turns) ? body.turns.slice(-20) : [];

  // ── 1. fold the latest answer (option codes only) + guard free text ─────────
  let steer: string | undefined;
  if (body.lastAnswer) {
    const ft = body.lastAnswer.freeText ?? "";
    if (ft && looksLikePII(ft)) steer = "No need to share personal details — your interests are all we use here.";
    else if (ft && looksLikeInjectionOrOffTopic(ft)) steer = "Let's stay on your possibilities — here's the next question.";
    state = applyAnswer(state, body.lastAnswer.slot, body.lastAnswer.values ?? []);
  }

  // ── 2. map-ready? ────────────────────────────────────────────────────────────
  // A slot already PRESENTED is never re-asked (an optional answered with no
  // selection — a Skip — is "done", not "unanswered"). Required slots (persona,
  // goals, property-interest) gate hasEnoughForMap, so the map degrades
  // gracefully if any were skipped.
  const allowed = remainingSlots(state, Array.isArray(body.askedSlots) ? body.askedSlots : []);
  // Each slot is presented at most once, so `allowed` strictly shrinks and the
  // interview always terminates. Wrap up once nothing un-asked remains (or, as a
  // safety net, once we have the essentials and only un-asked optionals remain).
  const onlyOptionalLeft = allowed.every((s) => ["timeHorizon", "resources", "constraints", "values"].includes(s));
  if (allowed.length === 0 || (hasEnoughForMap(state) && onlyOptionalLeft && allowed.length <= 1)) {
    logInterviewTurn({ source: "fallback", slot: "(map-ready)", ok: true, transcriptHash: hashTranscript(turns) });
    return NextResponse.json({ kind: "map-ready", answers: state.answers });
  }

  // ── 3. next question — AI guide first, deterministic floor on fallback ──────
  const grounding = groundingFacts(PROGRAM_REGISTRY.map((p) => p.name), feed);
  // Skip the model when we've already decided to steer (injection/PII) — keep it deterministic.
  const ai = steer ? null : await aiNextQuestion(state, turns, allowed, grounding);

  const slot: SlotId = ai?.slot ?? allowed[0];
  const canonical: QuestionStep = questionForSlot(slot, state);
  const prompt = ai?.question ?? canonical.prompt;
  const options = slot === "propertyStates"
    ? availableStates.map((s) => ({ value: s, label: s }))
    : slot === "propertyCategories" ? availableCategories : SLOT_OPTIONS[slot];

  return NextResponse.json({
    kind: "question",
    slot,
    prompt: steer ? `${steer} ${prompt}` : prompt,
    options,
    multi: canonical.multi,
    allowFreeText: canonical.allowFreeText ?? false,
    source: ai ? "ai" : "guide",
    answers: state.answers,
  });
}
