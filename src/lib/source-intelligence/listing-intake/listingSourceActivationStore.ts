/**
 * Runtime listing review store — SERVER-ONLY (fs). SOURCE-INTELLIGENCE unit.
 *
 * Mirrors placeFactActivationStore. Operator decisions on a listing (or a
 * lister-type source) write a git-ignored overlay + the shared audit ledger
 * (domain "listing-source-review"). APPROVE is REFUSED unless counsel has
 * cleared the listing's state — the build never bypasses the counsel gate, and
 * never self-approves. Counsel-cleared states are also recorded here (human
 * action) on top of the empty COUNSEL_CLEARED_STATES default.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { appendAuditEvent, readAuditEvents } from "@/lib/property/auditLedger";
import { COUNSEL_CLEARED_STATES } from "./listingSourceActivation";

const STATE_PATH = path.join(process.cwd(), "data", "listing-review-state.json");
export const LISTING_AUDIT_DOMAIN = "listing-source-review";

export type ListingDecision = "APPROVE" | "REJECT" | "HOLD" | "SHELVE_PROVENANCE";

interface OverlayState {
  listings: Record<string, { status: string; reviewedBy: string | null; reviewedByName: string | null; reviewedAt: string | null; reason: string | null }>;
  /** States a human has recorded as counsel-cleared (on top of the empty default). */
  counselClearedStates: string[];
}

function readOverlay(): OverlayState {
  try {
    const o = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    return { listings: o.listings ?? {}, counselClearedStates: o.counselClearedStates ?? [] };
  } catch {
    return { listings: {}, counselClearedStates: [] };
  }
}
function writeOverlay(o: OverlayState): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(o, null, 2) + "\n", "utf8");
}

/** Effective counsel-cleared states = empty default ∪ human-recorded overlay. */
export function counselClearedStates(): string[] {
  return [...new Set([...COUNSEL_CLEARED_STATES, ...readOverlay().counselClearedStates])];
}
export function isStateCounselCleared(state: string): boolean {
  return counselClearedStates().includes(state.toUpperCase());
}

/** Record a counsel clearance for a state (human action; audit-logged). */
export function recordCounselClearance(input: { state: string; reviewerId: string; reviewerName: string; reason: string }): string[] {
  const o = readOverlay();
  const st = input.state.toUpperCase();
  if (!o.counselClearedStates.includes(st)) o.counselClearedStates.push(st);
  writeOverlay(o);
  appendAuditEvent({
    actorId: input.reviewerId, actorName: input.reviewerName, domain: LISTING_AUDIT_DOMAIN,
    subject: `counsel-clearance:${st}`, decision: "COUNSEL_CLEARED", reason: input.reason,
    detail: { state: st, note: "Real estate attorney confirmed free-venue posture for this state." },
  });
  return counselClearedStates();
}

export interface EffectiveListingState {
  listingId: string;
  status: string;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reason: string | null;
}

export function getListingState(listingId: string, defaultStatus = "PENDING_HUMAN_APPROVAL"): EffectiveListingState {
  const ov = readOverlay().listings[listingId];
  return {
    listingId,
    status: ov?.status ?? defaultStatus,
    reviewedBy: ov?.reviewedBy ?? null,
    reviewedByName: ov?.reviewedByName ?? null,
    reviewedAt: ov?.reviewedAt ?? null,
    reason: ov?.reason ?? null,
  };
}

/**
 * Record an operator decision on a listing. APPROVE is REFUSED unless the
 * listing's state is counsel-cleared (hard gate). Caller MUST have verified
 * Module 45 authority. Every decision is audit-logged.
 */
export function recordListingDecision(input: {
  listingId: string;
  listingState: string; // the property's US state, for the counsel gate
  decision: ListingDecision;
  reviewerId: string;
  reviewerName: string;
  reason: string;
}): EffectiveListingState {
  if (input.decision === "APPROVE" && !isStateCounselCleared(input.listingState)) {
    throw new Error(
      `Refused: cannot APPROVE listing "${input.listingId}" — state ${input.listingState} is not counsel-cleared. ` +
        `A real estate attorney must confirm the free-venue posture for that state first (recordCounselClearance).`,
    );
  }
  const now = new Date().toISOString();
  const status =
    input.decision === "APPROVE" ? "APPROVED"
    : input.decision === "REJECT" ? "REJECTED"
    : input.decision === "SHELVE_PROVENANCE" ? "SHELVED_PENDING_PROVENANCE"
    : "PENDING_HUMAN_APPROVAL";

  const o = readOverlay();
  o.listings[input.listingId] = { status, reviewedBy: input.reviewerId, reviewedByName: input.reviewerName, reviewedAt: now, reason: input.reason || null };
  writeOverlay(o);

  appendAuditEvent({
    actorId: input.reviewerId, actorName: input.reviewerName, domain: LISTING_AUDIT_DOMAIN,
    subject: input.listingId, decision: input.decision, reason: input.reason,
    detail: { status, listingState: input.listingState.toUpperCase(), counselCleared: isStateCounselCleared(input.listingState) },
  });
  return getListingState(input.listingId);
}

export function readListingAudit(listingId: string, limit = 10) {
  return readAuditEvents({ domain: LISTING_AUDIT_DOMAIN, subject: listingId }).slice(-limit).reverse();
}
