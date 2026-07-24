/**
 * POST /api/public/navigator/converse — Furlong Navigator (anonymous, Tier-1).
 *
 * ROUTING AUTHORITY (build fix 2026-06-12): every message passes through the
 * authoritative pre-response router (navigatorTurnRouter.ts) BEFORE any
 * questionnaire prompt is selected. The questionnaire state machine renders
 * ONLY when the router authorizes it. Priority order:
 *   1. safety/illegality (unlawful evasion)   → REFUSE_UNLAWFUL_EVASION
 *   2. Fair Housing / ownership / privacy     → REFUSE_FAIR_HOUSING_STEERING /
 *      (G-1/G-2 locked line, recovery routing)   REFUSE_OWNER_LOOKUP
 *   3. adult/sexual structure boundary        → REFUSE_ADULT_SEXUAL_STRUCTURE
 *   4. non-human/fantasy identity             → CLARIFY_HUMAN_CONTEXT
 *   5. impossible destination                 → OUT_OF_SCOPE_WITH_REAL_WORLD_ADJACENT
 *   6. specific novelty concept (piñata rule) → CLARIFY_NOVELTY_BUILD_CONCEPT
 *   7. goal-specific (earth-sheltered / weird-but-lawful architecture)
 *   8. open discovery
 *   9. generic arc prompt — LAST RESORT ONLY
 *
 * EVERY response carries a machine-readable turn_intent; the SEMANTIC loop
 * guard compares intents (consecutive repeat blocked; recent-three tracked) —
 * refusal alternates still refuse. The verbatim-text anti-repeat remains as an
 * independent second layer. ASK_ASSETS is skippable and may never follow a
 * high-priority safety/scope/intent input.
 *
 * The six-flag novelty code-compliance gate still hard-blocks pathway
 * generation until a lawful real-world translation arrives.
 *
 * Anonymous: no identity captured; journey state lives with the CLIENT
 * (sessionStorage, opt-in only) and is round-tripped here, never stored
 * server-side. "Understanding before output. Reality before commitment."
 */

import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { classifyRefusal, REFUSAL_LINE } from "@/lib/navigator/propertyPrivacyDoctrine";
import {
  interpretMessage, questionForNode, wideningLine, detectPropertyIntent,
  GUIDED_DISCOVERY_OPENER, GUIDED_DISCOVERY_FOLLOWUP, FRESH_JOURNEY, type JourneyState, describeDealType,
} from "@/lib/navigator/narrativeInterpreter";
import { noveltyGateClear, translatesToRealWorld, clearedGate, NOVELTY_BOUNDARY_REPLY } from "@/lib/navigator/noveltyBuildDoctrine";
import { routeTurn, isUnlawfulEvasionAsk, extractAllowedRemainder, detectViolentThreat, detectTargetedHarassment, assessCriticalInfrastructure } from "@/lib/navigator/navigatorTurnRouter";
import { classifyIntent } from "@/lib/navigator/universalIntentClassifier";
import { resolveContextualAnswer } from "@/lib/navigator/contextualAnswerResolver";
import { appendThreatEscalation } from "@/security/realityPlatform/threatEscalationLedger";
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

export function intelligenceCaseHandoff(journey: JourneyState, pathwayIds: string[]) {
  const propertyKind = journey.context.propertyKind;
  const state = journey.context.state?.trim().toUpperCase() || null;
  const structuredSeed = JSON.stringify({
    entryMode: journey.entryMode,
    dealType: journey.dealType,
    propertyKind,
    state,
    pathwayIds: [...pathwayIds].sort(),
  });
  const caseId = `navigator-${createHash("sha256").update(structuredSeed).digest("hex").slice(0, 20)}`;
  const customerTypes = propertyKind === "farm"
    ? ["farmer", "rural small business"]
    : propertyKind === "commercial"
      ? ["small business", "commercial property participant"]
      : propertyKind === "residential"
        ? ["property owner"]
        : ["prospective property participant"];
  const params = new URLSearchParams({
    name: "Navigator intelligence case",
    goal: `Evaluate ${describeDealType(journey.dealType)} pathways, constraints, and next steps.`,
    customerTypes: customerTypes.join(","),
    intendedUses: pathwayIds.join(","),
    origin: "navigator",
  });
  if (state) params.set("state", state);
  return {
    caseId,
    href: `/intelligence/cases/${caseId}?${params.toString()}`,
    source: "NAVIGATOR_STRUCTURED_HANDOFF" as const,
    transcriptTransferred: false as const,
    identityTransferred: false as const,
    addressTransferred: false as const,
  };
}

export async function POST(req: Request) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { body = {}; }

  const message = (body.message ?? "").slice(0, 4000);
  let journey: JourneyState = body.journey && Array.isArray(body.journey.story)
    ? { ...FRESH_JOURNEY, ...body.journey }
    : FRESH_JOURNEY;

  // STAGE 1–4: the Universal Intent Classification Layer runs BEFORE goal route
  // selection. Stage 5 (route selection) is performed by routeTurn / the arc,
  // which must agree with this classification for identified assets. Exposed on
  // every substantive response so the classification — not a keyword — is the
  // visible basis for the decision.
  const classification = message.trim() ? classifyIntent(message) : null;

  // Kickoff (no message): the one open question. No chips, no form.
  if (!message.trim()) {
    const guarded = guardTurnIntent(journey, intentForNode(journey.node), questionForNode(journey));
    journey = rememberPrompt(guarded.journey, guarded.text);
    logInterviewTurn({ source: "fallback", slot: "navigator:open", ok: true, transcriptHash: hashTranscript([]) });
    return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, journey });
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
    const guarded = guardTurnIntent(journey, "REFUSE_AND_REDIRECT", text, { userMessage: message });
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
  if (guard.decision === "REFUSE_AND_REDIRECT" && !classifyRefusal(message) && !isUnlawfulEvasionAsk(message)) {
    // injection / prompt-extraction (non-G1/G2): refuse generically + continue.
    journey = { ...journey, guardCounters: { ...journey.guardCounters, refusals: journey.guardCounters.refusals + 1 } };
    const follow = nextPrompt(journey, journey.node);
    const guarded = guardTurnIntent(journey, "REFUSE_AND_REDIRECT", `Let's stay on your possibilities. ${follow}`, { userMessage: message });
    journey = rememberPrompt(guarded.journey, guarded.text);
    appendReplay({
      ts: new Date().toISOString(), inputDecision: guard.decision, scrubbedFieldCount: 0, contextZones: [],
      urlSandboxVerdict: null, privacyFirewallOk: true, outputGateOk: true,
      refusalReason: guard.reasons.join("; "), evidenceBundleHash: hashEvidence(guard.signals), renderedOutputHash: hashOutput(guarded.text),
    });
    logInterviewTurn({ source: "fallback", slot: "navigator:guard:injection", ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
    return NextResponse.json({ kind: "refusal", refusal: "injection", text: guarded.text, turnIntent: guarded.intent, journey });
  }

  // 0.5 — SAFETY ESCALATION (CRITICAL, 2026-06-12): violent threat, targeted
  // harassment/stalking/doxxing, and infrastructure security-probes override
  // EVERY pathway, before all questionnaire prompts. Each creates a
  // human-review security event (hashes + network identifier where legally
  // available — never raw text, never a dossier, never shown in public UI).
  // A violent-threat / infra-probe HOLDS the journey; harassment refuses but
  // lets a restated lawful concern proceed.
  const threatCat = detectViolentThreat(message);
  const infraAssess = assessCriticalInfrastructure(message);
  const harassCat = detectTargetedHarassment(message);
  const escCategory = threatCat
    ?? (infraAssess?.kind === "escalate" ? "infrastructure-probe" as const : null)
    ?? harassCat;
  if (escCategory || journey.threatHold) {
    const decision = routeTurn(message, journey)!; // an escalation branch decides
    journey = { ...journey, ...decision.patch, guardCounters: { ...journey.guardCounters, refusals: journey.guardCounters.refusals + 1 } };
    journey = { ...journey, lastTurnIntent: decision.turnIntent, recentTurnIntents: [...(journey.recentTurnIntents ?? []), decision.turnIntent].slice(-3) };
    journey = rememberPrompt(journey, decision.text);
    const replayRef = hashEvidence([decision.slot, escCategory ?? "hold"]);
    appendReplay({
      ts: new Date().toISOString(), inputDecision: "ESCALATE_SECURITY", scrubbedFieldCount: 0, contextZones: [],
      urlSandboxVerdict: null, privacyFirewallOk: true, outputGateOk: true,
      refusalReason: `safety-escalation:${escCategory ?? "hold"}`, evidenceBundleHash: replayRef, renderedOutputHash: hashOutput(decision.text),
    });
    if (escCategory) {
      appendThreatEscalation({
        message,
        phraseCategory: escCategory,
        networkIdentifier: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
        pageRoute: "/api/public/navigator/converse",
        replayRef,
        renderedResponse: decision.text,
      });
    }
    logInterviewTurn({ source: "fallback", slot: `navigator:${decision.slot}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
    return NextResponse.json({ kind: "refusal", refusal: "safety-escalation", text: decision.text, turnIntent: decision.turnIntent, journey });
  }

  // 1 — PRIORITY 1: unlawful evasion is checked BEFORE G-1/G-2 (router owns it).
  // 2 — PRIORITY 2: refusal gates (G-1 ownership / G-2 steering). Refuse ONCE
  // with the locked line, then INSPECT THE REMAINING INTENT (loop fix
  // 2026-06-11): a steering ask that also wants property discovery gets the
  // refusal AND the non-demographic guided-discovery redirect — never a dead
  // end back to the asset prompt.
  const refusal = isUnlawfulEvasionAsk(message) ? null : classifyRefusal(message);
  if (refusal) {
    journey = { ...journey, guardCounters: { ...journey.guardCounters, refusals: journey.guardCounters.refusals + 1 } };
    const refusalIntent: TurnIntent = refusal === "ownership" ? "REFUSE_OWNER_LOOKUP" : "REFUSE_FAIR_HOUSING_STEERING";

    // MIXED-INTENT PRESERVATION (build fix 2026-06-12): a guardrail refusal
    // must not erase a legitimate user goal. Split the message: the forbidden
    // criteria are refused; a lawful concept in the same message (hobbit
    // house, spaceship house, regulated use, …) is PRESERVED and routed.
    // (Unlawful-evasion and explicit-content refusals deliberately do NOT
    // preserve goals in the same turn — those boundaries restrict follow-up.)
    const allowedGoal = extractAllowedRemainder(message, journey);
    const PRESERVABLE: TurnIntent[] = [
      "ROUTE_WEIRD_BUT_LAWFUL_ARCHITECTURE", "ROUTE_EARTH_SHELTERED_HOUSING",
      "ROUTE_PROPERTY_ANALYSIS", "CLARIFY_SPECIFIC_CONCEPT_USE", "CLARIFY_NOVELTY_BUILD_CONCEPT",
      "CLARIFY_ANIMAL_HOUSING", "ROUTE_PET_STRUCTURE", "ROUTE_LIVESTOCK_OR_AG_STRUCTURE",
      "ROUTE_VEHICLE_INSPIRED_ARCHITECTURE", "ROUTE_MARINE_LIVEABOARD", "ROUTE_NONTRADITIONAL_DWELLING",
      "ROUTE_SPECIALTY_ASSET_ACQUISITION", "ROUTE_COMMERCIAL_ACQUISITION",
      "ROUTE_HEALTHCARE_REAL_ESTATE", "ROUTE_REGULATED_BUSINESS_ACQUISITION",
    ];
    if (allowedGoal && PRESERVABLE.includes(allowedGoal.turnIntent)) {
      journey = { ...journey, ...allowedGoal.patch };
      const preamble = refusal === "steering"
        ? "I can’t help search by race, demographics, or who lives in an area."
        : REFUSAL_LINE;
      const goalText =
        allowedGoal.turnIntent === "ROUTE_WEIRD_BUT_LAWFUL_ARCHITECTURE" || allowedGoal.turnIntent === "ROUTE_EARTH_SHELTERED_HOUSING"
          ? `But I can help with the lawful part of your goal: finding land where a ${(allowedGoal.echoConcept ?? "unusual").replace(/\s*house$/i, "")}-inspired or earth-sheltered home could realistically be built. For that, we’d look at zoning, building codes, setbacks, utilities, septic/water, HOA restrictions, and local permitting. Are you hoping to build one, buy one, or find land where one could legally be built?`
          : `But I can help with the lawful part of your goal. ${allowedGoal.text}`;
      const text = `${preamble} ${goalText}`;
      journey = { ...journey, lastTurnIntent: refusalIntent, recentTurnIntents: [...(journey.recentTurnIntents ?? []), refusalIntent, allowedGoal.turnIntent].slice(-3) };
      journey = rememberPrompt(journey, text);
      logInterviewTurn({ source: "fallback", slot: `navigator:refusal:${refusal}:goal-preserved:${allowedGoal.slot}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
      return NextResponse.json({
        kind: "refusal", refusal, text,
        turnIntent: refusalIntent,
        chainedTurnIntents: [refusalIntent, allowedGoal.turnIntent],
        ...(allowedGoal.echoConcept ? { echoConcept: allowedGoal.echoConcept } : {}),
        journey,
      });
    }

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
    const guarded = guardTurnIntent(journey, refusalIntent, `${REFUSAL_LINE} ${followOn}`, { userMessage: message });
    journey = rememberPrompt(guarded.journey, guarded.text);
    logInterviewTurn({ source: "fallback", slot: `navigator:refusal:${refusal}${wantsDiscovery ? ":guided-discovery" : ""}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
    return NextResponse.json({ kind: "refusal", refusal, text: guarded.text, turnIntent: guarded.intent, journey });
  }

  // 2.5 — CONTEXTUAL SHORT-ANSWER: "all of the above" / "yes" / "the first one"
  // resolve against the PREVIOUS bot question — never a new discovery goal.
  // E5 fix: when objective discovery is pending, a short "not sure" is an
  // OBJECTIVE answer — let the router's objective tier handle it (it keeps the
  // user in objective-discovery), not the generic contextual resolver.
  const contextual = journey.objectiveDiscoveryPending ? null : resolveContextualAnswer(message, journey);
  if (contextual) {
    const guarded = guardTurnIntent(journey, contextual.turnIntent, contextual.text, { userMessage: message });
    journey = rememberPrompt(guarded.journey, guarded.text);
    logInterviewTurn({ source: "fallback", slot: `navigator:${contextual.slot}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(interpreted)" }]) });
    return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, classification, journey });
  }

  // 3–8 — THE AUTHORITATIVE ROUTER: safety, sexual-structure boundary, human
  // context, impossible destinations, specific novelty concepts (piñata rule:
  // the reply must NAME the concept), goal-specific architecture routes, and
  // open discovery. The questionnaire arc renders ONLY if this returns null.
  const decision = routeTurn(message, journey);
  if (decision) {
    journey = { ...journey, ...decision.patch };
    if (decision.refusal) {
      journey = { ...journey, guardCounters: { ...journey.guardCounters, refusals: journey.guardCounters.refusals + 1 } };
    }
    const text = decision.turnIntent === "ROUTE_OPEN_DISCOVERY" && !decision.text
      ? `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`
      : decision.text;
    const guarded = guardTurnIntent(journey, decision.turnIntent, text, { userMessage: message });
    journey = rememberPrompt(guarded.journey, guarded.text);
    logInterviewTurn({ source: "fallback", slot: `navigator:${decision.slot}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
    return NextResponse.json({
      kind: decision.refusal ? "refusal" : "question",
      ...(decision.refusal ? { refusal: decision.slot } : {}),
      node: journey.node,
      text: guarded.text,
      turnIntent: guarded.intent,
      classification,
      ...(decision.echoConcept ? { echoConcept: decision.echoConcept } : {}),
      ...(journey.noveltyGate ? { noveltyGate: journey.noveltyGate } : {}),
      journey,
    });
  }

  // A pending novelty gate clears when the user supplies the lawful
  // real-world translation the boundary reply invited.
  if (journey.noveltyGate && !noveltyGateClear(journey.noveltyGate) && translatesToRealWorld(message)) {
    journey = { ...journey, noveltyGate: clearedGate() };
  }

  // 9 — ARC AUTHORIZED (last resort): interpret + advance.
  const prevNode = journey.node;
  const wasGuided = journey.guidedDiscovery;
  journey = interpretMessage(journey, message);

  // At Pathways (or beyond), assess + keep the conversation going.
  if (journey.node === "pathways" || journey.node === "evidence" || journey.node === "programs") {
    // HARD RULE: no pathway cards, pro formas, program matches, or property
    // suggestions for a novelty/fantasy build until the concept is translated
    // into a lawful, non-sexual, real-world, code-checkable project.
    if (!noveltyGateClear(journey.noveltyGate)) {
      const guarded = guardTurnIntent(journey, "CLARIFY_NOVELTY_BUILD_CONCEPT", NOVELTY_BOUNDARY_REPLY, { userMessage: message });
      journey = rememberPrompt(guarded.journey, guarded.text);
      logInterviewTurn({ source: "fallback", slot: "navigator:novelty:gate-blocked-pathways", ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(redacted)" }]) });
      return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, noveltyGate: journey.noveltyGate, journey });
    }
    const pathways = assessPathways(journey.context);
    const explored = journey.exploredPathways;
    journey = { ...journey, exploredPathways: [...new Set([...explored, ...pathways.map((p) => p.id)])] };
    const chainStart = pathways.find((p) => p.graphNeighbors.length > 0)?.id ?? pathways[0]?.id;
    logInterviewTurn({ source: "fallback", slot: `navigator:pathways:${journey.context.propertyKind}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(interpreted)" }]) });
    const decisionSummary = deriveDecisionSummary(pathways);
    // Search-and-bring-back guidance: ONLY when no property is in hand, and
    // never invented matches — CANDIDATE_SOURCES_LIVE gates any future feed.
    const searchGuidance = !journey.property && !CANDIDATE_SOURCES_LIVE ? buildSearchGuidance(journey.context) : null;
    // REALITY-SEC-001 OUTPUT GATE: nothing renders that fails the final checks.
    const payloadGate = gatePathwayPayload(pathways);
    const textGate = gateOutputText(JSON.stringify(decisionSummary));
    if (!payloadGate.ok || !textGate.ok) {
      appendReplay({
        ts: new Date().toISOString(), inputDecision: guard.decision, scrubbedFieldCount: 0,
        contextZones: ["USER_STORY", "PROPERTY_FACTS"], urlSandboxVerdict: null, privacyFirewallOk: textGate.ok,
        outputGateOk: false, refusalReason: [...payloadGate.blocks, ...textGate.blocks].slice(0, 3).join("; "),
        evidenceBundleHash: hashEvidence(pathways.map((x) => x.id)), renderedOutputHash: hashOutput("(blocked)"),
      });
      const guarded = guardTurnIntent(journey, "ASK_GOAL",
        "We caught something in our own draft answer that doesn't meet our standards, so we held it back. Tell me a bit more and we'll take another honest run at it.", { userMessage: message });
      journey = guarded.journey;
      return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, journey });
    }
    appendReplay({
      ts: new Date().toISOString(), inputDecision: guard.decision, scrubbedFieldCount: 0,
      contextZones: ["SYSTEM_RULES", "USER_STORY", "PROPERTY_FACTS"], urlSandboxVerdict: null,
      privacyFirewallOk: true, outputGateOk: true, refusalReason: null,
      evidenceBundleHash: hashEvidence(pathways.map((x) => x.id)), renderedOutputHash: hashOutput(JSON.stringify(decisionSummary)),
    });
    journey = { ...journey, lastTurnIntent: "PRESENT_PATHWAYS", recentTurnIntents: [...(journey.recentTurnIntents ?? []), "PRESENT_PATHWAYS"].slice(-3) };
    return NextResponse.json({
      kind: "pathways",
      node: journey.node,
      text:
        (journey.property?.addressText
          ? `Here's the immediate suitability read for this ${describeDealType(journey.dealType)} at ${journey.property.addressText} — honestly, including the No's and the can't-determines. `
          : `Here's the immediate suitability read for this ${describeDealType(journey.dealType)} — honestly, including the No's and the can't-determines. `) +
        (wideningLine(explored, pathways.map((p) => p.id)) ?? ""),
      turnIntent: "PRESENT_PATHWAYS",
      pathways,
      graphChain: chainStart ? discoveryGraphChain(chainStart) : [],
      programsSeam: "A property qualifying for a program is a fact about the property. Whether YOU qualify is a licensed professional's call — property qualifies ≠ you qualify.",
      decision: decisionSummary,
      searchGuidance,
      intelligenceCase: intelligenceCaseHandoff(journey, pathways.map((pathway) => pathway.id)),
      journey,
    });
  }

  // Guided Property Discovery just engaged via interpretation: respond with
  // the discovery opener + ONE open follow-up — never the asset prompt again.
  if (journey.guidedDiscovery && !wasGuided) {
    const guarded = guardTurnIntent(journey, "ROUTE_OPEN_DISCOVERY", `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`, { userMessage: message });
    journey = rememberPrompt(guarded.journey, guarded.text);
    logInterviewTurn({ source: "fallback", slot: `navigator:guided-discovery:${journey.intent}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(interpreted)" }]) });
    return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, journey });
  }

  // The next single open question — with BOTH anti-repeat layers: verbatim
  // text (a prompt may not repeat more than once) and the SEMANTIC intent
  // guard (consecutive repeat blocked; recent-three tracked). ASK_ASSETS is
  // skippable: a third-peat escalates to guided discovery.
  let text = nextPrompt(journey, prevNode);
  let intent: TurnIntent = intentForNode(journey.node);
  // HARD RULE: never ASK_PERSON/ASK_STORY when the Universal Intent Classifier
  // identified an asset — the goal IS the story. (Belt-and-suspenders: routeTurn
  // already intercepts identified assets; this guarantees the arc can't regress
  // into intake when a classification exists.)
  if (classification?.identified && (intent === "ASK_PERSON" || intent === "ASK_STORY" || intent === "ASK_GOAL")) {
    journey = { ...journey, guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" };
    text = `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`;
    intent = "ROUTE_OPEN_DISCOVERY";
  }
  if (timesAsked(journey, text) >= 2) {
    journey = { ...journey, guidedDiscovery: true, entryMode: journey.entryMode ?? "open-discovery" };
    text = `${GUIDED_DISCOVERY_OPENER} ${GUIDED_DISCOVERY_FOLLOWUP}`;
    intent = "ROUTE_OPEN_DISCOVERY";
  }
  const guarded = guardTurnIntent(journey, intent, text, { userMessage: message });
  journey = rememberPrompt(guarded.journey, guarded.text);
  logInterviewTurn({ source: "fallback", slot: `navigator:${journey.node}`, ok: true, transcriptHash: hashTranscript([{ role: "user", text: "(interpreted)" }]) });
  return NextResponse.json({ kind: "question", node: journey.node, text: guarded.text, turnIntent: guarded.intent, classification, journey });
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
