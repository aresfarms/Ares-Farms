import { readOfficialEvidenceQuarantine } from "@/lib/property/officialEvidenceQuarantineStore";

export default function EvidenceQuarantinePage() {
  const records = readOfficialEvidenceQuarantine().slice().reverse();
  return <main style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px 80px",display:"grid",gap:18}}>
    <header><div style={{fontSize:12,fontWeight:800,color:"#9a3412",textTransform:"uppercase"}}>Internal · governed diagnostics</div><h1>Evidence provenance quarantine</h1><p>Snapshots rejected at read time remain preserved for audit but are withheld from property reports.</p></header>
    {records.length===0 ? <section style={{padding:20,border:"1px solid #d7deea",borderRadius:12}}>No quarantined evidence.</section> : records.map((r)=><section key={r.quarantineId} style={{padding:20,border:"1px solid #f59e0b",borderRadius:12,display:"grid",gap:8}}>
      <strong>{r.sourceId} · {r.sourceVersion}</strong><span>Detected {r.detectedAt} · status {r.status}</span><span>Connector {r.connectorId ?? "unknown"} · parser {r.parserVersion ?? "unknown"}</span><code style={{overflowWrap:"anywhere"}}>Implementation {r.implementationHash ?? "unknown"}</code><div><strong>Failure reasons:</strong> {r.reasons.join(", ")}</div><div>Refresh receipt: {r.receiptId ?? "missing"}</div>
    </section>)}
  </main>;
}
