"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { LENDER_NETWORK_CANDIDATES } from "@/lib/financing/lenderNetworkRegistry";

type ProviderRow = {
  providerId: string;
  organizationName: string;
  providerRole: string;
  providerType: string;
  status: string;
  affiliation: string;
  states: string[];
  programs: string[];
  credentialStatus: string;
  connectorStatus: string;
  participationTermsStatus: string;
  dataAgreementStatus: string;
  compensationStatus: string;
  matchingEnabled: boolean;
  liveRoutingAllowed: boolean;
  profileVersion: number;
};

type DealRoomRow = {
  roomId: string;
  serviceRequestId: string;
  providerId: string;
  providerName: string;
  providerRole: string | null;
  roomStatus: string;
  submissionCaseId: string | null;
  providerAccessAllowed: boolean;
  dataShared: boolean;
  program: string | null;
  estimatedAmount: number | null;
  locationState: string | null;
  locationCounty: string | null;
  executionOutcome: string | null;
  executionVerificationStatus: string | null;
  executionVerifiedAt: string | null;
};

function blockers(provider: ProviderRow): string[] {
  const out: string[] = [];
  if (provider.credentialStatus !== "VERIFIED") out.push("credential");
  if (provider.connectorStatus !== "CERTIFIED") out.push("connector");
  if (provider.participationTermsStatus !== "EXECUTED") out.push("participation terms");
  if (provider.dataAgreementStatus !== "EXECUTED") out.push("data agreement");
  if (provider.compensationStatus !== "APPROVED") out.push("compensation/conflict review");
  if (!Array.isArray(provider.states) || provider.states.length === 0) out.push("geography");
  if (!Array.isArray(provider.programs) || provider.programs.length === 0) out.push("program appetite");
  return out;
}

export default function CapitalNetworkConsolePage() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [rooms, setRooms] = useState<DealRoomRow[]>([]);
  const [serviceRequestId, setServiceRequestId] = useState("");
  const [matchResult, setMatchResult] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [executionInputs, setExecutionInputs] = useState<Record<string, { outcome: string; evidenceRef: string }>>({});

  async function loadProviders() {
    const res = await fetch("/api/capital-network/providers");
    const data = await res.json();
    if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Capital Network providers unavailable.");
    setProviders(Array.isArray(data.providers) ? data.providers : []);
  }

  async function loadRooms() {
    const res = await fetch("/api/capital-network/deal-room?all=1");
    const data = await res.json();
    if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Capital Network deal rooms unavailable.");
    setRooms(Array.isArray(data.rooms) ? data.rooms : []);
  }

  useEffect(() => {
    void Promise.all([loadProviders(), loadRooms()]).catch((error) =>
      setMessage(error instanceof Error ? error.message : "Capital Network console unavailable."),
    );
  }, []);

  async function providerAction(providerId: string, action: string) {
    setBusy(`${providerId}:${action}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/capital-network/providers/${encodeURIComponent(providerId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Provider review failed.");
      setMessage(`${providerId}: ${action} recorded.`);
      await loadProviders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Provider review failed.");
    } finally {
      setBusy(null);
    }
  }

  async function createSubmissionCase(room: DealRoomRow) {
    setBusy(`submission:${room.roomId}`);
    setMessage(null);
    try {
      const res = await fetch("/api/capital-network/deal-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-submission-case",
          serviceRequestId: room.serviceRequestId,
          providerId: room.providerId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Submission case creation failed.");
      setMessage(
        `${room.serviceRequestId} → ${room.providerName}: governed submission case ${data.submissionCaseId}${data.alreadyExists ? " already existed" : " created"}. The package still requires review, exact borrower consent, and recipient verification.`,
      );
      await loadRooms();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission case creation failed.");
    } finally {
      setBusy(null);
    }
  }

  function executionInput(roomId: string) {
    return executionInputs[roomId] ?? { outcome: "CLOSED_FUNDED", evidenceRef: "" };
  }

  async function recordExecutionOutcome(room: DealRoomRow) {
    const input = executionInput(room.roomId);
    setBusy(`outcome:${room.roomId}`);
    setMessage(null);
    try {
      const res = await fetch("/api/capital-network/deal-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record-execution-outcome",
          serviceRequestId: room.serviceRequestId,
          providerId: room.providerId,
          outcome: input.outcome,
          evidenceRefs: input.evidenceRef.split(",").map((value) => value.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Execution outcome recording failed.");
      setMessage(`${room.serviceRequestId} → ${room.providerName}: verified execution outcome ${input.outcome} recorded. Reliability history uses evidence-backed outcomes only.`);
      await loadRooms();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Execution outcome recording failed.");
    } finally {
      setBusy(null);
    }
  }

  async function recompute() {
    setBusy("match");
    setMessage(null);
    try {
      const res = await fetch("/api/capital-network/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recompute", serviceRequestId }),
      });
      const data = await res.json();
      if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Matching failed.");
      setMatchResult(Array.isArray(data.matches) ? data.matches : []);
      setMessage(`Computed ${Array.isArray(data.matches) ? data.matches.length : 0} provider matches. No case was delivered.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Matching failed.");
    } finally {
      setBusy(null);
    }
  }

  const card = { border: "1px solid #d7deea", borderRadius: 13, background: "#fff", padding: 15, display: "grid", gap: 8 } as const;
  return <main style={{ minHeight: "100vh", background: "#f5f7fb", padding: "34px 20px 64px" }}><div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
    <header style={{ display: "grid", gap: 6 }}><span style={{ color: "#534AB7", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Owner-controlled financing infrastructure</span><h1 style={{ margin: 0, color: "#101a2b", fontSize: 34 }}>Furlong Capital Network</h1><p style={{ margin: 0, maxWidth: 900, color: "#475569", lineHeight: 1.65 }}>One borrower case can work with many independently governed brokers and funding institutions. Providers declare their appetite; Furlong verifies them; matching remains lender-neutral; the borrower chooses; no provider sees the file until exact package consent and recipient verification.</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link href="/capital-network/onboarding" style={{ color: "#fff", background: "#534AB7", borderRadius: 9, padding: "8px 12px", fontWeight: 800, textDecoration: "none" }}>Provider onboarding</Link><Link href="/lender-submissions" style={{ color: "#334155", border: "1px solid #cbd5e1", borderRadius: 9, padding: "8px 12px", fontWeight: 800, textDecoration: "none" }}>Submission governance</Link></div></header>

    <section style={{ ...card, background: "#111827", color: "#e5e7eb", borderColor: "#334155" }}><strong style={{ color: "#fff" }}>Current fail-closed posture</strong><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8, fontSize: 12.5 }}><span>Provider application ≠ activation</span><span>Match ≠ approval</span><span>Selection ≠ data sharing</span><span>Consent ≠ credit commitment</span><span>Affiliated lender gets no scoring preference</span><span>Production delivery remains separately gated</span></div></section>

    <section style={{ display: "grid", gap: 10 }}><div><h2 style={{ margin: 0, color: "#101a2b", fontSize: 21 }}>Provider registry</h2><p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 13 }}>These are actual Capital Network provider profiles, not the outreach candidate list.</p></div>{providers.length === 0 ? <div style={card}>No provider profiles yet.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 10 }}>{providers.map((provider) => { const blocked = blockers(provider); return <article key={provider.providerId} style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ color: "#101a2b" }}>{provider.organizationName}</strong><span style={{ color: provider.status === "CERTIFIED_ACTIVE" ? "#166534" : "#92400e", fontSize: 11.5, fontWeight: 800 }}>{provider.status}</span></div><span style={{ color: "#64748b", fontSize: 12 }}>{provider.providerRole} · {provider.providerType} · {provider.affiliation} · profile v{provider.profileVersion}</span><span style={{ color: "#475569", fontSize: 12.5 }}>{provider.states?.join(", ") || "No geography yet"} · {provider.programs?.join(", ") || "No programs yet"}</span><div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5 }}>Credential {provider.credentialStatus} · Connector {provider.connectorStatus} · Terms {provider.participationTermsStatus} · DPA {provider.dataAgreementStatus} · Comp/conflict {provider.compensationStatus}</div><div style={{ fontSize: 12, color: blocked.length ? "#92400e" : "#166534" }}>{blocked.length ? `Activation blockers: ${blocked.join(", ")}` : "All profile activation gates present."}</div><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><button disabled={busy !== null} onClick={() => void providerAction(provider.providerId, "START_DUE_DILIGENCE")} style={{ border: 0, borderRadius: 8, padding: "7px 9px", fontWeight: 750 }}>Start diligence</button><button disabled={busy !== null} onClick={() => void providerAction(provider.providerId, "CERTIFY")} style={{ border: 0, borderRadius: 8, padding: "7px 9px", fontWeight: 750, background: "#dcfce7", color: "#166534" }}>Certify if gates pass</button><button disabled={busy !== null} onClick={() => void providerAction(provider.providerId, "SUSPEND")} style={{ border: 0, borderRadius: 8, padding: "7px 9px", fontWeight: 750, background: "#fee2e2", color: "#991b1b" }}>Suspend</button></div><span style={{ fontSize: 11.5, color: "#64748b" }}>Matching {provider.matchingEnabled ? "ON" : "OFF"} · live routing entitlement {provider.liveRoutingAllowed ? "ON" : "OFF"}</span></article>; })}</div>}</section>

    <section style={{ display: "grid", gap: 10 }}>
      <div><h2 style={{ margin: 0, color: "#101a2b", fontSize: 21 }}>Borrower-selected deal rooms</h2><p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 13 }}>Selection is visible to the Capital Desk immediately, but the provider remains locked out until exact package consent.</p></div>
      {rooms.length === 0 ? <div style={card}>No borrower-selected Capital Network deal rooms yet.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 10 }}>{rooms.map((room) => <article key={room.roomId} style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ color: "#101a2b" }}>{room.serviceRequestId}</strong><span style={{ color: room.providerAccessAllowed ? "#166534" : "#92400e", fontSize: 11.5, fontWeight: 800 }}>{room.roomStatus}</span></div><span style={{ color: "#475569", fontSize: 13 }}>{room.providerName} · {room.providerRole ?? "provider"}</span><span style={{ color: "#64748b", fontSize: 12 }}>{room.program ?? "program open"} · {[room.locationCounty, room.locationState].filter(Boolean).join(", ") || "location in case"}{room.estimatedAmount != null ? ` · $${room.estimatedAmount.toLocaleString()}` : ""}</span><span style={{ color: "#64748b", fontSize: 11.5 }}>Provider access {room.providerAccessAllowed ? "ACTIVE after consent" : "LOCKED"} · scoped data {room.dataShared ? "authorized" : "not shared"}</span>{room.submissionCaseId ? <span style={{ color: "#166534", fontSize: 12.5, fontWeight: 750 }}>Submission case: {room.submissionCaseId}</span> : <button disabled={busy !== null} onClick={() => void createSubmissionCase(room)} style={{ justifySelf: "start", border: 0, borderRadius: 8, padding: "7px 10px", background: "#ede9fe", color: "#4c1d95", fontWeight: 800 }}>{busy === `submission:${room.roomId}` ? "Creating…" : "Create governed submission case"}</button>}
        {room.executionVerificationStatus === "VERIFIED" ? <span style={{ color: "#166534", fontSize: 12, fontWeight: 750 }}>Verified execution outcome: {room.executionOutcome}</span> : <div style={{ display: "grid", gap: 6, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}><strong style={{ fontSize: 11.5, color: "#334155" }}>Record evidence-backed execution outcome</strong><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><select value={executionInput(room.roomId).outcome} onChange={(event) => setExecutionInputs((current) => ({ ...current, [room.roomId]: { ...executionInput(room.roomId), outcome: event.target.value } }))} style={{ border: "1px solid #cbd5e1", borderRadius: 7, padding: "6px 8px", fontSize: 11.5 }}><option value="CLOSED_FUNDED">Closed / funded</option><option value="PROVIDER_DECLINED">Provider declined</option><option value="PROVIDER_WITHDREW">Provider withdrew</option><option value="PROVIDER_NO_RESPONSE">Provider no response</option><option value="BORROWER_WITHDREW">Borrower withdrew</option><option value="PROPERTY_OR_PROGRAM_BLOCKED">Property/program blocked</option><option value="THIRD_PARTY_OR_EXTERNAL_BLOCKED">Third-party/external blocked</option><option value="CANCELED">Canceled</option></select><input value={executionInput(room.roomId).evidenceRef} onChange={(event) => setExecutionInputs((current) => ({ ...current, [room.roomId]: { ...executionInput(room.roomId), evidenceRef: event.target.value } }))} placeholder="Evidence ref(s), comma-separated" style={{ flex: "1 1 190px", border: "1px solid #cbd5e1", borderRadius: 7, padding: "6px 8px", fontSize: 11.5 }} /><button disabled={busy !== null || !executionInput(room.roomId).evidenceRef.trim()} onClick={() => void recordExecutionOutcome(room)} style={{ border: 0, borderRadius: 7, padding: "6px 9px", background: "#e7f6ee", color: "#166534", fontWeight: 800, fontSize: 11.5 }}>{busy === `outcome:${room.roomId}` ? "Recording…" : "Record verified outcome"}</button></div><span style={{ fontSize: 10.5, color: "#64748b" }}>Outcome history affects no provider until sample thresholds are met; borrower/external exits are separated from provider performance.</span></div>}
      </article>)}</div>}
    </section>

    <section style={{ ...card, background: "#fafafa" }}><h2 style={{ margin: 0, fontSize: 20, color: "#101a2b" }}>Discovery / outreach candidates</h2><p style={{ margin: 0, color: "#64748b", fontSize: 12.5 }}>Research candidates remain separate from the provider registry. They cannot receive borrower information until they complete onboarding and certification.</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 8 }}>{LENDER_NETWORK_CANDIDATES.map((candidate) => <div key={candidate.id} style={{ border: "1px solid #e2e8f0", borderRadius: 9, padding: 10, background: "#fff" }}><strong style={{ color: "#101a2b", fontSize: 13 }}>{candidate.name}</strong><div style={{ color: "#64748b", fontSize: 11.5, marginTop: 4 }}>{candidate.kind} · {candidate.status}</div><div style={{ color: "#475569", fontSize: 11.5, marginTop: 3 }}>{candidate.states.join(", ")} · {candidate.programs.join(", ")}</div></div>)}</div></section>

    <section style={card}><h2 style={{ margin: 0, fontSize: 20, color: "#101a2b" }}>Recompute a case match</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><input value={serviceRequestId} onChange={(e) => setServiceRequestId(e.target.value)} placeholder="FIN-XXXXXXXXXXXX" style={{ flex: "1 1 260px", border: "1px solid #cbd5e1", borderRadius: 9, padding: "9px 11px" }} /><button disabled={!serviceRequestId.trim() || busy !== null} onClick={() => void recompute()} style={{ border: 0, borderRadius: 9, padding: "9px 13px", background: "#534AB7", color: "#fff", fontWeight: 800 }}>{busy === "match" ? "Matching…" : "Run lender-neutral match"}</button></div>{matchResult.length > 0 && <div style={{ display: "grid", gap: 6 }}>{matchResult.map((match) => <div key={String(match.providerId)} style={{ fontSize: 12.5, color: "#475569" }}><strong>{String(match.providerId)}</strong> · score {String(match.score)} · eligible {String(match.eligible)} · {Array.isArray(match.reasons) ? match.reasons.join("; ") : ""}{Array.isArray(match.blockers) && match.blockers.length ? ` · blocked: ${match.blockers.join("; ")}` : ""}</div>)}</div>}</section>
    {message && <p role="status" style={{ margin: 0, color: "#475569", fontSize: 13 }}>{message}</p>}
  </div></main>;
}
