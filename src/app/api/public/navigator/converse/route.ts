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
 *  1b. NOVELTY/FANTASY BUILD BOUNDARY (patch 2026-06-11) — sexually explicit,
 *     illegal, unsafe, or code-evading structures are refused; fantasy and
 *     untranslated novelty builds get the locked boundary reply and a six-flag
 *     code-compliance gate that BLOCKS pathway generation until the idea is
 *     translated into a lawful, non-sexual, real-world, code-checkable project.
 *  2. Interpret the visitor's own words (deterministic floor; the AI guide can
 *     rephrase questions at this same seam — Tier-1, logged, fallback-floored).
 *  3. Advance the arc; at Pathways, run the three-answer engine and return
 *     pathway assessments with confidence / why-shown / effort / risk / ranges
 *     contract — plus the proactive-widening line (guide, not calculator).
 *
 * EVERY response carries a machine-readable turn_intent; the loop guard
 * compares INTENT (not just text) — if next_turn_intent would equal
 * previous_turn_intent, the repeat is blocked and a different allowed action
 * is chosen (turnIntent.ts alternate ladder). The verbatim-text anti-repeat
 * remains as an independent second layer.
 *
 * Anonymous: no identity captured; journey state lives with the CLIENT
 * (sessionStorage, opt-in only) and is round-tripped here, never stored
 * server-side.
 */

import { NextResponse } from "next/server";

import { classifyRefusal, REFUSAL_LINE } from "@/lib/navigator/propertyPrivacyDoctrine";
import {
  interpretMessage, questionForNode, wideningLine, detectPropertyIntent,
  GUIDED_DISCOVERY_OPENER, GUIDED_DISCOVERY_FOLLOWUP, FRESH_JOURNEY, type JourneyState,
} from "@/lib/navigator/narrativeInterpreter";
import {
  classifyNoveltyConcept, gateForCategory, isDisallowedOutright, noveltyGateClear,
  translatesToRealWorld, clearedGate, NOVELTY_BOUNDARY_REPLY, NOVELTY_REFUSAL_REPLY,
} from "@/lib/navigator/noveltyBuildDoctrine";
import { guardTurnIntent, intentForNode, type TurnIntent } from "@/lib/navigator/turnIntent";
import { assessPathways, discoveryGraphChain } from "@/lib/navigator/possibilityCheck";
import { deriveDecisionSummary } from "@/lib/navigator/decisionFramework";
import { logInterviewTurn, hashTranscript } from "@/lib/discovery/aiInterview";
import { guardPublicInput } from "@/security/realityPlatform/publicInputGuard";
import { gateOutputText, gatePathwayPayload } from "@/security/realityPlatform/navigatorOutputGate";
import { appendReplay, hashEvidence, hashOutput } from "@/security/realityPlatform/realitySecurityReplay";
import { RATE_LIMIT_MESSAGE } from "@/security/realityPlatform/navigatorRateLimit";
import { buildSearchGuidance, CANDIDATE_SOURCES_LIVE } from "@/lib/navigator/searchGuidance";

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
    const guarded = guardTurnIntent(journey, intentForNode(journey.node), questionForNode(journey));
    journey = rememberPrompt(guarded.journey, guarded.text);
    logInterviewTurn({ source: "fallback", slot: "navigator:open", ok: true, transcriptHash: hashTranscript([]) });
    return NextResponse.json({
      kind: "question",
      node: journey.node,
      text: guarded.text,
      turnIntent: guarded.intent,
      journey,
    });
  }

  // 0 — REALITY-SEC-001 INPUT GUARD: payload/script/injection/abuse checks
  // run before everything (the doctrine refusal gates below stay as the
  // specific G-1/G-2 path so their recovery routing is preserved).
  const guard = guardPublicInput(message, journey.guardCounters);
  if (guard.decision === "QUARANTINE" || guard.decision === "RATE_LIMIT" || guard.decision === "ESCALATE_SECURITY") {
    journey = { ...journey, guardCounters: { ...journey.guardCounters, rejections: journey.guardCounters.rejections + 1 } };
    const text = guard.decision === "RATE_LIMIT" || guard.decision === "ESCALATE_SECURITY"
      ? RATE_LIMIT_MESSAGE
      : "That input isn't something we can process safely. Let's keep going in plain words — " + questionForNode(journey).charAt(0).toLowerCase() + questionForNode(journey).slice(1);
    const guarded = guardTurnIntent(journey, "REFUSE_AND_REDIRECT", text);
    journey = guarded.journey;
    appendReplay({
      ts: new Date().toISOString(), inputDecision: guard.decision, scrubbedFieldCount: 0,
      contextZones: [], urlSandboxVerdict: guard.signals.includes("unsafe-url") ? "BLOCKED" : null,
      privacyFirewallOk: true, outputGateOk: true, refusalReason: guard.reasons.join("; ") || guard.decision,
      evidenceBundleHash: hashEvidence(guard.signals), renderedOutputHash: hashOutput(RATE_LIMIT_MESSAGE),
    });
    logInterviewTurn({ source: "fallback", slot: `navigator:guard:${guard.decision}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
    return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, journey });
  }
  if (guard.decision === "REFUSE_AND_REDIRECT" && !classifyRefusal(message)) {
    // injection / prompt-extraction (non-G1/G2): refuse generically + continue.
    journey = { ...journey, guardCounters: { ...journey.guardCounters, refusals: journey.guardCounters.refusals + 1 } };
    const follow = nextPrompt(journey, journey.node);
    const guarded = guardTurnIntent(journey, "REFUSE_AND_REDIRECT", `Let's stay on your possibilities. ${follow}`);
    journey = rememberPrompt(guarded.journey, guarded.text);
    appendReplay({
      ts: new Date().toISOString(), inputDecision: guard.decision, scrubbedFieldCount: 0, contextZones: [],
      urlSandboxVerdict: null, privacyFirewallOk: true, outputGateOk: true,
      refusalReason: guard.reasons.join("; "), evidenceBundleHash: hashEvidence(guard.signals), renderedOutputHash: hashOutput(guarded.text),
    });
    logInterviewTurn({ source: "fallback", slot: "navigator:guard:injection", ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
    return NextResponse.json({ kind: "refusal", refusal: "injection", text: guarded.text, turnIntent: guarded.intent, journey });
  }

  // 1 — refusal gates BEFORE anything else (G-1 / G-2). Refuse ONCE with the
  // locked line, then INSPECT THE REMAINING INTENT (loop fix 2026-06-11): a
  // steering ask that also wants property discovery ("find me something in a
  // white neighborhood") gets the refusal AND the non-demographic guided-
  // discovery redirect — never a dead end back to the asset prompt.
  const refusal = classifyRefusal(message);
  if (refusal) {
    journey = { ...journey, guardCounters: { ...journey.guardCounters, refusals: journey.guardCounters.refusals + 1 } };
    const residual = detectPropertyIntent(message, null);
    const wantsDiscovery = residual === "WANTS_PROPERTY_DISCOVERY" || residual === "NO_PROPERTY_YET";
    if (wantsDiscovery) {
      journey = {
        ...journey,
        intent: "PROTECTED_STEERING_REFUSED",
        guidedDiscovery: true,
        entryMode: journey.entryMode ?? "open-discovery",
      };
      journey = { ...journey, node: journey.node === "person" ? "story" : journey.node };
    }
    const followOn = wantsDiscovery
      ? `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`
      : nextPrompt(journey, journey.node);
    const guarded = guardTurnIntent(journey, "REFUSE_AND_REDIRECT", `${REFUSAL_LINE} ${followOn}`);
    journey = rememberPrompt(guarded.journey, guarded.text);
    logInterviewTurn({ source: "fallback", slot: `navigator:refusal:${refusal}${wantsDiscovery ? ":guided-discovery" : ""}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
    return NextResponse.json({
      kind: "refusal",
      refusal,
      text: guarded.text,
      turnIntent: guarded.intent,
      journey,
    });
  }

  // 1b — NOVELTY / FANTASY BUILD CODE REALITY BOUNDARY (patch 2026-06-11).
  // Disallowed concepts (sexual / illegal-unsafe / code-evading) are refused
  // outright; fantasy or untranslated novelty gets the locked boundary reply
  // asking for the real-world translation. Neither advances the arc, and the
  // six-flag gate blocks pathway generation until translated. A message that
  // supplies the translation clears the gate and flows on normally.
  const noveltyCat = classifyNoveltyConcept(message);
  if (noveltyCat) {
    journey = { ...journey, noveltyGate: gateForCategory(noveltyCat) };
    const disallowed = isDisallowedOutright(noveltyCat);
    const baseIntent: TurnIntent = disallowed ? "REFUSE_AND_REDIRECT" : "CLARIFY_OUT_OF_SCOPE";
    const guarded = guardTurnIntent(journey, baseIntent, disallowed ? NOVELTY_REFUSAL_REPLY : NOVELTY_BOUNDARY_REPLY);
    journey = rememberPrompt(guarded.journey, guarded.text);
    logInterviewTurn({ source: "fallback", slot: `navigator:novelty:${noveltyCat}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
    return NextResponse.json({
      kind: disallowed ? "refusal" : "question",
      ...(disallowed ? { refusal: "novelty-disallowed" } : {}),
      node: journey.node,
      text: guarded.text,
      turnIntent: guarded.intent,
      noveltyGate: journey.noveltyGate,
      journey,
    });
  }
  if (journey.noveltyGate && !noveltyGateClear(journey.noveltyGate) && translatesToRealWorld(message)) {
    journey = { ...journey, noveltyGate: clearedGate() };
  }

  // 2 — interpret + advance the arc.
  const prevNode = journey.node;
  const wasGuided = journey.guidedDiscovery;
  journey = interpretMessage(journey, message);

  // 3 — at Pathways (or beyond), assess + keep the conversation going.
  if (journey.node === "pathways" || journey.node === "evidence" || journey.node === "programs") {
    // HARD RULE: no pathway cards, pro formas, program matches, or property
    // suggestions for a novelty/fantasy build until the concept is translated
    // into a lawful, non-sexual, real-world, code-checkable project.
    if (!noveltyGateClear(journey.noveltyGate)) {
      const guarded = guardTurnIntent(journey, "CLARIFY_OUT_OF_SCOPE", NOVELTY_BOUNDARY_REPLY);
      journey = rememberPrompt(guarded.journey, guarded.text);
      logInterviewTurn({ source: "fallback", slot: "navigator:novelty:gate-blocked-pathways", ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
      return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, noveltyGate: journey.noveltyGate, journey });
    }
    const pathways = assessPathways(journey.context);
    const explored = journey.exploredPathways;
    journey = { ...journey, exploredPathways: [...new Set([...explored, ...pathways.map((p) => p.id)])] };
    const chainStart = pathways.find((p) => p.graphNeighbors.length > 0)?.id ?? pathways[0]?.id;
    logInterviewTurn({ source: "fallback", slot: `navigator:pathways:${journey.context.propertyKind}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(interpreted)" }]) });
    const decision = deriveDecisionSummary(pathways);
    // Search-and-bring-back guidance: ONLY when no property is in hand, and
    // never invented matches — CANDIDATE_SOURCES_LIVE gates any future feed.
    const searchGuidance = !journey.property && !CANDIDATE_SOURCES_LIVE ? buildSearchGuidance(journey.context) : null;
    // REALITY-SEC-001 OUTPUT GATE: nothing renders that fails the final checks.
    const payloadGate = gatePathwayPayload(pathways);
    const textGate = gateOutputText(JSON.stringify(decision));
    if (!payloadGate.ok || !textGate.ok) {
      appendReplay({
        ts: new Date().toISOString(), inputDecision: guard.decision, scrubbedFieldCount: 0,
        contextZones: ["USER_STORY", "PROPERTY_FACTS"], urlSandboxVerdict: null, privacyFirewallOk: textGate.ok,
        outputGateOk: false, refusalReason: [...payloadGate.blocks, ...textGate.blocks].slice(0, 3).join("; "),
        evidenceBundleHash: hashEvidence(pathways.map((x) => x.id)), renderedOutputHash: hashOutput("(blocked)"),
      });
      const guarded = guardTurnIntent(journey, "ASK_GOAL",
        "We caught something in our own draft answer that doesn't meet our standards, so we held it back. Tell me a bit more and we'll take another honest run at it.");
      journey = guarded.journey;
      return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, journey });
    }
    appendReplay({
      ts: new Date().toISOString(), inputDecision: guard.decision, scrubbedFieldCount: 0,
      contextZones: ["SYSTEM_RULES", "USER_STORY", "PROPERTY_FACTS"], urlSandboxVerdict: null,
      privacyFirewallOk: true, outputGateOk: true, refusalReason: null,
      evidenceBundleHash: hashEvidence(pathways.map((x) => x.id)), renderedOutputHash: hashOutput(JSON.stringify(decision)),
    });
    journey = { ...journey, lastTurnIntent: "PRESENT_PATHWAYS" };
    return NextResponse.json({
      kind: "pathways",
      node: journey.node,
      text:
        (journey.property?.addressText
          ? `Here's what ${journey.property.addressText} could become — honestly, including the No's and the can't-determines. `
          : "Here's what this could become — honestly, including the No's and the can't-determines. ") +
        (wideningLine(explored, pathways.map((p) => p.id)) ?? ""),
      turnIntent: "PRESENT_PATHWAYS",
      pathways,
      graphChain: chainStart ? discoveryGraphChain(chainStart) : [],
      programsSeam: "A property qualifying for a program is a fact about the property. Whether YOU qualify is a licensed professional's call — property qualifies ≠ you qualify.",
      decision,
      searchGuidance,
      journey,
    });
  }

  // Guided Property Discovery just engaged (no property / help me find one):
  // respond with the discovery opener + ONE open follow-up — never the asset
  // prompt again (loop fix 2026-06-11).
  if (journey.guidedDiscovery && !wasGuided) {
    const guarded = guardTurnIntent(journey, "ROUTE_OPEN_DISCOVERY", `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`);
    journey = rememberPrompt(guarded.journey, guarded.text);
    logInterviewTurn({ source: "fallback", slot: `navigator:guided-discovery:${journey.intent}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(interpreted)" }]) });
    return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, journey });
  }

  // Otherwise: the next single open question — with BOTH anti-repeat layers:
  // verbatim text (a prompt may not repeat more than once) and turn intent
  // (a consecutive identical intent is blocked by guardTurnIntent).
  let text = nextPrompt(journey, prevNode);
  let intent: TurnIntent = intentForNode(journey.node);
  if (timesAsked(journey, text) >= 2) {
    journey = { ...journey, guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" };
    text = `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`;
    intent = "ROUTE_OPEN_DISCOVERY";
  }
  const guarded = guardTurnIntent(journey, intent, text);
  journey = rememberPrompt(guarded.journey, guarded.text);
  logInterviewTurn({ source: "fallback", slot: `navigator:${journey.node}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(interpreted)" }]) });
  return NextResponse.json({
    kind: "question",
    node: journey.node,
    text: guarded.text,
    turnIntent: guarded.intent,
    journey,
  });
}

// ── prompt bookkeeping (anti-repeat, verbatim-text layer) ────────────────────
function timesAsked(j: JourneyState, prompt: string): number {
  return j.askedPrompts.filter((p) => p === prompt).length;
}
function rememberPrompt(j: JourneyState, prompt: string): JourneyState {
  return { ...j, askedPrompts: [...j.askedPrompts, prompt].slice(-20) };
}
/** The base question, softened with an acknowledgment when the arc stalled. */
function nextPrompt(j: JourneyState, prevNode: string): string {
  const q = questionForNode(j);
  return j.node === prevNode && timesAsked(j, q) >= 1
    ? `Heard — that helps more than you'd think. One more thing: ${q.charAt(0).toLowerCase()}${q.slice(1)}`
    : q;
}
