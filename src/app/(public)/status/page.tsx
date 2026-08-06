"use client";

import { useState } from "react";

/**
 * Customer Status Portal — a customer looks up a request they submitted (an
 * environmental order or a financing deal) with their reference id + the email
 * they used, and sees where it is. Minimum-disclosure: status only, via the
 * governed POST /api/service-requests/status. Customer surface (brief-copy
 * scanned).
 */

type StatusView = {
  found: boolean;
  serviceRequestId?: string;
  requestType?: "environmental_report_order" | "financing_deal_intake";
  routedTo?: string;
  status?: string;
  statusLabel?: string | null;
  submittedAt?: string | null;
  lenderNote?: string | null;
  timeline?: {
    docsDueAt: string | null;
    underwritingEtaAt: string | null;
    closingTargetAt: string | null;
    lenderBacklogNote: string | null;
  } | null;
  bookingUrl?: string | null;
  lenderDocuments?: Array<{
    fileName: string | null;
    receivedAt: string | null;
    downloadPath: string;
  }>;
};

function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

const INK = "#101a2b";
const MUTED = "#4d596d";

function friendlyStatus(s: StatusView): { headline: string; detail: string } {
  const who =
    s.requestType === "environmental_report_order"
      ? "the licensed PE"
      : "your broker";
  const status = (s.status ?? "").toUpperCase();
  if (status.includes("PENDING") || status.includes("SUBMITTED")) {
    return {
      headline: "Received — with your reviewer",
      detail: `Your request is recorded and routed to ${who} for review. You'll be contacted about next steps.`,
    };
  }
  if (status.includes("PROGRESS") || status.includes("REVIEW")) {
    return {
      headline: "In review",
      detail: `${who[0].toUpperCase()}${who.slice(1)} is working on your request.`,
    };
  }
  if (status.includes("FULFILL") || status.includes("COMPLETE") || status.includes("CLOSED")) {
    return { headline: "Complete", detail: "This request has been fulfilled." };
  }
  return {
    headline: "Received",
    detail: `Your request is with ${who}.`,
  };
}

export default function StatusPortalPage() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [result, setResult] = useState<StatusView | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    setState("loading");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/service-requests/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceRequestId: ref.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Lookup failed.");
      setResult(data.status as StatusView);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setState("idle");
    }
  }

  const field = {
    width: "100%",
    boxSizing: "border-box" as const,
    border: "1px solid #cfd8e6",
    borderRadius: 9,
    padding: "10px 12px",
    fontSize: 14,
    color: INK,
    background: "#fbfcfe",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "40px 20px 60px", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 560, margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 28, color: INK }}>Check your request status</h1>
          <p style={{ margin: 0, fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
            Enter the reference number from your confirmation and the email you used. We&apos;ll
            show you where your request is.
          </p>
        </header>

        <section style={{ border: "1px solid #d7deea", borderRadius: 14, background: "#fff", padding: 18, display: "grid", gap: 12 }}>
          <div>
            <label htmlFor="ref" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#3b475a", marginBottom: 5 }}>Reference number</label>
            <input id="ref" style={field} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. ENV-XXXXXXXXXXXX or FIN-XXXXXXXXXXXX" />
          </div>
          <div>
            <label htmlFor="email" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#3b475a", marginBottom: 5 }}>Email you used</label>
            <input id="email" type="email" style={field} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button
            type="button"
            onClick={lookup}
            disabled={state === "loading" || !ref.trim() || !email.trim()}
            style={{
              justifySelf: "start",
              border: "none",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              background: ref.trim() && email.trim() ? "#1c5aa0" : "#a9b6c8",
              cursor: ref.trim() && email.trim() && state !== "loading" ? "pointer" : "default",
            }}
          >
            {state === "loading" ? "Checking…" : "Check status"}
          </button>
          {error && <span style={{ fontSize: 13, color: "#b42318" }}>{error}</span>}
        </section>

        {result && (
          result.found ? (
            <section style={{ border: "1px solid #cfe0d5", borderRadius: 14, background: "#fff", padding: 18, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#127a4f" }}>
                  {result.serviceRequestId}
                </span>
                <strong style={{ fontSize: 18, color: INK }}>
                  {result.statusLabel ?? friendlyStatus(result).headline}
                </strong>
                {!result.statusLabel && (
                  <p style={{ margin: 0, fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>{friendlyStatus(result).detail}</p>
                )}
                {result.submittedAt && (
                  <span style={{ fontSize: 11.5, color: "#8090a0" }}>
                    Submitted {result.submittedAt.replace("T", " ").slice(0, 16)} UTC
                  </span>
                )}
              </div>

              {result.lenderNote && (
                <div style={{ borderTop: "1px solid #e6ecf3", paddingTop: 10, display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#3b475a" }}>
                    From your broker
                  </span>
                  <p style={{ margin: 0, fontSize: 13.5, color: INK, lineHeight: 1.6 }}>{result.lenderNote}</p>
                </div>
              )}

              {result.timeline && (
                <div style={{ borderTop: "1px solid #e6ecf3", paddingTop: 10, display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#3b475a" }}>
                    Where this is headed
                  </span>
                  {[
                    { label: "Documents due", value: shortDate(result.timeline.docsDueAt) },
                    { label: "Underwriting expected", value: shortDate(result.timeline.underwritingEtaAt) },
                    { label: "Closing target", value: shortDate(result.timeline.closingTargetAt) },
                  ]
                    .filter((row) => row.value)
                    .map((row) => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                        <span style={{ color: MUTED }}>{row.label}</span>
                        <strong style={{ color: INK }}>{row.value}</strong>
                      </div>
                    ))}
                  {result.timeline.lenderBacklogNote && (
                    <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>
                      {result.timeline.lenderBacklogNote}
                    </p>
                  )}
                  <span style={{ fontSize: 11.5, color: "#8090a0", lineHeight: 1.5 }}>
                    Dates are your broker&apos;s working estimates and move with real lender and
                    agency processing backlogs — never a promise of any outcome.
                  </span>
                </div>
              )}

              {result.lenderDocuments && result.lenderDocuments.length > 0 && (
                <div style={{ borderTop: "1px solid #e6ecf3", paddingTop: 10, display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#3b475a" }}>
                    Documents from your broker
                  </span>
                  {result.lenderDocuments.map((doc) => (
                    <div key={doc.downloadPath} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                      <span style={{ color: INK, overflowWrap: "anywhere" }}>
                        {doc.fileName ?? "Document"}
                        {shortDate(doc.receivedAt) && (
                          <span style={{ color: "#8090a0", fontSize: 11.5 }}> · {shortDate(doc.receivedAt)}</span>
                        )}
                      </span>
                      <a
                        href={doc.downloadPath}
                        style={{ flexShrink: 0, fontWeight: 750, color: "#1c5aa0", textDecoration: "none" }}
                      >
                        Download ↓
                      </a>
                    </div>
                  ))}
                  <span style={{ fontSize: 11.5, color: "#8090a0", lineHeight: 1.5 }}>
                    Download links are private to this lookup and expire after 2 hours — run the
                    status check again any time for fresh ones.
                  </span>
                </div>
              )}

              {result.bookingUrl && (
                <div style={{ borderTop: "1px solid #e6ecf3", paddingTop: 10, display: "grid", gap: 6 }}>
                  <a
                    href={result.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      justifySelf: "start",
                      border: "none",
                      borderRadius: 10,
                      padding: "9px 16px",
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "#fff",
                      background: "#1c5aa0",
                      textDecoration: "none",
                    }}
                  >
                    Schedule a call with your broker
                  </a>
                  <span style={{ fontSize: 11.5, color: "#8090a0" }}>
                    Booking a time gets you a focused call — faster than phone tag.
                  </span>
                </div>
              )}
            </section>
          ) : (
            <section style={{ border: "1px solid #e5c9c9", borderRadius: 14, background: "#fff", padding: 18 }}>
              <p style={{ margin: 0, fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>
                We couldn&apos;t find a request matching that reference and email. Double-check both
                against your confirmation, or reach out and we&apos;ll help.
              </p>
            </section>
          )
        )}
      </div>
    </main>
  );
}
