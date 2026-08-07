"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ActionButton,
  EmptyState,
  ModuleHeader,
  StatusPill,
  SummaryGrid,
  formatDateTime,
  inputStyle,
  moduleContainerStyle,
  moduleShellStyle,
  panelStyle,
} from "@/app/internalModuleKit";

/**
 * Lender Deal Desk — the licensed lender's working console
 * (founder direction 2026-08-05).
 *
 * One screen answers "what does Stuart do from his end": every financing
 * deal, its documents (single-file audited downloads), status + a customer-
 * visible note, the closing timeline he adjusts for lender/USDA/SBA backlogs,
 * and one-click document reminders that chase customers so he doesn't.
 *
 * Master Volume Governance: Vol I accountable authority (role-gated API
 * behind IAP); Vol II minimum-disclosure customer communication; Vol IV
 * reminder + timeline runbooks; Vol V observability on every action.
 */

// Identity is session-derived server-side (proxy-verified headers + the
// operator registry) — the console claims NOTHING. Client-claimed role/actor
// params conflict with the session at the API perimeter (staging 2026-08-05).

interface Timeline {
  docsDueAt: string | null;
  underwritingEtaAt: string | null;
  closingTargetAt: string | null;
  lenderBacklogNote: string | null;
}

interface Deal {
  serviceRequestId: string;
  status: string;
  serviceCode: string | null;
  routedTo: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  mailingAddress: string | null;
  propertyDescriptor: string | null;
  locationState: string | null;
  locationCounty: string | null;
  scopeSummary: string | null;
  estimatedValue: number | null;
  submittedAt: string | null;
  deskState: {
    customerNote: string | null;
    timeline: Timeline;
    reminders: string[];
    updatedAt: string | null;
    updatedBy: string | null;
  };
  applicationId: string;
  documentCount: number;
}

interface DealDocument {
  id: string;
  documentType: string;
  fileName: string | null;
  mimeType: string | null;
  byteSize: number | null;
  status: string;
  reviewStatus: string;
  storageUri: string | null;
  receivedAt: string | null;
  signatureRequested: boolean;
  signed: boolean;
  testSigned: boolean;
  signedByTypedName: string | null;
  scanStatus: "pending" | "clean" | "infected" | "unavailable";
}

interface StatusOption {
  status: string;
  customerLabel: string;
}

interface DraftState {
  status: string;
  customerNote: string;
  docsDueAt: string;
  underwritingEtaAt: string;
  closingTargetAt: string;
  lenderBacklogNote: string;
}

const FAILURE_STATUSES = new Set([
  "DECLINED_BY_LENDER",
  "WITHDRAWN_BY_CUSTOMER",
  "CLOSED_NOT_COMPLETED",
]);

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function draftFrom(deal: Deal): DraftState {
  return {
    status: deal.status,
    customerNote: deal.deskState.customerNote ?? "",
    docsDueAt: toDateInput(deal.deskState.timeline.docsDueAt),
    underwritingEtaAt: toDateInput(deal.deskState.timeline.underwritingEtaAt),
    closingTargetAt: toDateInput(deal.deskState.timeline.closingTargetAt),
    lenderBacklogNote: deal.deskState.timeline.lenderBacklogNote ?? "",
  };
}

export default function LenderDeskPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [calendarSrc, setCalendarSrc] = useState<string | null>(null);
  const [emailReady, setEmailReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Record<string, DealDocument[]>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [sendStates, setSendStates] = useState<
    Record<string, { phase: "sending" | "sent" | "error"; note: string }>
  >({});
  const [sweepResult, setSweepResult] = useState<string | null>(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/lender/deal-desk?view=deals`);
      const json = await res.json();
      if (!res.ok || json.ok !== true) {
        setLoadError(typeof json.error === "string" ? json.error : "Load failed.");
      } else {
        setDeals(json.deals as Deal[]);
        setStatuses(json.statuses as StatusOption[]);
        setBookingUrl((json.bookingUrl as string | null) ?? null);
        setCalendarSrc((json.calendarEmbedSrc as string | null) ?? null);
        setEmailReady(json.emailConfigured === true);
        setDrafts((prev) => {
          const next = { ...prev };
          for (const deal of json.deals as Deal[]) {
            if (!next[deal.serviceRequestId]) next[deal.serviceRequestId] = draftFrom(deal);
          }
          return next;
        });
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeals();
    // Opportunistic reminder sweep: opening the desk nudges every deal
    // waiting on documents (3-day spacing + cap enforced server-side).
    void fetch("/api/lender/deal-desk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remind-all" }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && typeof json.sent === "number" && json.sent > 0) {
          setSweepResult(
            `Automatic sweep: ${json.sent} document reminder(s) just went out.`
          );
        }
      })
      .catch(() => undefined);
  }, [loadDeals]);

  const loadDocuments = useCallback(async (deal: Deal) => {
    const res = await fetch(
      `/api/lender/deal-desk?view=documents&applicationId=${encodeURIComponent(
        deal.applicationId
      )}`
    );
    const json = await res.json();
    if (res.ok && json.ok === true) {
      setDocuments((prev) => ({ ...prev, [deal.serviceRequestId]: json.documents }));
    }
  }, []);

  const toggleExpand = useCallback(
    (deal: Deal) => {
      const next = expanded === deal.serviceRequestId ? null : deal.serviceRequestId;
      setExpanded(next);
      if (next && !documents[deal.serviceRequestId]) void loadDocuments(deal);
    },
    [expanded, documents, loadDocuments]
  );

  const setMessage = useCallback((id: string, message: string) => {
    setMessages((prev) => ({ ...prev, [id]: message }));
  }, []);

  const saveDeal = useCallback(
    async (deal: Deal) => {
      const draft = drafts[deal.serviceRequestId];
      if (!draft) return;
      setBusy(deal.serviceRequestId);
      setMessage(deal.serviceRequestId, "");
      try {
        const res = await fetch("/api/lender/deal-desk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            serviceRequestId: deal.serviceRequestId,
            status: draft.status,
            customerNote: draft.customerNote,
            timeline: {
              docsDueAt: draft.docsDueAt ? new Date(`${draft.docsDueAt}T12:00:00Z`).toISOString() : "",
              underwritingEtaAt: draft.underwritingEtaAt
                ? new Date(`${draft.underwritingEtaAt}T12:00:00Z`).toISOString()
                : "",
              closingTargetAt: draft.closingTargetAt
                ? new Date(`${draft.closingTargetAt}T12:00:00Z`).toISOString()
                : "",
              lenderBacklogNote: draft.lenderBacklogNote,
            },
          }),
        });
        const json = await res.json();
        setMessage(
          deal.serviceRequestId,
          res.ok && json.ok === true
            ? "Saved — the customer's status page reflects this now."
            : typeof json.error === "string"
              ? json.error
              : "Save failed."
        );
        if (res.ok && json.ok === true) await loadDeals();
      } catch (error) {
        setMessage(
          deal.serviceRequestId,
          error instanceof Error ? error.message : "Save failed."
        );
      } finally {
        setBusy(null);
      }
    },
    [drafts, loadDeals, setMessage]
  );

  const remind = useCallback(
    async (deal: Deal, force: boolean) => {
      setBusy(deal.serviceRequestId);
      try {
        const res = await fetch("/api/lender/deal-desk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "remind",
            serviceRequestId: deal.serviceRequestId,
            force,
          }),
        });
        const json = await res.json();
        const reasonText: Record<string, string> = {
          sent: "Reminder sent with a fresh 72-hour secure upload link.",
          "too-soon": "Not sent — last reminder was under 3 days ago (use Force to override).",
          "reminder-cap-reached": "Not sent — 3-reminder cap reached (use Force to override).",
          "no-contact-email": "Not sent — this deal has no contact email on file.",
          "not-configured": "Not sent — email delivery is not configured in this environment.",
        };
        setMessage(
          deal.serviceRequestId,
          reasonText[json.reason as string] ?? `Reminder result: ${json.reason ?? "unknown"}`
        );
        if (json.sent) await loadDeals();
      } finally {
        setBusy(null);
      }
    },
    [loadDeals, setMessage]
  );

  const updateDraft = useCallback((id: string, patch: Partial<DraftState>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  // Signature vault: ask the customer to sign a document already sent to
  // them; ceremony happens on their status page (token-gated, TEST MODE
  // until counsel review).
  const requestSignature = useCallback(
    async (deal: Deal, doc: DealDocument) => {
      setBusy(deal.serviceRequestId);
      try {
        const res = await fetch("/api/lender/deal-desk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "request-signature",
            serviceRequestId: deal.serviceRequestId,
            documentId: doc.id,
          }),
        });
        const json = await res.json();
        setMessage(
          deal.serviceRequestId,
          res.ok && json.ok === true
            ? json.customerNotified
              ? `Signature requested on ${doc.fileName ?? "the document"} — the customer was emailed.`
              : `Signature requested on ${doc.fileName ?? "the document"} — it appears on their status page (notification email not sent).`
            : typeof json.error === "string"
              ? json.error
              : "Signature request failed."
        );
        if (res.ok && json.ok === true) await loadDocuments(deal);
      } catch (error) {
        setMessage(deal.serviceRequestId, error instanceof Error ? error.message : "Signature request failed.");
      } finally {
        setBusy(null);
      }
    },
    [loadDocuments, setMessage]
  );

  // Lender → customer document (approval letter, term sheet, disclosure):
  // begin → browser PUT to the vault → confirm (+ customer notification).
  const sendDocumentToCustomer = useCallback(
    async (deal: Deal, file: File) => {
      setBusy(deal.serviceRequestId);
      setSendStates((prev) => ({
        ...prev,
        [deal.serviceRequestId]: { phase: "sending", note: `Encrypting and transferring ${file.name}…` },
      }));
      try {
        const beginRes = await fetch("/api/lender/deal-desk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload-begin",
            serviceRequestId: deal.serviceRequestId,
            fileName: file.name,
            mimeType: file.type || null,
            byteSize: file.size,
          }),
        });
        const begin = await beginRes.json();
        if (!beginRes.ok || begin.ok !== true) throw new Error(begin.error ?? "Could not start the transfer.");
        let uploaded = false;
        if (begin.uploadUrl) {
          const put = await fetch(begin.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          if (!put.ok) throw new Error("The secure storage transfer failed — try again.");
          uploaded = true;
        }
        const confirmRes = await fetch("/api/lender/deal-desk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload-confirm",
            serviceRequestId: deal.serviceRequestId,
            fileName: file.name,
            mimeType: file.type || null,
            byteSize: file.size,
            storageUri: begin.storageUri,
            uploaded,
          }),
        });
        const confirm = await confirmRes.json();
        if (!confirmRes.ok || confirm.ok !== true) throw new Error(confirm.error ?? "The transfer could not be confirmed.");
        setSendStates((prev) => ({
          ...prev,
          [deal.serviceRequestId]: uploaded
            ? {
                phase: "sent",
                note: confirm.customerNotified
                  ? `✓ ${file.name} is in the vault for the customer — they were emailed to check their status page. It's listed in the register above; no need to send it again.`
                  : `✓ ${file.name} is in the vault for the customer — it appears on their status page. (Notification email not sent: email not configured.) It's listed in the register above; no need to send it again.`,
              }
            : {
                phase: "error",
                note: `${file.name} was recorded but NOT stored — secure storage is not active in this environment.`,
              },
        }));
        await loadDocuments(deal);
      } catch (error) {
        setSendStates((prev) => ({
          ...prev,
          [deal.serviceRequestId]: {
            phase: "error",
            note: error instanceof Error ? error.message : "Transfer failed.",
          },
        }));
      } finally {
        setBusy(null);
      }
    },
    [loadDocuments]
  );

  const active = deals.filter((d) => !FAILURE_STATUSES.has(d.status) && d.status !== "CLOSED_FUNDED");
  const awaitingDocs = deals.filter((d) => d.status === "DOCUMENTS_REQUESTED");
  const closedFunded = deals.filter((d) => d.status === "CLOSED_FUNDED");
  const failed = deals.filter((d) => FAILURE_STATUSES.has(d.status));

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="LD"
          title="Lender Deal Desk"
          subtitle="Every financing deal, its documents, the closing timeline, and the customer communication loop — in one governed console."
          badges={[
            "Broker Access Only",
            emailReady ? "Reminders Live" : "Reminders Pending Email Config",
            bookingUrl ? "Booking Link Active" : "Booking Link Not Set",
          ]}
          refreshing={loading}
          onRefresh={() => void loadDeals()}
        />

        <SummaryGrid
          items={[
            { label: "Active Deals", value: active.length, color: "#0f766e" },
            { label: "Awaiting Documents", value: awaitingDocs.length, color: "#9a3412" },
            { label: "Closed & Funded", value: closedFunded.length, color: "#2563eb" },
            { label: "Did Not Complete", value: failed.length, color: "#7c3aed" },
          ]}
        />

        {calendarSrc && (
          <section style={{ ...panelStyle, padding: 14, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
              <strong style={{ fontSize: 14 }}>Today&apos;s calls & schedule</strong>
              <span style={{ color: "#1f2937", fontSize: 13.5, lineHeight: 1.5 }}>
                Your Google Calendar — visible only to accounts that already have access to it.
                Customers book through your booking link, never by cold-calling.
              </span>
            </div>
            <iframe
              title="Lender calendar agenda"
              src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarSrc)}&mode=AGENDA&showTitle=0&showPrint=0&showTabs=0&showCalendars=0`}
              style={{ border: 0, width: "100%", height: 340, borderRadius: 8 }}
            />
          </section>
        )}

        {sweepResult ? (
          <div
            style={{
              ...panelStyle,
              padding: 12,
              background: "#f0fdf4",
              color: "#166534",
              fontWeight: 700,
            }}
          >
            {sweepResult}
          </div>
        ) : null}

        {loadError ? (
          <div style={{ ...panelStyle, padding: 12, color: "#b91c1c", fontWeight: 700 }}>
            {loadError}
          </div>
        ) : null}

        {!loading && deals.length === 0 && !loadError ? (
          <EmptyState>
            No financing deals yet. When a customer submits the financing intake,
            the deal appears here with its secure document channel already wired.
          </EmptyState>
        ) : null}

        {deals.map((deal) => {
          const draft = drafts[deal.serviceRequestId] ?? draftFrom(deal);
          const docs = documents[deal.serviceRequestId];
          const isOpen = expanded === deal.serviceRequestId;
          const isBusy = busy === deal.serviceRequestId;
          const message = messages[deal.serviceRequestId];
          const reminderCount = deal.deskState.reminders.length;

          return (
            <article
              key={deal.serviceRequestId}
              style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>
                    {deal.contactName ?? "Unnamed customer"} — {deal.serviceRequestId}
                  </h3>
                  <span style={{ color: "#596579", fontSize: 13 }}>
                    {[
                      deal.serviceCode?.toUpperCase().replace(/_/g, " "),
                      deal.propertyDescriptor,
                      [deal.locationCounty, deal.locationState].filter(Boolean).join(", "),
                      deal.estimatedValue ? `≈$${deal.estimatedValue.toLocaleString()}` : null,
                      deal.submittedAt ? `Submitted ${formatDateTime(deal.submittedAt)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span style={{ color: "#596579", fontSize: 13 }}>
                    {[deal.contactEmail, deal.contactPhone, deal.mailingAddress]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                  <StatusPill ok={!FAILURE_STATUSES.has(deal.status)}>
                    {deal.status.replace(/_/g, " ")}
                  </StatusPill>
                  <span style={{ color: "#64748b", fontSize: 12 }}>
                    {deal.documentCount} document(s) · {reminderCount}/3 reminders sent
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <ActionButton disabled={isBusy} onClick={() => toggleExpand(deal)}>
                  {isOpen ? "Hide Documents & Timeline" : "Open Documents & Timeline"}
                </ActionButton>
                <ActionButton disabled={isBusy || !emailReady} onClick={() => void remind(deal, false)}>
                  Send Document Reminder
                </ActionButton>
                {message ? (
                  <span style={{ color: "#334155", fontWeight: 700, alignSelf: "center" }}>
                    {message}
                  </span>
                ) : null}
              </div>

              {isOpen ? (
                <div style={{ display: "grid", gap: 16 }}>
                  <section style={{ display: "grid", gap: 8 }}>
                    <strong>Documents in the vault</strong>
                    {!docs ? (
                      <span style={{ color: "#596579", fontSize: 13 }}>Loading…</span>
                    ) : docs.length === 0 ? (
                      <span style={{ color: "#596579", fontSize: 13 }}>
                        Nothing uploaded yet. A reminder re-sends the secure upload link.
                      </span>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                          <thead>
                            <tr>
                              {["Type", "File", "Size", "Received", "Status", ""].map((h) => (
                                <th
                                  key={h}
                                  style={{
                                    textAlign: "left",
                                    padding: "6px 10px",
                                    borderBottom: "1px solid #cbd5e1",
                                    color: "#596579",
                                  }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {docs.map((doc) => (
                              <tr key={doc.id}>
                                <td style={{ padding: "6px 10px" }}>
                                  {doc.documentType.replace(/-/g, " ")}
                                </td>
                                <td style={{ padding: "6px 10px", overflowWrap: "anywhere" }}>
                                  {doc.fileName ?? "—"}
                                </td>
                                <td style={{ padding: "6px 10px" }}>{formatBytes(doc.byteSize)}</td>
                                <td style={{ padding: "6px 10px" }}>
                                  {doc.receivedAt ? formatDateTime(doc.receivedAt) : "—"}
                                </td>
                                <td style={{ padding: "6px 10px" }}>
                                  {doc.scanStatus === "infected" ? (
                                    <span style={{ color: "#b42318", fontWeight: 800 }}>⛔ QUARANTINED</span>
                                  ) : doc.scanStatus === "pending" || doc.scanStatus === "unavailable" ? (
                                    <span style={{ color: "#8F6E1F", fontWeight: 700 }}>Scanning…</span>
                                  ) : doc.signed ? (
                                    <span style={{ color: doc.testSigned ? "#8F6E1F" : "#166534", fontWeight: 800 }}>
                                      {doc.testSigned ? "TEST SIGNED" : "SIGNED"}{doc.signedByTypedName ? ` — ${doc.signedByTypedName}` : ""}
                                    </span>
                                  ) : doc.signatureRequested ? (
                                    <span style={{ color: "#9a3412", fontWeight: 700 }}>Awaiting signature</span>
                                  ) : (
                                    doc.status
                                  )}
                                </td>
                                <td style={{ padding: "6px 10px" }}>
                                  {doc.documentType === "lender-provided" && doc.storageUri && !doc.signed && !doc.signatureRequested && (
                                    <button
                                      type="button"
                                      disabled={busy === deal.serviceRequestId}
                                      onClick={() => void requestSignature(deal, doc)}
                                      style={{ border: "1px solid #1c5aa0", background: "#fff", color: "#1c5aa0", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 750, cursor: "pointer", marginRight: 10 }}
                                    >
                                      Request Signature
                                    </button>
                                  )}
                                  {doc.storageUri ? (
                                    <a
                                      href={`/api/lender/deal-desk?view=download&documentId=${encodeURIComponent(
                                        doc.id
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "#1f4f7a", fontWeight: 700 }}
                                    >
                                      Open
                                    </a>
                                  ) : (
                                    <span style={{ color: "#9a3412" }}>No stored bytes</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <span style={{ color: "#64748b", fontSize: 12 }}>
                      Every download is a single file streamed through the governed runtime and
                      recorded in the audit trail. There is no bulk export.
                    </span>
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "grid", gap: 6 }}>
                      <strong style={{ fontSize: 13.5 }}>Send a document to the customer</strong>
                      <span style={{ color: "#64748b", fontSize: 12 }}>
                        Approval letters, term sheets, disclosures — it goes into the encrypted
                        vault, appears on their status page for secure download, and they get a
                        notification email. Never send documents by email.
                      </span>
                      <input
                        type="file"
                        aria-label={`Send a document to the customer for ${deal.serviceRequestId}`}
                        disabled={busy === deal.serviceRequestId}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void sendDocumentToCustomer(deal, f);
                          e.target.value = "";
                        }}
                        style={{ fontSize: 13 }}
                      />
                      {sendStates[deal.serviceRequestId] && (
                        <span
                          role={sendStates[deal.serviceRequestId].phase === "error" ? "alert" : "status"}
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            lineHeight: 1.5,
                            borderRadius: 8,
                            padding: "8px 10px",
                            ...(sendStates[deal.serviceRequestId].phase === "sent"
                              ? { color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0" }
                              : sendStates[deal.serviceRequestId].phase === "sending"
                                ? { color: "#334155", background: "#f8fafc", border: "1px solid #e2e8f0" }
                                : { color: "#8F6E1F", background: "#FFF9E8", border: "1px solid #D7B85A" }),
                          }}
                        >
                          {sendStates[deal.serviceRequestId].note}
                        </span>
                      )}
                    </div>
                  </section>

                  <section style={{ display: "grid", gap: 10 }}>
                    <strong>Status, customer note & closing timeline</strong>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <label style={{ display: "grid", gap: 6, minWidth: 280 }}>
                        <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
                          Deal status
                        </span>
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            updateDraft(deal.serviceRequestId, { status: e.target.value })
                          }
                          style={inputStyle}
                        >
                          {statuses.map((s) => (
                            <option key={s.status} value={s.status}>
                              {s.status.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                        <span style={{ color: "#64748b", fontSize: 12 }}>
                          Customer sees: “
                          {statuses.find((s) => s.status === draft.status)?.customerLabel ??
                            draft.status}
                          ”
                        </span>
                      </label>
                      <label style={{ display: "grid", gap: 6, minWidth: 170 }}>
                        <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
                          Documents due
                        </span>
                        <input
                          type="date"
                          value={draft.docsDueAt}
                          onChange={(e) =>
                            updateDraft(deal.serviceRequestId, { docsDueAt: e.target.value })
                          }
                          style={inputStyle}
                        />
                      </label>
                      <label style={{ display: "grid", gap: 6, minWidth: 170 }}>
                        <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
                          Underwriting ETA
                        </span>
                        <input
                          type="date"
                          value={draft.underwritingEtaAt}
                          onChange={(e) =>
                            updateDraft(deal.serviceRequestId, {
                              underwritingEtaAt: e.target.value,
                            })
                          }
                          style={inputStyle}
                        />
                      </label>
                      <label style={{ display: "grid", gap: 6, minWidth: 170 }}>
                        <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
                          Closing target
                        </span>
                        <input
                          type="date"
                          value={draft.closingTargetAt}
                          onChange={(e) =>
                            updateDraft(deal.serviceRequestId, {
                              closingTargetAt: e.target.value,
                            })
                          }
                          style={inputStyle}
                        />
                      </label>
                    </div>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
                        Backlog note (why dates moved — USDA/SBA/lender backlog; shown to the
                        customer with the timeline)
                      </span>
                      <input
                        type="text"
                        value={draft.lenderBacklogNote}
                        onChange={(e) =>
                          updateDraft(deal.serviceRequestId, {
                            lenderBacklogNote: e.target.value,
                          })
                        }
                        style={inputStyle}
                        placeholder="e.g. USDA state office is running ~3 weeks behind on B&I guarantees"
                      />
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
                        Note to the customer (appears on their status page and in reminder
                        emails — keep it minimum-disclosure: what you need, never figures)
                      </span>
                      <textarea
                        value={draft.customerNote}
                        onChange={(e) =>
                          updateDraft(deal.serviceRequestId, { customerNote: e.target.value })
                        }
                        rows={3}
                        style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                        placeholder="e.g. Still need your 2024–2025 business tax returns and the executed purchase agreement."
                      />
                    </label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <ActionButton disabled={isBusy} onClick={() => void saveDeal(deal)}>
                        {isBusy ? "Saving…" : "Save Status, Note & Timeline"}
                      </ActionButton>
                      <ActionButton
                        disabled={isBusy || !emailReady}
                        onClick={() => void remind(deal, true)}
                      >
                        Force Reminder Now
                      </ActionButton>
                    </div>
                  </section>
                </div>
              ) : null}
            </article>
          );
        })}

        <aside style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
          <strong>How this desk works</strong>
          <span style={{ color: "#334155", fontSize: 13, lineHeight: 1.5 }}>
            Deals in “Documents requested” get automatic reminder emails — a fresh 72-hour
            secure upload link each time, at most one every 3 days, capped at 3 (Force
            overrides both). Your status, note, and timeline save straight to the
            customer&apos;s status page. {bookingUrl
              ? "Your booking link is included in every customer touchpoint so calls land on your calendar, not your cell."
              : "Set LENDER_BOOKING_URL to include your scheduling link in every customer touchpoint."}
          </span>
        </aside>
      </div>
    </main>
  );
}
