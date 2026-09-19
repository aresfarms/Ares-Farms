"use client";
import { useState } from "react";
import Link from "next/link";
import type { FurlongAnswer } from "@/lib/property/furlongAnswer";


export function FurlongAnswerCard({ answer, allowSave = false, savedCase }: { answer: FurlongAnswer; allowSave?: boolean; savedCase?: { caseId: string; recordVersion: string } }) {
  const [exporting, setExporting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [exportNote, setExportNote] = useState("");
  async function download() {
    if (!savedCase || !consent) return;
    setExporting(true); setExportNote("");
    try {
      const response = await fetch("/api/intelligence/cases/" + encodeURIComponent(savedCase.caseId) + "/export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: "furlong-answer-personal-download-v1", expectedRecordVersion: savedCase.recordVersion }),
      });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Download unavailable."); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = "Furlong-Answer.zip"; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportNote("Download prepared: PDF, printable HTML, JSON and integrity manifest. No provider received it.");
    } catch (error) { setExportNote(error instanceof Error ? error.message : "Download unavailable."); }
    finally { setExporting(false); }
  }
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [caseHref, setCaseHref] = useState<string | null>(null);
  async function save() {
    setSaving(true); setSaveNote("");
    try {
      const response = await fetch("/api/intelligence/cases/new-draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", case: { propertyId: answer.subjectId, propertyAddress: answer.title,
          propertySnapshot: { answerSnapshot: answer, capturedAt: new Date().toISOString() } } }),
      });
      const result = await response.json();
      if (!response.ok || !result.durableCase?.record?.caseId) throw new Error(response.status === 401 || response.status === 403
        ? "Sign in before saving. The answer has not been saved." : result.error || "The case could not be saved.");
      setCaseHref("/intelligence/cases/" + encodeURIComponent(result.durableCase.record.caseId));
      setSaveNote("Added to My Intelligence privately. No provider received this case.");
    } catch (error) { setSaveNote(error instanceof Error ? error.message : "The case could not be saved."); }
    finally { setSaving(false); }
  }
  return <article data-testid="furlong-answer" style={{ background: "#fff", color: "#162b40", border: "1px solid #ccd6df", borderTop: "4px solid #a67a26", borderRadius: 14, padding: "clamp(18px,3vw,28px)", display: "grid", gap: 16 }}>
    <header><h2 style={{ margin: 0, fontFamily: "Georgia,serif", fontSize: 28 }}>The Furlong Answer</h2><p>{answer.title}</p></header>
    {answer.sections.map(section => <section key={section.key} data-answer-section={section.key}>
      <h3 style={{ fontSize: 17, margin: "0 0 6px" }}>{section.question}</h3>
      <span style={{ color: "#6b501f", fontSize: 13, fontWeight: 700 }}>{section.status}</span>
      <p style={{ margin: "6px 0 0", fontSize: 16, lineHeight: 1.65 }}>{section.text}</p>
    </section>)}
    <details><summary style={{ cursor: "pointer", minHeight: 44 }}>Sources, dates and limits</summary>
      {answer.sources.length ? <ul>{answer.sources.map((source, index) => <li key={index}>
        {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a> : source.label} — {source.asOf || "Source date not supplied"}
      </li>)}</ul> : <p>No source links supplied with this snapshot.</p>}
      <p>{answer.scope}</p><small>Format: {answer.version}</small>
    </details>
    {savedCase ? <div>
      <label style={{ display: "flex", gap: 10, alignItems: "start", fontSize: 14, lineHeight: 1.6 }}>
        <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />
        I want a personal reference copy. This download is recorded for integrity and audit purposes; it does not authorize a provider or attach private documents. Downloaded files cannot be remotely revoked.
      </label>
      <button type="button" disabled={!consent || exporting} onClick={() => void download()} style={{ marginTop: 12, border: 0, borderRadius: 8, padding: "12px 16px", background: "#0c635c", color: "#fff", fontSize: 16, cursor: "pointer", opacity: !consent || exporting ? .55 : 1 }}>{exporting ? "Preparing download…" : "Download this saved answer"}</button>
      <p role="status">{exportNote}</p>
    </div> : <p>To keep building this investigation over time, add it to My Intelligence. Signing in to save is separate from sharing.</p>}
    {allowSave && <div>
      {caseHref ? <Link href={caseHref}>Open this investigation</Link> : <button type="button" disabled={saving} onClick={() => void save()} style={{ padding: 12, fontSize: 16 }}>{saving ? "Saving…" : "Add to My Intelligence"}</button>}
      <p role="status">{saveNote}</p>
      {saveNote.includes("Sign in") && <Link href="/sign-in">Sign in</Link>}
    </div>}
    <p style={{ margin: 0, fontSize: 14, color: "#4c6170" }}>A personal reference copy is not a professional certification, appraisal or lender acceptance. Integrity records do not verify the underlying facts. Saved and downloaded copies are not automatically refreshed.</p>
  </article>;
}
