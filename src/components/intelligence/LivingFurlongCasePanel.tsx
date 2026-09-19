"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FurlongAnswerCard } from "@/components/property/FurlongAnswerCard";
import { object, textValue, savedCaseAnswer, type CustomerCaseRecord, type CustomerCaseEvent } from "@/lib/intelligence/furlongCaseAnswer";

const STAGES = [
  ["PROPERTY_ANALYSIS", "Property"], ["FEASIBILITY", "Feasibility"],
  ["FINANCING_READINESS", "Readiness"], ["PROVIDER_COMPARISON", "Providers"],
  ["CASE_ROOM", "Case room"], ["DILIGENCE", "Diligence"],
  ["CLOSING", "Closing"], ["OPERATING_LOGBOOK", "Logbook"],
] as const;
type Bundle = { record: CustomerCaseRecord; events: CustomerCaseEvent[]; outcomes: Array<{ id: string; outcomeType: string; verificationStatus: string }> };
const box = { border: "1px solid #ccd6df", borderRadius: 12, padding: 18, background: "#fff" } as const;

export function LivingFurlongCasePanel({ caseId, displayName, goal, state, customerTypes, intendedUses }: {
  caseId: string; displayName: string; goal: string; state: string | null; customerTypes: string[]; intendedUses: string[];
}) {
  const router = useRouter();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcomeType, setOutcomeType] = useState("ACQUISITION_UPDATE");
  const [actualProjectCost, setActualProjectCost] = useState("");
  const [actualRatePct, setActualRatePct] = useState("");
  const [environmentalOutcome, setEnvironmentalOutcome] = useState("");
  const [outcomeNote, setOutcomeNote] = useState("");
  const [reload, setReload] = useState(0);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [rememberVisits, setRememberVisits] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setBundle(null); setError("");
    void fetch("/api/intelligence/cases/" + encodeURIComponent(caseId), { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.ok || data.persistenceAvailable === false) throw new Error(data.error || "Saved-case information is temporarily unavailable. Please try again.");
        setBundle(data.durableCase ?? null);
      }).catch(error => { if (error.name !== "AbortError") setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [caseId, reload]);
  useEffect(() => {
    try {
      const remembered = localStorage.getItem("furlong-remember-case-visits") === "yes";
      setRememberVisits(remembered);
      setLastVisit(remembered ? localStorage.getItem("furlong-case-visit:" + caseId) : null);
      if (remembered) localStorage.setItem("furlong-case-visit:" + caseId, new Date().toISOString());
    } catch { setLastVisit(null); }
  }, [caseId]);
  const answer = useMemo(() => bundle ? savedCaseAnswer(bundle.record) : null, [bundle]);
  const readiness = object(bundle?.record.borrowerReadiness);
  const propertySnapshot = object(bundle?.record.propertySnapshot);
  const businessContext = object(bundle?.record.businessContext);
  const durableCustomerTypes = Array.isArray(businessContext.customerTypes)
    ? businessContext.customerTypes.filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    : customerTypes;
  const durableIntendedUses = Array.isArray(propertySnapshot.intendedUses)
    ? propertySnapshot.intendedUses.filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    : intendedUses;
  const onboardingParams = new URLSearchParams({ caseId });
  const effectiveName = bundle?.record.propertyAddress || textValue(propertySnapshot.displayName, displayName);
  const effectiveGoal = bundle?.record.customerGoal || goal;
  const effectiveState = textValue(propertySnapshot.state, state || "");
  if (effectiveName) onboardingParams.set("name", effectiveName);
  if (effectiveGoal) onboardingParams.set("goal", effectiveGoal);
  if (effectiveState) onboardingParams.set("state", effectiveState);
  if (durableCustomerTypes.length) onboardingParams.set("customerTypes", durableCustomerTypes.join(","));
  if (durableIntendedUses.length) onboardingParams.set("intendedUses", durableIntendedUses.join(","));
  const navigatorParams = new URLSearchParams(onboardingParams);
  const changes = (bundle?.events ?? []).filter(event => !lastVisit || new Date(event.occurredAt).getTime() > new Date(lastVisit).getTime());
  async function save() {
    setBusy(true); setNote("");
    try {
      const response = await fetch("/api/intelligence/cases/" + encodeURIComponent(caseId), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", case: { customerGoal: goal,
          ...(!bundle ? { propertySnapshot: { displayName, state, intendedUses, source: "intelligence-case-workspace" }, businessContext: { customerTypes } } : {}) } }),
      });
      const result = await response.json();
      if (!response.ok || !result.durableCase?.record?.caseId) throw new Error(result.error || "The case could not be saved.");
      setNote("Saved. Saving or updating this case shares nothing with a lender.");
      if (result.durableCase.record.caseId !== caseId) router.replace("/intelligence/cases/" + encodeURIComponent(result.durableCase.record.caseId));
      else { setBundle(result.durableCase); }
    } catch (error) { setNote(error instanceof Error ? error.message : "The case could not be saved."); }
    finally { setBusy(false); }
  }
  async function recordOutcome() {
    setBusy(true); setOutcomeNote("");
    try {
      const parsedProjectCost = actualProjectCost.trim() ? Number(actualProjectCost.replace(/[^0-9.]/g, "")) : null;
      const parsedRatePct = actualRatePct.trim() ? Number(actualRatePct.replace(/[^0-9.]/g, "")) : null;
      if (parsedProjectCost != null && (!Number.isFinite(parsedProjectCost) || parsedProjectCost < 0)) throw new Error("Enter a valid actual project cost.");
      if (parsedRatePct != null && (!Number.isFinite(parsedRatePct) || parsedRatePct < 0)) throw new Error("Enter a valid actual interest rate.");
      const response = await fetch("/api/intelligence/cases/" + encodeURIComponent(caseId), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record-outcome",
          outcomeType,
          actualProjectCost: parsedProjectCost,
          actualRateBps: parsedRatePct == null ? null : Math.round(parsedRatePct * 100),
          environmentalOutcome: environmentalOutcome.trim() || null,
          evidenceRefs: [],
          verified: false,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "The outcome could not be recorded.");
      setOutcomeNote("Recorded as a customer-reported outcome. It remains separate from verified evidence until an authorized verification step occurs.");
      setActualProjectCost(""); setActualRatePct(""); setEnvironmentalOutcome("");
      setReload(value => value + 1);
    } catch (error) {
      setOutcomeNote(error instanceof Error ? error.message : "The outcome could not be recorded.");
    } finally { setBusy(false); }
  }

  return <section data-testid="living-furlong-case" style={{ display: "grid", gap: 18, fontSize: 16, lineHeight: 1.65 }}>
    {loading && <p role="status">Loading your case…</p>}
    {error && <div role="alert" style={box}><p>{error}</p><button type="button" onClick={() => setReload(value => value + 1)}>Try again</button></div>}
    {!loading && !error && !bundle && <div style={box}>
      <h2>Save this project when you are ready</h2><p>{displayName}</p><p>{goal || "Your project goal has not been recorded."}</p>
      <p>This preview has not been saved. Creating a case does not share it or appoint a provider.</p>
      <button type="button" onClick={() => void save()} disabled={busy} style={{ padding: 12 }}>{busy ? "Saving…" : "Save this case"}</button>
    </div>}
    {bundle && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 14 }}>
        <section style={box}><h2 style={{ fontSize: 18 }}>{lastVisit ? "Changes since your last recorded visit" : "Recent recorded changes"}</h2>
          {changes.length ? <ul>{changes.slice(0,5).map(event => <li key={event.id}>{event.summary}<br /><small>{new Date(event.occurredAt).toLocaleString()}</small></li>)}</ul> : <p>No newer events in the returned timeline. This is not confirmation that external work is complete.</p>}
          <label><input type="checkbox" checked={rememberVisits} onChange={event => {
            const checked = event.target.checked;
            try {
              if (checked) { localStorage.setItem("furlong-remember-case-visits", "yes"); localStorage.setItem("furlong-case-visit:" + caseId, new Date().toISOString()); }
              else { localStorage.removeItem("furlong-remember-case-visits"); Object.keys(localStorage).filter(key => key.startsWith("furlong-case-visit:")).forEach(key => localStorage.removeItem(key)); setLastVisit(null); }
              setRememberVisits(checked);
            } catch { setNote("This browser could not remember the visit."); }
          }} /> Remember visit times on this device</label>
        </section>
        <section style={box}><h2 style={{ fontSize: 18 }}>What needs your attention</h2><p>{answer?.sections.find(section => section.key === "next")?.text}</p></section>
        <section style={box}><h2 style={{ fontSize: 18 }}>Who is responsible next?</h2><p>{textValue(readiness.nextActionOwner, "No responsible person is recorded. Confirm who will handle the next action; do not assume it has been assigned.")}</p></section>
        <section style={box}><h2 style={{ fontSize: 18 }}>What is waiting?</h2><p>{textValue(readiness.waitingOn, "No external waiting status is recorded. Review the missing evidence and confirm any provider handoff separately.")}</p></section>
      </div>
      <section style={box}><h2 style={{ fontSize: 18 }}>Recorded stage</h2>
        <p>{STAGES.find(([id]) => id === bundle.record.currentStage)?.[1] || "Not established"} · {bundle.record.caseStatus.replaceAll("_"," ").toLowerCase()}</p>
        <p>A recorded stage does not certify earlier steps as complete. No percentage or completion checkmarks are inferred.</p>
        <p>Last saved: {bundle.record.updatedAt ? new Date(bundle.record.updatedAt).toLocaleString() : "Not recorded"}</p>
        <p>Saving or updating this case shares nothing with a lender. Recipient authorization remains separate.</p>
      </section>
      {answer && <FurlongAnswerCard answer={answer} savedCase={{ caseId, recordVersion: bundle.record.replayRef || bundle.record.updatedAt || "" }} />}
      <section data-testid="real-world-outcome-loop" style={{ ...box, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 5 }}>
          <span style={{ color: "#8F6E1F", fontSize: 10.5, fontWeight: 850, letterSpacing: ".12em", textTransform: "uppercase" }}>Measure the real-world result</span>
          <h2 style={{ margin: 0, fontSize: 20, color: "#162b40" }}>Did the thesis hold up?</h2>
          <p style={{ margin: 0, color: "#526074" }}>Record what actually happened so later Furlong work can distinguish the original model from the real outcome. Customer-reported outcomes remain pending verification and do not silently certify closing, appraisal, environmental clearance, or lender approval.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 13, fontWeight: 700 }}>Outcome type
            <select value={outcomeType} onChange={event => setOutcomeType(event.target.value)} style={{ minHeight: 42, border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", background: "#fff" }}>
              <option value="ACQUISITION_UPDATE">Acquisition / offer update</option>
              <option value="FINANCING_UPDATE">Financing update</option>
              <option value="PROJECT_COST_UPDATE">Renovation / project-cost update</option>
              <option value="ENVIRONMENTAL_UPDATE">Environmental / diligence update</option>
              <option value="OPERATING_UPDATE">Operating update</option>
              <option value="EXIT_UPDATE">Exit / disposition update</option>
              <option value="PASSED_ON_PROPERTY">Passed on this property</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 13, fontWeight: 700 }}>Actual project cost, if known
            <input value={actualProjectCost} onChange={event => setActualProjectCost(event.target.value)} inputMode="decimal" placeholder="e.g. 425000" style={{ minHeight: 42, border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px" }} />
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 13, fontWeight: 700 }}>Actual interest rate %, if applicable
            <input value={actualRatePct} onChange={event => setActualRatePct(event.target.value)} inputMode="decimal" placeholder="e.g. 6.75" style={{ minHeight: 42, border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px" }} />
          </label>
        </div>
        <label style={{ display: "grid", gap: 5, fontSize: 13, fontWeight: 700 }}>What changed in diligence, environmental, or operating reality?
          <textarea value={environmentalOutcome} onChange={event => setEnvironmentalOutcome(event.target.value)} rows={3} placeholder="Record the actual result or material change. Keep source documents in the governed evidence flow rather than pasting sensitive records here." style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", resize: "vertical" }} />
        </label>
        <button type="button" disabled={busy} onClick={() => void recordOutcome()} style={{ justifySelf: "start", border: 0, borderRadius: 9, padding: "11px 15px", background: "#0f766e", color: "#fff", fontWeight: 800, cursor: busy ? "progress" : "pointer" }}>{busy ? "Recording…" : "Record real-world outcome"}</button>
        {outcomeNote && <p role="status" style={{ margin: 0, color: "#526074" }}>{outcomeNote}</p>}
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>Recorded outcomes ({bundle.outcomes.length})</summary>
          {bundle.outcomes.length ? bundle.outcomes.map(outcome => <p key={outcome.id}>{outcome.outcomeType.replaceAll("_"," ").toLowerCase()} — {outcome.verificationStatus.replaceAll("_"," ").toLowerCase()}</p>) : <p>No actual outcomes recorded yet.</p>}
          <p>Customer reports remain separate from verified outcomes. A rejected or abandoned property is still useful intelligence.</p>
        </details>
      </section>
      <button type="button" onClick={() => setReload(value => value + 1)} style={{ justifySelf: "start", padding: 12 }}>Refresh recorded case information</button>
    </>}
    {note && <p role="status">{note}</p>}
    <section style={{ ...box, display: "grid", gap: 8 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Continue building this case</h2>
      <p style={{ margin: 0, color: "#526074" }}>Add project context or return to the Navigator without creating a second matter. These links do not share the case with a provider.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href={`/onboarding?${onboardingParams.toString()}`}>Enrich this case through onboarding</Link>
        <Link href={`/navigator?${navigatorParams.toString()}`}>Continue this case in Navigator</Link>
      </div>
    </section>
    <Link href="/intelligence/cases">Back to My Intelligence</Link>
  </section>;
}
