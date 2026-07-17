"use client";

export type PropertyEvaluationDraft = {
  propertyId: string;
  updatedAt: string;
  /** Context snapshot so a saved draft can be listed and resumed later —
      enough to rebuild the analysis URL, nothing about the person. */
  resume?: {
    title: string;
    location: string;
    href: string;
  };
  answers: {
    reportTier: "free" | "paid" | "environmental";
    possibility: string;
    usePlan: string;
    capitalPlan: string;
    timing: string;
    requestedAmount: string;
    operatorExperience: string;
    revenueModel: string;
    renovationScope: string;
    ownershipPosture: string;
    documents: string[];
  };
};

/**
 * Drafts persist in localStorage — ON THIS DEVICE ONLY, indefinitely, so a
 * visitor can come back a week or six months later (founder direction
 * 2026-07-17). Privacy posture unchanged in the way that matters: nothing
 * ever leaves the device, nothing is sent to a server, and the visitor can
 * delete any draft (or clear the browser) at any time. Copy on the surfaces
 * says "saved on this device" — never "saved to your account".
 *
 * v1 lived in sessionStorage (per-tab); v2 migrates any v1 payload forward
 * once so an in-flight session isn't lost by the upgrade.
 */
const KEY = "furlong.property-evaluation-draft.v2";
const LEGACY_SESSION_KEY = "furlong.property-evaluation-draft.v1";

function readAll(): Record<string, PropertyEvaluationDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const drafts =
      parsed && typeof parsed === "object" ? (parsed as Record<string, PropertyEvaluationDraft>) : {};
    // One-time migration of the old per-tab store.
    const legacy = window.sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (legacy) {
      try {
        const legacyDrafts = JSON.parse(legacy) as Record<string, PropertyEvaluationDraft>;
        for (const [id, draft] of Object.entries(legacyDrafts)) {
          if (!drafts[id]) drafts[id] = draft;
        }
        window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
        window.localStorage.setItem(KEY, JSON.stringify(drafts));
      } catch {
        /* legacy payload unreadable — ignore */
      }
    }
    return drafts;
  } catch {
    return {};
  }
}

function writeAll(next: Record<string, PropertyEvaluationDraft>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* best effort only */
  }
}

export function loadPropertyEvaluationDraft(propertyId: string): PropertyEvaluationDraft | null {
  return readAll()[propertyId] ?? null;
}

export function savePropertyEvaluationDraft(draft: PropertyEvaluationDraft): void {
  const all = readAll();
  all[draft.propertyId] = draft;
  writeAll(all);
}

/** All drafts on this device, most recently updated first. */
export function listPropertyEvaluationDrafts(): PropertyEvaluationDraft[] {
  return Object.values(readAll()).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function deletePropertyEvaluationDraft(propertyId: string): void {
  const all = readAll();
  delete all[propertyId];
  writeAll(all);
}
