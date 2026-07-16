"use client";

export type PropertyEvaluationDraft = {
  propertyId: string;
  updatedAt: string;
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

const KEY = "furlong.property-evaluation-draft.v1";

function readAll(): Record<string, PropertyEvaluationDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed as Record<string, PropertyEvaluationDraft> : {};
  } catch {
    return {};
  }
}

function writeAll(next: Record<string, PropertyEvaluationDraft>): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
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
