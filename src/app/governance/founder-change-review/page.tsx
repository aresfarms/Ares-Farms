"use client";

import { useState } from "react";

export default function FounderChangeReviewPage() {
  const [requestId, setRequestId] = useState("");
  const [snapshot, setSnapshot] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    setError(null);
    const response = await fetch(`/api/governance/founder-change-review?requestId=${encodeURIComponent(requestId)}`, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) setError(json.error ?? "Unable to load review packet.");
    else setSnapshot(json.snapshot);
  }
  return <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 20px",fontFamily:"system-ui"}}>
    <h1>Founder Change Review Workspace</h1>
    <p>This restricted workspace presents the immutable plain-language assurance report, outside-group reviews, and three-founder launch authority. It never activates a release.</p>
    <div style={{display:"flex",gap:8,margin:"20px 0"}}>
      <input aria-label="Request ID" value={requestId} onChange={(e)=>setRequestId(e.target.value)} placeholder="Change request ID" style={{flex:1,padding:10}} />
      <button onClick={load} style={{padding:"10px 18px"}}>Load packet</button>
    </div>
    {error ? <p role="alert">{error}</p> : null}
    {snapshot ? <>
      <section><h2>Status</h2><p><strong>Report:</strong> {snapshot.report?.status ?? "No frozen report"}</p><p><strong>Internal pilot:</strong> {snapshot.pilotTestDecision?.status ?? "Blocked"}</p><p><strong>Founder authority:</strong> {snapshot.founderReleaseDecision?.status ?? "Not yet available"}</p><p><strong>Activation performed:</strong> No</p></section>
      {snapshot.report ? <>
        <section><h2>Plain-English assurance</h2><p><strong>What changed:</strong> {snapshot.report.summary.whatChanged}</p><p><strong>Why:</strong> {snapshot.report.summary.whyItChanged}</p><p><strong>Who is affected:</strong> {snapshot.report.summary.whoIsAffected}</p></section>
        <section><h2>What testing proved</h2><ul>{snapshot.report.summary.whatTestsProved.map((x:string)=><li key={x}>{x}</li>)}</ul></section>
        <section><h2>What testing did not prove</h2><ul>{snapshot.report.summary.whatTestsDidNotProve.map((x:string)=><li key={x}>{x}</li>)}</ul></section>
        <section><h2>Principal risks</h2><ul>{snapshot.report.summary.principalRisks.map((x:string)=><li key={x}>{x}</li>)}</ul></section>
        <section><h2>Rollback</h2><p>{snapshot.report.summary.rollbackExplanation}</p></section>
        <section><h2>Required reviewers</h2><p>{snapshot.report.requiredReviewers.join(" + ")}</p><ul>{snapshot.report.checklistOverlay.map((x:string)=><li key={x}>{x.replaceAll("-"," ")}</li>)}</ul></section>
        <section><h2>Current blockers</h2>{snapshot.report.blockers.length ? <ul>{snapshot.report.blockers.map((x:string)=><li key={x}>{x}</li>)}</ul> : <p>None in the frozen report.</p>}</section><section><h2>Pilot testing boundary</h2><p>Stuart may green-light controlled internal testing after the owner attestation. This never permits public launch, external actions, payment capture, notice delivery, or official reliance. Francis remains required for final launch review.</p>{snapshot.pilotTestDecision?.blockers?.length ? <ul>{snapshot.pilotTestDecision.blockers.map((x:string)=><li key={x}>{x}</li>)}</ul> : <p>Pilot gate has no blockers.</p>}</section>
      </> : null}
      <details><summary>Immutable evidence record</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(snapshot,null,2)}</pre></details>
    </> : null}
  </main>;
}
