"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Room = { roomId: string; serviceRequestId: string; roomStatus: string; submissionCaseId: string | null; status: string | null; program: string | null; estimatedAmount: number | null; locationState: string | null; locationCounty: string | null; propertyDescriptor: string | null; scopeSummary: string | null; consentedAt: string | null };

export default function CapitalProviderWorkspacePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("Loading your assigned deal rooms…");

  useEffect(() => { void (async () => {
    try {
      const res = await fetch("/api/capital-network/deal-room");
      const data = await res.json();
      if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Deal rooms unavailable.");
      setProvider(data.provider ?? null);
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Deal rooms unavailable."); }
  })(); }, []);

  return <main style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", padding: "36px 20px 64px" }}><div style={{ maxWidth: 1050, margin: "0 auto", display: "grid", gap: 18 }}>
    <header style={{ display: "grid", gap: 6 }}><span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Furlong Capital Network</span><h1 style={{ margin: 0, color: "#fff", fontSize: 32 }}>Provider deal rooms</h1><p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.6 }}>{provider ? String(provider.organizationName) : "Verified provider workspace"}. Only borrower-selected, exact-package-consented assignments appear here.</p></header>
    {message && <div style={{ border: "1px solid #334155", borderRadius: 12, padding: 14, color: "#cbd5e1" }}>{message}</div>}
    {!message && rooms.length === 0 && <div style={{ border: "1px solid #334155", borderRadius: 12, padding: 16, background: "#111827" }}><strong>No active assignments.</strong><p style={{ color: "#94a3b8", marginBottom: 0 }}>Provider registration alone never exposes borrower cases.</p></div>}
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>{rooms.map((room) => <article key={room.roomId} style={{ border: "1px solid #334155", borderRadius: 13, padding: 15, background: "#111827", display: "grid", gap: 7 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ color: "#fff" }}>{room.serviceRequestId}</strong><span style={{ color: "#86efac", fontSize: 11.5, fontWeight: 800 }}>{room.roomStatus}</span></div><span style={{ color: "#cbd5e1", fontSize: 13 }}>{room.program ?? "Program open"} · {[room.locationCounty, room.locationState].filter(Boolean).join(", ") || "Location held in case"}</span><span style={{ color: "#94a3b8", fontSize: 12.5 }}>{room.propertyDescriptor ?? room.scopeSummary ?? "Governed financing case"}</span>{room.estimatedAmount != null && <span style={{ color: "#cbd5e1", fontSize: 12.5 }}>Approximate deal context: ${room.estimatedAmount.toLocaleString()}</span>}<span style={{ color: "#64748b", fontSize: 11.5 }}>Package consent activated {room.consentedAt ? new Date(room.consentedAt).toLocaleString() : "before access"}.</span></article>)}</section>
    <div style={{ display: "grid", gap: 8 }}><span style={{ color: "#94a3b8", fontSize: 12.5, lineHeight: 1.55 }}>Exact package building, borrower consent, recipient verification, and delivery authorization remain controlled by the Furlong Capital Desk. This workspace never broadens your access beyond the deal rooms shown above.</span>{provider?.providerRole === "BROKER" && <Link href="/lender-desk" style={{ justifySelf: "start", color: "#e2e8f0", border: "1px solid #475569", padding: "9px 13px", borderRadius: 9, fontWeight: 800, textDecoration: "none" }}>Open your Broker Deal Desk</Link>}</div>
  </div></main>;
}
