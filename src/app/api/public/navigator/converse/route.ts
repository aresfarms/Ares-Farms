/**
 * POST /api/public/navigator/converse — Furlong Navigator (anonymous, Tier-1).
 *
 * One conversation, one open question at a time, walking the spine:
 * Person → Story → Assets → Constraints → Pathways → … → Journey.
 *
 * ORDER OF OPERATIONS (defense-in-depth, spec §7):
 *  1. REFUSAL GATES FIRST — ownership (G-1) and steering/demographic (G-2)
 *     intent is classified BEFORE any interpretation; both reply with the ONE
 *     locked gentle line + redirect to possibility. The refusal never hints the
 *     data exists (it can't — the intake scrubber keeps it out of reach).
 *  2. Interpret the visitor's own words (deterministic floor; the AI guide can
 *     rephrase questions at this same seam — Tier-1, logged, fallback-floored).
 *  3. Advance the arc; at Pathways, run the three-answer engine and return
 *     pathway assessments with confidence / why-shown / effort / risk / ranges
 *     contract — plus the proactive-widening line (guide, not calculator).
 *
 * Anonymous: no identity captured; journey state lives with the CLIENT
 * (sessionStorage) and is round-tripped here, never stored server-side.
 */

import { NextResponse } from "next/server";

import { classifyRefusal, REFUSAL_LINE } from "@/lib/navigator/propertyPrivacyDoctrine";
import { interpretMessage, questionForNode, wideningLine, FRESH_JOURNEY, type JourneyState } from "@/lib/navigator/narrativeInterpreter";
import { assessPathways, discoveryGraphChain } from "@/lib/navigator/possibilityCheck";
import { logInterviewTurn, hashTranscript } from "@/lib/discovery/aiInterview";

export const runtime = "nodejs";

interface Body {
  message?: string;
  journey?: JourneyState;
}

export async function POST(req: Request) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { body = {}; }

  const message = (body.message ?? "").slice(0, 4000);
  let journey: JourneyState = body.journey && Array.isArray(body.journey.story)
    ? { ...FRESH_JOURNEY, ...body.journey }
    : FRESH_JOURNEY;

  // Kickoff (no message): the one open question. No chips, no form.
  if (!message.trim()) {
    logInterviewTurn({ source: "fallback", slot: "navigator:open", ok: true, transcriptHash: hashTranscript([]) });
    return NextResponse.json({
      kind: "question",
      node: journey.node,
      text: questionForNode(journey),
      journey,
    });
  }

  // 1 — refusal gates BEFORE anything else (G-1 / G-2).
  const refusal = classifyRefusal(message);
  if (refusal) {
    logInterviewTurn({ source: "fallback", slot: `navigator:refusal:${refusal}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
    return NextResponse.json({
      kind: "refusal",
      refusal,
      text: `${REFUSAL_LINE} ${questionForNode(journey)}`,
      journey,
    });
  }

  // 2 — interpret + advance the arc.
  const prevNode = journey.node;
  journey = interpretMessage(journey, message);

  // 3 — at Pathways (or beyond), assess + keep the conversation going.
  if (journey.node === "pathways" || journey.node === "evidence" || journey.node === "programs") {
    const pathways = assessPathways(journey.context);
    const explored = journey.exploredPathways;
    journey = { ...journey, exploredPathways: [...new Set([...explored, ...pathways.map((p) => p.id)])] };
    const chainStart = pathways.find((p) => p.graphNeighbors.length > 0)?.id ?? pathways[0]?.id;
    logInterviewTurn({ source: "fallback", slot: `navigator:pathways:${journey.context.propertyKind}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(interpreted)" }]) });
    return NextResponse.json({
      kind: "pathways",
      node: journey.node,
      text:
        (journey.property?.addressText
          ? `Here's what ${journey.property.addressText} could become — honestly, including the No's and the can't-determines. `
          : "Here's what this could become — honestly, including the No's and the can't-determines. ") +
        (wideningLine(explored, pathways.map((p) => p.id)) ?? ""),
      pathways,
      graphChain: chainStart ? discoveryGraphChain(chainStart) : [],
      programsSeam: "A property qualifying for a program is a fact about the property. Whether YOU qualify is a licensed professional's call — property qualifies ≠ you qualify.",
      journey,
    });
  }

  // Otherwise: the next single open question. When the arc did not advance,
  // acknowledge what they said instead of repeating the same line verbatim
  // (eyes-on wart: identical question twice reads like a form, not a guide).
  const q = questionForNode(journey);
  const text = journey.node === prevNode
    ? `Heard — that helps more than you'd think. One more thing: ${q.charAt(0).toLowerCase()}${q.slice(1)}`
    : q;
  logInterviewTurn({ source: "fallback", slot: `navigator:${journey.node}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(interpreted)" }]) });
  return NextResponse.json({
    kind: "question",
    node: journey.node,
    text,
    journey,
  });
}
