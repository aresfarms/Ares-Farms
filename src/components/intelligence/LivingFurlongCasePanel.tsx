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
      <details style={box}><summary>Recorded outcomes ({bundle.outcomes.length})</summary>
        {bundle.outcomes.length ? bundle.outcomes.map(outcome => <p key={outcome.id}>{outcome.outcomeType} — {outcome.verificationStatus}</p>) : <p>No actual outcomes recorded.</p>}
        <p>Customer reports remain separate from verified outcomes.</p>
      </details>
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
    <Link href="/intelligence/cases">Back to My Cases</Link>
  </section>;
}
