/**
 * Runtime place-fact activation store — SERVER-ONLY (uses fs).
 *
 * Mirrors src/lib/property/sourceActivationStore.ts, but for the place-fact
 * (reference) sources (Opportunity Zones, HUBZone). The static records in
 * placeFactActivation.ts ship PENDING / liveFetchAllowed:false. An operator's
 * APPROVE on the internal Source Review screen writes a JSON overlay here
 * (data/place-fact-activation-state.json) and appends the SAME audit ledger —
 * the ONLY governed way the live request-time fetch is enabled. The build never
 * self-approves; the committed/default state stays PENDING (overlay git-ignored).
 *
 * IMPORTANT semantic difference from property sources: approval flips ONLY the
 * live request-time fetch (liveFetchAllowed). The citable public-domain SNAPSHOT
 * already renders and keeps rendering whether or not this is approved — approval
 * does NOT "turn on the data."
 *
 * Uses fs — never import from client or Edge code. Reuses the shared audit
 * ledger so place-fact decisions sit in the same accountability trail.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import type { AuditEvent } from "@/lib/platform/authorities/landRegister";

import {
  PLACE_FACT_ACTIVATIONS,
  PLACE_FACT_SOURCE_IDS,
  type PlaceFactReviewStatus,
} from "./placeFactActivation";

const STATE_PATH = path.join(
  process.cwd(),
  "data",
  "place-fact-activation-state.json",
);

export const PLACE_FACT_AUDIT_DOMAIN = "place-fact-review";

export type PlaceFactDecision = "APPROVE" | "REJECT" | "HOLD";

interface OverlayEntry {
  module22: PlaceFactReviewStatus;
  module23: PlaceFactReviewStatus;
  liveFetchAllowed: boolean;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reason: string | null;
}

export interface EffectivePlaceFactActivation {
  sourceId: string;
  sourceName: string;
  module22: PlaceFactReviewStatus;
  module23: PlaceFactReviewStatus;
  /** The gated capability — live request-time fetch. */
  liveFetchAllowed: boolean;
  /** The snapshot always renders (decision recorded in placeFactActivation.ts). */
  snapshotRenderAllowed: boolean;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reason: string | null;
}

function readOverlay(): Record<string, OverlayEntry> {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}
function writeOverlay(o: Record<string, OverlayEntry>): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(o, null, 2) + "\n", "utf8");
}

/** Effective place-fact activation = static defaults, with any operator overlay applied. */
export function getRuntimePlaceFactActivation(
  sourceId: string,
): EffectivePlaceFactActivation | null {
  const base = PLACE_FACT_ACTIVATIONS[sourceId];
  if (!base) return null;
  const ov = readOverlay()[sourceId];
  return {
    sourceId,
    sourceName: base.sourceName,
    module22: ov?.module22 ?? base.module22.status,
    module23: ov?.module23 ?? base.module23.status,
    liveFetchAllowed: ov?.liveFetchAllowed ?? base.module22.liveFetchAllowed,
    snapshotRenderAllowed: base.snapshotRenderAllowed,
    reviewedBy: ov?.reviewedBy ?? null,
    reviewedByName: ov?.reviewedByName ?? null,
    reviewedAt: ov?.reviewedAt ?? null,
    reason: ov?.reason ?? null,
  };
}

/** Runtime live-fetch state — true only when BOTH modules APPROVED and liveFetchAllowed set. */
export function isPlaceFactLiveFetchActivatedRuntime(sourceId: string): boolean {
  const a = getRuntimePlaceFactActivation(sourceId);
  return (
    !!a &&
    a.liveFetchAllowed &&
    a.module22 === "APPROVED" &&
    a.module23 === "APPROVED"
  );
}

/** Every place-fact source's effective activation (for the review screen). */
export function listRuntimePlaceFactActivations(): EffectivePlaceFactActivation[] {
  return PLACE_FACT_SOURCE_IDS.map(
    (id) => getRuntimePlaceFactActivation(id)!,
  );
}

/** Recent audit-ledger entries for a place-fact source (most recent first). */
export function readPlaceFactAudit(sourceId: string, limit = 10): AuditEvent[] {
  return canonicalLandRegisterAuthority.read({ domain: PLACE_FACT_AUDIT_DOMAIN, subject: sourceId })
    .slice(-limit)
    .reverse();
}

/**
 * Record an operator decision for a place-fact source: flip the overlay and
 * append the audit-ledger entry. APPROVE → both modules APPROVED + liveFetchAllowed
 * true (live fetch enabled). REJECT/HOLD keep the live fetch gated with a reason.
 * Caller MUST have already verified the operator's authority (Module 45).
 */
export function recordPlaceFactDecision(input: {
  sourceId: string;
  decision: PlaceFactDecision;
  reviewerId: string;
  reviewerName: string;
  reason: string;
}): EffectivePlaceFactActivation {
  const base = PLACE_FACT_ACTIVATIONS[input.sourceId];
  if (!base) throw new Error(`Unknown place-fact source "${input.sourceId}".`);
  const now = new Date().toISOString();
  const approved = input.decision === "APPROVE";

  const overlay = readOverlay();
  overlay[input.sourceId] = {
    module23: approved
      ? "APPROVED"
      : input.decision === "REJECT"
        ? "BLOCKED"
        : "PENDING_HUMAN_APPROVAL",
    module22: approved
      ? "APPROVED"
      : input.decision === "REJECT"
        ? "BLOCKED"
        : "PENDING_HUMAN_APPROVAL",
    liveFetchAllowed: approved,
    reviewedBy: input.reviewerId,
    reviewedByName: input.reviewerName,
    reviewedAt: now,
    reason: input.reason || null,
  };
  writeOverlay(overlay);

  canonicalLandRegisterAuthority.append({
    actorId: input.reviewerId,
    actorName: input.reviewerName,
    domain: PLACE_FACT_AUDIT_DOMAIN,
    subject: input.sourceId,
    decision: input.decision,
    reason: input.reason,
    detail: {
      module22: "Place-fact live-fetch activation",
      module23: "Source legal & licensing review",
      liveFetchAllowed: approved,
      note: "Snapshot already renders; approval flips the live request-time fetch only.",
    },
  });

  return getRuntimePlaceFactActivation(input.sourceId)!;
}
