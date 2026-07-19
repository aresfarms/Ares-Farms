"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Fulfillment Queue (operator / licensed-professional surface)
 *
 * Closes the "governed intake → licensed professional fulfills" loop: the PE
 * works the environmental order queue; the licensed lender works the financing
 * deal queue. Reads the governed, role-gated /api/service-requests/admin. This
 * is an internal operator surface behind IAP + the API role gate — RESTRICTED
 * data, human-review posture.
 *
 * Master Volume Governance: Vol I (accountable authority), Vol II (Section 1071
 * firewall — no demographic data in the record; contact PII shown only to
 * authorized operators), Vol III-B (role-gated governed read), Vol V
 * (CANON-CLASS-001 RESTRICTED, HITL-GOV-001 human review).
 */

type ServiceRequest = {
  serviceRequestId: string;
  requestType: "environmental_report_order" | "financing_deal_intake";
  serviceCode: string | null;
  status: string;
  routedTo: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  propertyDescriptor: string | null;
  locationState: string | null;
  locationCounty: string | null;
  scopeSummary: string | null;
  estimatedValue: number | null;
  humanReviewRequired: boolean;
  occurredAt: string | null;
};

const shell = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  padding: "28px 20px 48px",
} as const;

const container = { maxWidth: 1180, margin: "0 auto", display: "grid", gap: 20 } as const;

const cardStyle = {
  border: "1px solid #d7deea",
  borderRadius: 12,
  background: "#ffffff",
  padding: "14px 16px",
  display: "grid",
  gap: 6,
} as const;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  // Display-only; deterministic slice avoids locale drift.
  return iso.replace("T", " ").slice(0, 16) + " UTC";
}

function RequestCard({ r, accent }: { r: ServiceRequest; accent: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 14, color: accent }}>{r.serviceRequestId}</strong>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#9a6b12", background: "#fdf3e7", borderRadius: 999, padding: "2px 8px" }}>
          {r.status.replaceAll("_", " ")}
        </span>
      </div>
      <span style={{ fontSize: 13.5, color: "#101a2b", fontWeight: 600 }}>
        {r.contactName ?? "—"} · {r.contactEmail ?? "—"}
        {r.contactPhone ? ` · ${r.contactPhone}` : ""}
      </span>
      <span style={{ fontSize: 12.5, color: "#4d596d" }}>
        {r.serviceCode ? `${r.serviceCode.replaceAll("_", " ")} · ` : ""}
        {r.propertyDescriptor ?? "—"}
        {r.locationState ? ` · ${[r.locationCounty, r.locationState].filter(Boolean).join(", ")}` : ""}
        {typeof r.estimatedValue === "number" ? ` · est. $${r.estimatedValue.toLocaleString()}` : ""}
      </span>
      {r.scopeSummary && (
        <span style={{ fontSize: 12.5, color: "#556", lineHeight: 1.5 }}>{r.scopeSummary}</span>
      )}
      <span style={{ fontSize: 11, color: "#8090a0" }}>Submitted {fmtDate(r.occurredAt)}</span>
    </div>
  );
}

export default function FulfillmentQueuePage() {
  const [role, setRole] = useState("operator");
  const [records, setRecords] = useState<ServiceRequest[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/service-requests/admin?role=${encodeURIComponent(role)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not load the queue.");
      setRecords(data.records ?? []);
      setState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the queue.");
      setState("error");
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  const environmental = useMemo(
    () => records.filter((r) => r.requestType === "environmental_report_order"),
    [records]
  );
  const financing = useMemo(
    () => records.filter((r) => r.requestType === "financing_deal_intake"),
    [records]
  );

  return (
    <main style={shell}>
      <div style={container}>
        <header style={{ display: "grid", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 30, color: "#101a2b" }}>Fulfillment queue</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#4d596d", maxWidth: 720, lineHeight: 1.6 }}>
            Incoming licensed-service requests routed for human review. Environmental orders route to
            the PE; financing deals route to the licensed lender. RESTRICTED — for authorized operators only.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#3b475a" }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ border: "1px solid #cfd8e6", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}>
              <option value="operator">operator</option>
              <option value="admin">admin</option>
              <option value="governance">governance</option>
              <option value="auditor">auditor</option>
            </select>
            <button type="button" onClick={load} style={{ border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, color: "#fff", background: "#1c5aa0", cursor: "pointer" }}>
              {state === "loading" ? "Loading…" : "Refresh"}
            </button>
          </div>
          {state === "error" && <span style={{ fontSize: 13, color: "#b42318" }}>{error}</span>}
        </header>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#127a4f" }}>
            Environmental orders → PE ({environmental.length})
          </h2>
          {environmental.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#8090a0" }}>No environmental orders in the queue.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {environmental.map((r) => (
                <RequestCard key={r.serviceRequestId} r={r} accent="#127a4f" />
              ))}
            </div>
          )}
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#534AB7" }}>
            Financing deals → licensed lender ({financing.length})
          </h2>
          {financing.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#8090a0" }}>No financing deals in the queue.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {financing.map((r) => (
                <RequestCard key={r.serviceRequestId} r={r} accent="#534AB7" />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
