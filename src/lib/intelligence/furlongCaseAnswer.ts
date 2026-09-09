import { ANSWER_QUESTIONS, composeFurlongAnswer, type FurlongAnswer } from "@/lib/property/furlongAnswer";
export type CustomerCaseRecord = {
  caseId: string; propertyAddress?: string | null; customerGoal?: string | null;
  currentStage: string; caseStatus: string; outcomeStatus: string;
  propertySnapshot?: unknown; businessContext?: unknown; borrowerReadiness?: unknown; documentRefs?: unknown;
  updatedAt?: string | null; replayRef?: string | null;
};
export type CustomerCaseEvent = { id: string; eventType: string; summary: string; eventStatus: string; occurredAt: string };
export function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function textValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
/** Saved snapshots are customer-supplied records, not refreshed verification.
 * Preserve wording without upgrading a client-claimed evidence status. */
export function savedCaseAnswer(record: CustomerCaseRecord): FurlongAnswer {
  const snapshot = object(object(record.propertySnapshot).answerSnapshot);
  const sections = Array.isArray(snapshot.sections) ? snapshot.sections.map(object) : [];
  const answer = (key: string, fallback: string) => textValue(sections.find(section => section.key === key)?.text, fallback);
  const sourceRows = Array.isArray(snapshot.sources) ? snapshot.sources.slice(0,50).map(object) : [];
  const documentCount = Array.isArray(record.documentRefs) ? record.documentRefs.length : 0;
  return composeFurlongAnswer({
    subjectId: record.caseId,
    title: record.propertyAddress || textValue(snapshot.title, "Your Furlong case"),
    sourceDate: typeof snapshot.sourceDate === "string" ? snapshot.sourceDate : null,
    price: { amount: null, label: "Saved price context—re-verification required", basis: "Customer-saved snapshot" },
    intendedUse: record.customerGoal || "Project goal not recorded",
    sources: sourceRows.map(source => ({ label: textValue(source.label,"Saved source reference"), url: typeof source.url === "string" ? source.url : null, asOf: typeof source.asOf === "string" ? source.asOf : null })),
    scope: "Customer-saved snapshot, not refreshed or independently re-verified on return. Recorded document references: " + documentCount + "; this count does not establish document completeness or acceptance. Record version: " + (record.replayRef || "not supplied") + ". Not an appraisal, clearance or financing approval.",
    answers: Object.fromEntries(ANSWER_QUESTIONS.map(([key]) => [key, {
      text: answer(key, ({
        possibilities: record.customerGoal || "Add your property or project goal before evaluating possibilities.",
        numbers: "Current price, supported income, operating expenses and proposed financing terms have not been established in this saved summary.",
        constraints: "Property, legal-use and environmental constraints require case-specific evidence.",
        unknowns: "Evidence completeness has not been verified. Review the case and source records before proceeding.",
        next: "Review the saved context and supply the missing evidence. Saving does not appoint a provider.",
      })[key]),
      status: "SCREENING",
    }])) as Parameters<typeof composeFurlongAnswer>[0]["answers"],
  });
}
