"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STAGES = [
  ["PROPERTY_ANALYSIS", "Property"],
  ["FEASIBILITY", "Feasibility"],
  ["FINANCING_READINESS", "Readiness"],
  ["PROVIDER_COMPARISON", "Providers"],
  ["CASE_ROOM", "Case room"],
  ["DILIGENCE", "Diligence"],
  ["CLOSING", "Closing"],
  ["OPERATING_LOGBOOK", "Logbook"],
] as const;

type CaseRecord = {
  caseId: string;
  propertyId?: string | null;
  propertyAddress?: string | null;
  customerGoal?: string | null;
  currentStage: string;
  caseStatus: string;
  outcomeStatus: string;
  providerSelections?: unknown;
  updatedAt?: string | null;
};

type CaseEvent = {
  id: string;
  eventType: string;
  summary: string;
  eventStatus: string;
  occurredAt: string;
};

type CaseOutcome = {
  id: string;
  outcomeType: string;
  outcomeReasonCategory?: string | null;
  providerId?: string | null;
  verificationStatus: string;
  environmentalOutcome?: string | null;
  closedAt?: string | null;
  createdAt: string;
};

type DurableBundle = {
  record: CaseRecord;
  events: CaseEvent[];
  outcomes: CaseOutcome[];
};

type ApiResult = {
  ok?: boolean;
  persistenceAvailable?: boolean;
  persistenceNote?: string;
  durableCase?: DurableBundle | null;
  error?: string;
};

function formatDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export function LivingFurlongCasePanel({
  caseId,
  displayName,
  goal,
  state,
  customerTypes,
  intendedUses,
}: {
  caseId: string;
  displayName: string;
  goal: string;
  state: string | null;
  customerTypes: string[];
  intendedUses: string[];
}) {
  const [bundle, setBundle] = useState<DurableBundle | null>(null);
  const [persistenceAvailable, setPersistenceAvailable] = useState<boolean | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (displayName) params.set("name", displayName);
    if (goal) params.set("goal", goal);
    if (state) params.set("state", state);
    if (customerTypes.length) params.set("customerTypes", customerTypes.join(","));
    if (intendedUses.length) params.set("intendedUses", intendedUses.join(","));
    return params.toString();
  }, [customerTypes, displayName, goal, intendedUses, state]);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/intelligence/cases/${encodeURIComponent(caseId)}?${query}`, { cache: "no-store" });
      const data = await response.json() as ApiResult;
      if (!response.ok || data.ok !== true) throw new Error(data.error ?? "Case status is unavailable.");
      setPersistenceAvailable(data.persistenceAvailable === true);
      setBundle(data.durableCase ?? null);
      setNote(data.persistenceNote ?? null);
    } catch (error) {
      setPersistenceAvailable(false);
      setNote(error instanceof Error ? error.message : "Case status is unavailable.");
    }
  }, [caseId, query]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch(`/api/intelligence/cases/${encodeURIComponent(caseId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          case: {
            customerGoal: goal,
            currentStage: bundle?.record.currentStage ?? "PROPERTY_ANALYSIS",
            propertySnapshot: {
              displayName,
              state,
              intendedUses,
              source: "intelligence-case-workspace",
            },
            businessContext: { customerTypes },
            permissionState: {
              customerControlled: true,
              providerSharingAuthorized: false,
            },
            metadata: {
              savedFrom: "/intelligence/cases/[caseId]",
              noProviderDataSharedBySave: true,
            },
          },
        }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || data.ok !== true) throw new Error(data.error ?? "Case could not be saved.");
      setPersistenceAvailable(data.persistenceAvailable === true);
      setBundle(data.durableCase ?? null);
      setNote("Saved. This creates your living case; it does not send anything to a provider.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Case could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const currentStage = bundle?.record.currentStage ?? "PROPERTY_ANALYSIS";
  const stageIndex = Math.max(0, STAGES.findIndex(([id]) => id === currentStage));

  return (
    <section data-testid="living-furlong-case" style={{ border: "1px solid #c9d4e1", borderRadius: 14, background: "#fff", padding: 18, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 5 }}>
          <span style={{ color: "#8a6914", fontSize: 11, fontWeight: 850, letterSpacing: ".12em", textTransform: "uppercase" }}>Living Furlong Case</span>
          <h2 style={{ margin: 0, color: "#162033", fontSize: 21 }}>One record from property idea to keys—and beyond</h2>
          <p style={{ margin: 0, color: "#5d687a", lineHeight: 1.6, maxWidth: 820, fontSize: 13.5 }}>
            Property facts, feasibility, financing readiness, environmental work, provider permissions, closing progress, and verified outcomes stay attached to the same customer-controlled case instead of being rebuilt at every handoff.
          </p>
        </div>
        {!bundle && persistenceAvailable !== false && (
          <button type="button" disabled={busy} onClick={() => void save()} style={{ border: 0, borderRadius: 9, padding: "9px 13px", background: "#0f766e", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
            {busy ? "Saving…" : "Save this case"}
          </button>
        )}
        {bundle && (
          <button type="button" disabled={busy} onClick={() => void save()} style={{ border: "1px solid #0f766e", borderRadius: 9, padding: "8px 12px", background: "#fff", color: "#0f766e", fontWeight: 800, cursor: "pointer" }}>
            {busy ? "Updating…" : "Update case snapshot"}
          </button>
        )}
      </div>

      <div aria-label="Furlong case progression" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(105px,1fr))", gap: 7 }}>
        {STAGES.map(([id, label], index) => {
          const complete = index < stageIndex;
          const active = id === currentStage;
          return (
            <div key={id} style={{ borderRadius: 9, border: active ? "1px solid #8a6914" : "1px solid #d7deea", background: active ? "#fff8e7" : complete ? "#eef8f5" : "#f8fafc", padding: "8px 9px", display: "grid", gap: 2 }}>
              <span style={{ color: active ? "#8a6914" : complete ? "#0f766e" : "#8090a0", fontSize: 10.5, fontWeight: 850 }}>{complete ? "✓" : active ? "NOW" : `${index + 1}`}</span>
              <strong style={{ color: "#263548", fontSize: 11.5 }}>{label}</strong>
            </div>
          );
        })}
      </div>

      {bundle ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, display: "grid", gap: 5 }}>
            <strong style={{ color: "#162033", fontSize: 13.5 }}>Current case state</strong>
            <span style={{ color: "#526074", fontSize: 12.5 }}>Stage: {bundle.record.currentStage.replaceAll("_", " ")}</span>
            <span style={{ color: "#526074", fontSize: 12.5 }}>Case: {bundle.record.caseStatus.replaceAll("_", " ")}</span>
            <span style={{ color: "#526074", fontSize: 12.5 }}>Outcome: {bundle.record.outcomeStatus.replaceAll("_", " ")}</span>
            {bundle.record.updatedAt && <span style={{ color: "#8090a0", fontSize: 11.5 }}>Updated {formatDate(bundle.record.updatedAt)}</span>}
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, display: "grid", gap: 5 }}>
            <strong style={{ color: "#162033", fontSize: 13.5 }}>Sharing boundary</strong>
            <span style={{ color: "#526074", fontSize: 12.5, lineHeight: 1.55 }}>Saving or updating this case shares nothing with a lender. Each provider receives only a frozen package you separately authorize for that named recipient.</span>
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc", color: "#526074", fontSize: 12.5, lineHeight: 1.55 }}>
          This analysis can remain unsaved. Create a living case only when you want Furlong to carry the same property and decision context forward.
        </div>
      )}

      {bundle && bundle.events.length > 0 && (
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 800, color: "#1C2B45" }}>Case timeline ({bundle.events.length})</summary>
          <div style={{ display: "grid", gap: 7, paddingTop: 10 }}>
            {bundle.events.slice(0, 12).map((event) => (
              <div key={event.id} style={{ borderLeft: "3px solid #c9d4e1", paddingLeft: 10, display: "grid", gap: 2 }}>
                <strong style={{ color: "#263548", fontSize: 12.5 }}>{event.summary}</strong>
                <span style={{ color: "#8090a0", fontSize: 11 }}>{event.eventType.replaceAll("_", " ")} · {formatDate(event.occurredAt)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {bundle && bundle.outcomes.length > 0 && (
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 800, color: "#1C2B45" }}>Verified outcome learning ({bundle.outcomes.length})</summary>
          <div style={{ display: "grid", gap: 7, paddingTop: 10 }}>
            {bundle.outcomes.slice(0, 10).map((outcome) => (
              <div key={outcome.id} style={{ border: "1px solid #e2e8f0", borderRadius: 9, padding: 10, display: "grid", gap: 2 }}>
                <strong style={{ color: "#263548", fontSize: 12.5 }}>{outcome.outcomeType.replaceAll("_", " ")}</strong>
                <span style={{ color: "#526074", fontSize: 11.5 }}>
                  {outcome.providerId ? `${outcome.providerId} · ` : ""}{outcome.verificationStatus.replaceAll("_", " ")}{outcome.outcomeReasonCategory ? ` · ${outcome.outcomeReasonCategory}` : ""}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {persistenceAvailable === false && (
        <div role="status" style={{ border: "1px solid #e3c777", borderRadius: 9, background: "#fff9e8", padding: "9px 11px", color: "#6f571c", fontSize: 12.5 }}>
          {note ?? "The living-case database migration has not been promoted in this environment yet. The advisory analysis remains available."}
        </div>
      )}
      {note && persistenceAvailable !== false && <span role="status" style={{ color: "#526074", fontSize: 12.5 }}>{note}</span>}
    </section>
  );
}
