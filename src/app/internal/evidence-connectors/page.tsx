import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { canApproveSourceLegal, operatorByEmail } from "@/lib/auth/operatorRegistry";
import { decideOfficialEvidenceConnector, listOfficialEvidenceConnectorReceipts, listOfficialEvidenceConnectorRegistrations } from "@/lib/property/officialEvidenceConnectorRegistry";
import type { OfficialEvidenceSourceId } from "@/lib/property/officialEvidenceSourceGovernance";

async function decide(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email)) throw new Error("Module 45 source/legal approval authority is required.");
  const operator = operatorByEmail(email)!;
  const sourceId = String(formData.get("sourceId")) as OfficialEvidenceSourceId;
  const decision = String(formData.get("decision")) as "APPROVE" | "SUSPEND";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("A review reason is required.");
  decideOfficialEvidenceConnector({ sourceId, decision, reviewerId: operator.id, reviewerName: operator.name, reason });
  revalidatePath("/internal/evidence-connectors");
}

export default async function EvidenceConnectorReviewPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const mayApprove = canApproveSourceLegal(email);
  const registrations = listOfficialEvidenceConnectorRegistrations();
  const latest = [...registrations].reverse().filter((r, i, all) => all.findIndex(x => x.sourceId === r.sourceId) === i);
  const receipts = listOfficialEvidenceConnectorReceipts().slice(-20).reverse();
  return <main style={{maxWidth:1000,margin:"0 auto",padding:"28px 24px 80px",display:"grid",gap:18}}>
    <header><div style={{fontSize:12,fontWeight:800,color:"#9a3412"}}>INTERNAL · GOVERNED CONNECTOR REVIEW</div><h1>Official evidence connectors</h1><p>Connector versions remain non-executable until reviewed and approved. Suspension immediately removes execution authority without deleting history.</p></header>
    {latest.length===0 ? <section style={{padding:20,border:"1px solid #d7deea",borderRadius:12}}>No connector versions are registered.</section> : latest.map(r => <section key={r.sourceId} style={{padding:20,border:"1px solid #d7deea",borderRadius:12,display:"grid",gap:8}}>
      <strong>{r.sourceName} · {r.parserVersion}</strong><div>Status: <b>{r.status}</b></div><div>Authority: {r.officialAuthority}</div><div>Scope: {r.geographicScope.join(", ")}</div><div>Legal basis: {r.legalBasis}</div><div>Source: {r.sourceUrl}</div>
      {mayApprove && <form action={decide} style={{display:"grid",gap:8,maxWidth:650}}><input type="hidden" name="sourceId" value={r.sourceId}/><textarea name="reason" required placeholder="Review reason"/><div style={{display:"flex",gap:8}}><button name="decision" value="APPROVE">Approve</button><button name="decision" value="SUSPEND">Suspend</button></div></form>}
    </section>)}
    <section style={{padding:20,border:"1px solid #d7deea",borderRadius:12}}><h2>Recent approval receipts</h2>{receipts.map(x=><div key={x.receiptId} style={{padding:"8px 0",borderTop:"1px solid #e2e8f0"}}><b>{x.decision}</b> {x.connectorId} {x.parserVersion} · {x.actorName} · {x.decidedAt}<br/>{x.reason}</div>)}</section>
  </main>;
}
