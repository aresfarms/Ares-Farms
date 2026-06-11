/**
 * Runtime image-rights activation store — SERVER-ONLY (uses fs).
 *
 * Mirrors sourceActivationStore / placeFactActivationStore, for the per-source
 * property image-rights Module 23 records. The static records ship PENDING /
 * NOT_CLEARED. A qualified reviewer's decision writes a JSON overlay
 * (data/image-rights-state.json, git-ignored) and appends the SAME audit ledger
 * — the only governed way images become CLEARED_FOR_DISPLAY. The build never
 * self-clears.
 *
 * Conservative gate: only an explicit CLEAR decision sets CLEARED_FOR_DISPLAY,
 * and only when the recorded provenance is FEDERAL_PD. CONTRACTOR_UNCLEAR /
 * THIRD_PARTY_COURTESY can never be auto-cleared.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { appendAuditEvent, readAuditEvents } from "./auditLedger";
import {
  IMAGE_RIGHTS_ACTIVATION,
  IMAGE_RIGHTS_SOURCE_IDS,
  type ImageRightsRecord,
  type ImageRightsStatus,
} from "./imageRightsActivation";

const STATE_PATH = path.join(process.cwd(), "data", "image-rights-state.json");
export const IMAGE_RIGHTS_AUDIT_DOMAIN = "image-rights-review";

export type ImageRightsDecision = "CLEAR" | "REJECT" | "HOLD" | "NEEDS_LEGAL";

interface OverlayEntry {
  status: ImageRightsStatus;
  conclusion: ImageRightsRecord["conclusion"];
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reason: string | null;
}

export interface EffectiveImageRights {
  sourceId: string;
  sourceName: string;
  status: ImageRightsStatus;
  conclusion: ImageRightsRecord["conclusion"];
  defaultProvenance: ImageRightsRecord["defaultProvenance"];
  clearedForDisplay: boolean;
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

export function getRuntimeImageRights(sourceId: string): EffectiveImageRights | null {
  const base = IMAGE_RIGHTS_ACTIVATION[sourceId];
  if (!base) return null;
  const ov = readOverlay()[sourceId];
  const status = ov?.status ?? base.status;
  const conclusion = ov?.conclusion ?? base.conclusion;
  return {
    sourceId,
    sourceName: base.sourceName,
    status,
    conclusion,
    defaultProvenance: base.defaultProvenance,
    clearedForDisplay: status === "CLEARED_FOR_DISPLAY" && conclusion === "CLEARED_FOR_DISPLAY",
    reviewedBy: ov?.reviewedBy ?? null,
    reviewedByName: ov?.reviewedByName ?? null,
    reviewedAt: ov?.reviewedAt ?? null,
    reason: ov?.reason ?? null,
  };
}

/** True only when a human CLEARED a source whose provenance is FEDERAL_PD. */
export function isImagesClearedForDisplay(sourceId: string): boolean {
  return getRuntimeImageRights(sourceId)?.clearedForDisplay === true;
}

export function listRuntimeImageRights(): EffectiveImageRights[] {
  return IMAGE_RIGHTS_SOURCE_IDS.map((id) => getRuntimeImageRights(id)!);
}

export function readImageRightsAudit(sourceId: string, limit = 10) {
  return readAuditEvents({ domain: IMAGE_RIGHTS_AUDIT_DOMAIN, subject: sourceId })
    .slice(-limit)
    .reverse();
}

/**
 * Record an operator image-rights decision. CLEAR sets CLEARED_FOR_DISPLAY —
 * but ONLY when the source's recorded provenance is FEDERAL_PD; a CLEAR on a
 * CONTRACTOR_UNCLEAR / THIRD_PARTY_COURTESY source is refused (conservative gate).
 * REJECT → NOT_CLEARED, NEEDS_LEGAL → NEEDS_LEGAL, HOLD → PENDING. Caller MUST
 * have verified Module 45 authority.
 */
export function recordImageRightsDecision(input: {
  sourceId: string;
  decision: ImageRightsDecision;
  reviewerId: string;
  reviewerName: string;
  reason: string;
}): EffectiveImageRights {
  const base = IMAGE_RIGHTS_ACTIVATION[input.sourceId];
  if (!base) throw new Error(`Unknown image-rights source "${input.sourceId}".`);

  if (input.decision === "CLEAR" && base.defaultProvenance !== "FEDERAL_PD") {
    throw new Error(
      `Refused: cannot CLEAR images for "${input.sourceId}" while provenance is ${base.defaultProvenance}. ` +
        `Only FEDERAL_PD may be cleared — verify federal authorship and update the record first.`,
    );
  }

  const now = new Date().toISOString();
  const status: ImageRightsStatus =
    input.decision === "CLEAR"
      ? "CLEARED_FOR_DISPLAY"
      : input.decision === "REJECT"
        ? "NOT_CLEARED"
        : input.decision === "NEEDS_LEGAL"
          ? "NEEDS_LEGAL"
          : "PENDING_HUMAN_APPROVAL";
  const conclusion: ImageRightsRecord["conclusion"] =
    input.decision === "CLEAR" ? "CLEARED_FOR_DISPLAY" : input.decision === "NEEDS_LEGAL" ? "NEEDS_LEGAL" : "NOT_CLEARED";

  const overlay = readOverlay();
  overlay[input.sourceId] = {
    status,
    conclusion,
    reviewedBy: input.reviewerId,
    reviewedByName: input.reviewerName,
    reviewedAt: now,
    reason: input.reason || null,
  };
  writeOverlay(overlay);

  appendAuditEvent({
    actorId: input.reviewerId,
    actorName: input.reviewerName,
    domain: IMAGE_RIGHTS_AUDIT_DOMAIN,
    subject: input.sourceId,
    decision: input.decision,
    reason: input.reason,
    detail: { module23: "Property image rights", status, conclusion, defaultProvenance: base.defaultProvenance },
  });

  return getRuntimeImageRights(input.sourceId)!;
}
