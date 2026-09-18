"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Room = {
  roomId: string;
  serviceRequestId: string;
  roomStatus: string;
  submissionCaseId: string | null;
  program: string | null;
  estimatedAmount: number | null;
  locationState: string | null;
  locationCounty: string | null;
  propertyDescriptor: string | null;
  scopeSummary: string | null;
  consentedAt: string | null;
  caseRoomExpiresAt: string | null;
  providerResponseStatus: string | null;
  providerResponseSummary: string | null;
};

const RESPONSES = [
  ["ACCEPT_FOR_REVIEW", "Accept for review"],
  ["MISSING_INFORMATION", "Missing information"],
  ["OUTSIDE_CREDIT_BOX", "Outside credit box"],
  ["CONDITIONAL_PATH", "Conditional path"],
  ["DECLINE", "Decline"],
] as const;
export default function CapitalProviderWorkspacePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("Loading your assigned deal rooms…");
  const [inputs, setInputs] = useState<Record<string, { status: string; detail: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/capital-network/deal-room");
    const data = await res.json();
    if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Deal rooms unavailable.");
    setProvider(data.provider ?? null);
    setRooms(Array.isArray(data.rooms) ? data.rooms : []);
    setMessage("");
  }

  useEffect(() => {
    void load().catch((error) => setMessage(error instanceof Error ? error.message : "Deal rooms unavailable."));
  }, []);

  function input(roomId: string) {
    return inputs[roomId] ?? { status: "ACCEPT_FOR_REVIEW", detail: "" };
  }

  async function respond(room: Room) {
    const value = input(room.roomId);
    setBusy(room.roomId);
    setMessage("");
    const detailItems = value.detail.split("\n").map((item) => item.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/capital-network/provider-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceRequestId: room.serviceRequestId,
          status: value.status,
          summary: value.detail,
          missingItems: value.status === "MISSING_INFORMATION" ? detailItems : [],
          conditions: value.status === "CONDITIONAL_PATH" ? detailItems : [],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Response could not be recorded.");
      setMessage(`${room.serviceRequestId}: ${data.response.label} recorded.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Response could not be recorded.");
    } finally {
      setBusy(null);
    }
  }

  const card = { border: "1px solid #334155", borderRadius: 13, padding: 15, background: "#111827", display: "grid", gap: 8 } as const;

  return <main style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", padding: "36px 20px 64px" }}><div style={{ maxWidth: 1050, margin: "0 auto", display: "grid", gap: 18 }}>
    <header style={{ display: "grid", gap: 6 }}><span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Furlong Capital Network</span><h1 style={{ margin: 0, color: "#fff", fontSize: 32 }}>Provider case rooms</h1><p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.6 }}>{provider ? String(provider.organizationName) : "Verified provider workspace"}. Respond here without replacing your existing loan-origination system.</p></header>
    {message && <div role="status" style={{ ...card, color: "#cbd5e1" }}>{message}</div>}
    {!message && rooms.length === 0 && <div style={card}><strong>No active assignments.</strong><span style={{ color: "#94a3b8" }}>Provider registration alone never exposes borrower cases.</span></div>}
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>{rooms.map((room) => {
      const value = input(room.roomId);
      return <article key={room.roomId} style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ color: "#fff" }}>{room.serviceRequestId}</strong><span style={{ color: "#86efac", fontSize: 11.5, fontWeight: 800 }}>{room.providerResponseStatus ?? room.roomStatus}</span></div>
        <span style={{ color: "#cbd5e1", fontSize: 13 }}>{room.program ?? "Program open"} · {[room.locationCounty, room.locationState].filter(Boolean).join(", ") || "Location held in case"}</span>
        <span style={{ color: "#94a3b8", fontSize: 12.5 }}>{room.propertyDescriptor ?? room.scopeSummary ?? "Governed financing case"}</span>
        {room.estimatedAmount != null && <span style={{ color: "#cbd5e1", fontSize: 12.5 }}>Approximate deal context: ${room.estimatedAmount.toLocaleString()}</span>}
        <span style={{ color: "#64748b", fontSize: 11.5 }}>Access expires {room.caseRoomExpiresAt ? new Date(room.caseRoomExpiresAt).toLocaleString() : "under the case-room policy"}.</span>
        <select value={value.status} onChange={(event) => setInputs((current) => ({ ...current, [room.roomId]: { ...value, status: event.target.value } }))} style={{ borderRadius: 8, padding: "8px 9px", background: "#0f172a", color: "#e2e8f0", border: "1px solid #475569" }}>{RESPONSES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
        <textarea value={value.detail} onChange={(event) => setInputs((current) => ({ ...current, [room.roomId]: { ...value, detail: event.target.value } }))} placeholder={value.status === "MISSING_INFORMATION" ? "One missing item per line" : value.status === "CONDITIONAL_PATH" ? "One condition per line" : "Reason or review note"} rows={3} style={{ borderRadius: 8, padding: 9, background: "#0f172a", color: "#e2e8f0", border: "1px solid #475569", resize: "vertical" }} />
        <button type="button" disabled={busy !== null || ((value.status === "MISSING_INFORMATION" || value.status === "CONDITIONAL_PATH" || value.status === "DECLINE" || value.status === "OUTSIDE_CREDIT_BOX") && !value.detail.trim())} onClick={() => void respond(room)} style={{ border: 0, borderRadius: 8, padding: "8px 11px", background: "#7c3aed", color: "#fff", fontWeight: 800 }}>{busy === room.roomId ? "Recording…" : "Return structured response"}</button>
        {room.providerResponseSummary && <span style={{ color: "#94a3b8", fontSize: 11.5 }}>Latest note: {room.providerResponseSummary}</span>}
      </article>;
    })}</section>
    <div style={{ display: "grid", gap: 8 }}><span style={{ color: "#94a3b8", fontSize: 12.5, lineHeight: 1.55 }}>Each room is limited to the customer-authorized package and expires independently. Do not redistribute case material. Continue underwriting in your own system; return status and conditions here so the customer has one closing record.</span>{provider?.providerRole === "BROKER" && <Link href="/lender-desk" style={{ justifySelf: "start", color: "#e2e8f0", border: "1px solid #475569", padding: "9px 13px", borderRadius: 9, fontWeight: 800, textDecoration: "none" }}>Open your Broker Deal Desk</Link>}</div>
  </div></main>;
}
