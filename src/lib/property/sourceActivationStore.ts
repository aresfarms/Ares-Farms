/**
 * Runtime source-activation store — SERVER-ONLY (uses fs).
 *
 * The static defaults in sourceActivation.ts ship PENDING / sourceLive:false.
 * An operator's APPROVE on the internal Source Review screen writes a JSON
 * overlay here (data/source-activation-state.json) that the SERVER data layer
 * reads to decide what renders. This is the ONLY way SOURCE_LIVE flips true —
 * the build never self-approves, and the committed/default state stays pending
 * (the overlay file is git-ignored).
 *
 * Client/Edge code must NOT import this (fs). The client map receives live flags
 * as a prop from the homepage server component.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { appendAuditEvent } from "./auditLedger";
import { SOURCE_ACTIVATION, type ReviewStatus } from "./sourceActivation";

const STATE_PATH = path.join(process.cwd(), "data", "source-activation-state.json");

export type ReviewDecision = "APPROVE" | "REJECT" | "HOLD";

interface OverlayEntry {
  module22: ReviewStatus;
  module23: ReviewStatus;
  sourceLive: boolean;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reason: string | null;
}

export interface EffectiveActivation {
  sourceId: string;
  sourceName: string;
  module22: ReviewStatus;
  module23: ReviewStatus;
  sourceLive: boolean;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reason: string | null;
}

function readOverlay(): Record<string, OverlayEntry> {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, "utf8")); } catch { return {}; }
}
function writeOverlay(o: Record<string, OverlayEntry>): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(o, null, 2) + "\n", "utf8");
}

/** Effective activation = static defaults, with any operator overlay applied. */
export function getRuntimeActivation(sourceId: string): EffectiveActivation | null {
  const base = SOURCE_ACTIVATION[sourceId];
  if (!base) return null;
  const ov = readOverlay()[sourceId];
  return {
    sourceId,
    sourceName: base.sourceName,
    module22: ov?.module22 ?? base.module22.status,
    module23: ov?.module23 ?? base.module23.status,
    sourceLive: ov?.sourceLive ?? base.sourceLive,
    reviewedBy: ov?.reviewedBy ?? null,
    reviewedByName: ov?.reviewedByName ?? null,
    reviewedAt: ov?.reviewedAt ?? null,
    reason: ov?.reason ?? null,
  };
}

/** Runtime liveness — true only when BOTH modules APPROVED and sourceLive set. */
export function isSourceLiveRuntime(sourceId: string): boolean {
  const a = getRuntimeActivation(sourceId);
  return !!a && a.sourceLive && a.module22 === "APPROVED" && a.module23 === "APPROVED";
}

/** Live flags for the client map (passed as a prop — keeps fs out of the client). */
export function getRuntimeLiveSources(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const id of Object.keys(SOURCE_ACTIVATION)) out[id] = isSourceLiveRuntime(id);
  return out;
}

/**
 * Record an operator decision: flip activation in the overlay and append the
 * audit-ledger entry. APPROVE sets both modules APPROVED + sourceLive true.
 * REJECT/HOLD keep the source blocked with a reason. Caller MUST have already
 * verified the operator's authority (Module 45 / operatorRegistry).
 */
export function recordSourceDecision(input: {
  sourceId: string;
  decision: ReviewDecision;
  reviewerId: string;
  reviewerName: string;
  reason: string;
}): EffectiveActivation {
  const base = SOURCE_ACTIVATION[input.sourceId];
  if (!base) throw new Error(`Unknown source "${input.sourceId}".`);
  const now = new Date().toISOString();
  const approved = input.decision === "APPROVE";

  const overlay = readOverlay();
  overlay[input.sourceId] = {
    module23: approved ? "APPROVED" : input.decision === "REJECT" ? "BLOCKED" : "PENDING_HUMAN_APPROVAL",
    module22: approved ? "APPROVED" : input.decision === "REJECT" ? "BLOCKED" : "PENDING_HUMAN_APPROVAL",
    sourceLive: approved,
    reviewedBy: input.reviewerId,
    reviewedByName: input.reviewerName,
    reviewedAt: now,
    reason: input.reason || null,
  };
  writeOverlay(overlay);

  appendAuditEvent({
    actorId: input.reviewerId,
    actorName: input.reviewerName,
    domain: "source-review",
    subject: input.sourceId,
    decision: input.decision,
    reason: input.reason,
    detail: { module22: "Live Scraper Activation", module23: "Source Legal & Licensing Review", sourceLive: approved },
  });

  return getRuntimeActivation(input.sourceId)!;
}
