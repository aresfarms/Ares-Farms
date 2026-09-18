"use client";

import { useCallback, useEffect, useState } from "react";

type OrderOperations = {
  customerRefundPresent: boolean;
  refundProviderStatus: string | null;
  refundFailure: string | null;
  holdReason: string | null;
};

type ReportArtifact = {
  artifactId: string;
  status: string;
  fileName: string;
  byteSize: number;
  expectedSha256: string;
  verifiedSha256: string | null;
  verifiedAt: string | null;
};

type PublicOrder = {
  id: string;
  productCode: string;
  targetType: string;
  targetRef: string;
  fulfillmentMode: string;
  status: string;
  amountTotalCents: number;
  currency: string;
  paidAt: string | null;
  fulfillmentStartedAt: string | null;
  fulfilledAt: string | null;
  updatedAt: string;
  reportArtifact: ReportArtifact | null;
  operations: OrderOperations;
};

type Draft = {
  reason: string;
  evidence: string;
};
const EMPTY_DRAFT: Draft = {
  reason: "",
  evidence: "",
};

const panel = {
  padding: 18,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#ffffff",
} as const;

const input = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 42,
  padding: "9px 11px",
  border: "1px solid #94a3b8",
  borderRadius: 7,
  font: "inherit",
} as const;

const button = {
  minHeight: 42,
  padding: "9px 14px",
  border: 0,
  borderRadius: 7,
  background: "#0f766e",
  color: "#ffffff",
  fontWeight: 750,
  cursor: "pointer",
} as const;
function money(cents: number, currency: string): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

function dateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

async function fileSha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Internal paid-order queue. Vol I consent state, Vol III ledger/UX,
 * Vol III-B runtime enforcement, and Vol V treasury evidence are displayed
 * as operating controls rather than customer-facing claims.
 */
export default function PublicOrderFulfillmentPage() {
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/internal/public-orders/fulfillment", {
        cache: "no-store",
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        orders?: PublicOrder[];
      };
      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "The public-order queue could not be loaded.",
        );
      }
      setOrders(result.orders ?? []);
      setMessage(null);
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "The public-order queue could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateDraft = (orderId: string, field: keyof Draft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] ?? EMPTY_DRAFT),
        [field]: value,
      },
    }));
  };

  const uploadReport = async (order: PublicOrder, file: File | undefined) => {
    if (!file) return;
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage("Select the final report as a PDF.");
      return;
    }
    if (file.size < 1 || file.size > 25 * 1024 * 1024) {
      setMessage("The final report PDF must be no larger than 25 MB.");
      return;
    }

    setBusyOrderId(order.id);
    setMessage("Verifying the PDF digest…");
    try {
      const sha256 = await fileSha256(file);
      const beginResponse = await fetch(
        "/api/internal/public-orders/report-artifact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "BEGIN",
            orderId: order.id,
            fileName: file.name,
            mimeType: file.type,
            byteSize: file.size,
            sha256,
          }),
        },
      );
      const begun = (await beginResponse.json()) as {
        ok?: boolean;
        error?: string;
        uploadUrl?: string;
        artifact?: { artifactId?: string };
      };
      if (
        !beginResponse.ok ||
        !begun.ok ||
        !begun.uploadUrl ||
        !begun.artifact?.artifactId
      ) {
        throw new Error(
          begun.error || "The governed report upload could not begin.",
        );
      }

      setMessage("Uploading directly to governed storage…");
      const uploadResponse = await fetch(begun.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error("The PDF could not be stored. No report was released.");
      }

      setMessage("Scanning and binding the exact PDF to this order…");
      const verifyResponse = await fetch(
        "/api/internal/public-orders/report-artifact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "VERIFY",
            orderId: order.id,
            artifactId: begun.artifact.artifactId,
          }),
        },
      );
      const verified = (await verifyResponse.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!verifyResponse.ok || !verified.ok) {
        throw new Error(
          verified.error || "The uploaded PDF could not be verified.",
        );
      }
      setMessage(
        "The final PDF passed digest, malware, and structural checks.",
      );
      await load();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "The final report upload failed closed.",
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  const act = async (
    order: PublicOrder,
    action: "START" | "HOLD" | "COMPLETE",
  ) => {
    const draft = drafts[order.id] ?? EMPTY_DRAFT;
    const refs = draft.evidence
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (action === "HOLD" && !draft.reason.trim()) {
      setMessage("Enter a reason before placing an order on hold.");
      return;
    }
    if (action === "START" && order.status === "HELD" && !draft.reason.trim()) {
      setMessage("Record the review note before resuming a held order.");
      return;
    }
    if (
      action === "COMPLETE" &&
      (order.reportArtifact?.status !== "VERIFIED" ||
        !order.reportArtifact.verifiedSha256 ||
        refs.length === 0)
    ) {
      setMessage(
        "Completion requires the verified final PDF and at least one evidence reference.",
      );
      return;
    }

    setBusyOrderId(order.id);
    setMessage(null);
    try {
      const response = await fetch("/api/internal/public-orders/fulfillment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key":
            "public-order-ui:" +
            order.id +
            ":" +
            action +
            ":" +
            crypto.randomUUID(),
        },
        body: JSON.stringify({
          orderId: order.id,
          action,
          reportRef: order.reportArtifact?.artifactId ?? null,
          evidenceRefs: refs,
          reason: draft.reason,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        order?: { status?: string };
      };
      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "The fulfillment action was not recorded.",
        );
      }
      setMessage(
        action === "START"
          ? "Processing start was recorded."
          : action === "HOLD"
            ? "The order is on hold."
            : "Report completion was recorded.",
      );
      await load();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "The fulfillment action was not recorded.",
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#f8fafc",
        color: "#172033",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 18,
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        <header style={{ display: "grid", gap: 8 }}>
          <p
            style={{
              margin: 0,
              color: "#9a3412",
              fontWeight: 800,
            }}
          >
            INTERNAL USE ONLY
          </p>
          <h1 style={{ margin: 0 }}>Public order fulfillment</h1>
          <p style={{ margin: 0, maxWidth: 780, lineHeight: 1.55 }}>
            Payment does not start work by itself. Use this queue to create the
            auditable processing boundary, place work on hold, and record report
            delivery evidence.
          </p>
        </header>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="button"
            style={button}
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? "Loading…" : "Refresh queue"}
          </button>
          {message ? (
            <span role="status" style={{ fontWeight: 700 }}>
              {message}
            </span>
          ) : null}
        </div>

        {orders.length === 0 && !loading ? (
          <section style={panel}>
            No paid orders currently require action.
          </section>
        ) : null}

        {orders.map((order) => {
          const draft = drafts[order.id] ?? EMPTY_DRAFT;
          const busy = busyOrderId === order.id;
          const refundHold =
            order.status === "REFUND_PENDING" ||
            (order.status === "HELD" && order.operations.customerRefundPresent);
          return (
            <article
              key={order.id}
              style={{
                ...panel,
                display: "grid",
                gap: 14,
                borderColor: refundHold ? "#d97706" : "#cbd5e1",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>{order.targetRef}</h2>
                  <div style={{ color: "#475569", marginTop: 4 }}>
                    {order.productCode} · {order.fulfillmentMode}
                  </div>
                </div>
                <strong>{order.status.replaceAll("_", " ")}</strong>
              </div>

              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: 7,
                  margin: 0,
                }}
              >
                <dt>Order</dt>
                <dd style={{ margin: 0 }}>{order.id}</dd>
                <dt>Paid amount</dt>
                <dd style={{ margin: 0 }}>
                  {money(order.amountTotalCents, order.currency)}
                </dd>
                <dt>Paid</dt>
                <dd style={{ margin: 0 }}>{dateTime(order.paidAt)}</dd>
                <dt>Processing began</dt>
                <dd style={{ margin: 0 }}>
                  {dateTime(order.fulfillmentStartedAt)}
                </dd>
              </dl>

              {refundHold ? (
                <div
                  style={{
                    padding: 13,
                    borderRadius: 8,
                    background: "#fff7ed",
                    color: "#9a3412",
                    fontWeight: 700,
                    lineHeight: 1.5,
                  }}
                >
                  Refund control is active. Do not start or resume this order.
                  {order.operations.refundFailure
                    ? " Last submission issue: " +
                      order.operations.refundFailure
                    : ""}
                </div>
              ) : null}

              {order.status === "FULFILLMENT_PENDING" ? (
                <button
                  type="button"
                  style={{ ...button, justifySelf: "start" }}
                  disabled={busy}
                  onClick={() => void act(order, "START")}
                >
                  {busy ? "Recording…" : "Start processing"}
                </button>
              ) : null}

              {order.status === "IN_FULFILLMENT" ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "grid", gap: 5 }}>
                    <strong>Hold reason</strong>
                    <input
                      style={input}
                      value={draft.reason}
                      onChange={(event) =>
                        updateDraft(order.id, "reason", event.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    style={{
                      ...button,
                      justifySelf: "start",
                      background: "#9a3412",
                    }}
                    disabled={busy}
                    onClick={() => void act(order, "HOLD")}
                  >
                    Place on hold
                  </button>

                  <section
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 13,
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      background: "#f8fafc",
                    }}
                  >
                    <strong>Final Property Decision Report PDF</strong>
                    {order.reportArtifact ? (
                      <span>
                        {order.reportArtifact.fileName} ·{" "}
                        {order.reportArtifact.status.replaceAll("_", " ")}
                        {order.reportArtifact.verifiedSha256
                          ? " · SHA-256 " + order.reportArtifact.verifiedSha256
                          : ""}
                      </span>
                    ) : (
                      <span>
                        No PDF is bound to this order. Completion remains
                        blocked.
                      </span>
                    )}
                    {order.reportArtifact?.status !== "VERIFIED" ? (
                      <label style={{ display: "grid", gap: 5 }}>
                        <span>
                          Upload PDF directly to governed private storage
                        </span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          disabled={busy}
                          onChange={(event) => {
                            const selected = event.currentTarget.files?.[0];
                            void uploadReport(order, selected);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    ) : (
                      <span style={{ color: "#166534", fontWeight: 700 }}>
                        Digest, malware, and PDF safety checks passed.
                      </span>
                    )}
                  </section>
                  <label style={{ display: "grid", gap: 5 }}>
                    <strong>Evidence references, one per line</strong>
                    <textarea
                      style={{ ...input, minHeight: 92 }}
                      value={draft.evidence}
                      onChange={(event) =>
                        updateDraft(order.id, "evidence", event.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    style={{ ...button, justifySelf: "start" }}
                    disabled={
                      busy || order.reportArtifact?.status !== "VERIFIED"
                    }
                    onClick={() => void act(order, "COMPLETE")}
                  >
                    Publish verified report to customer
                  </button>
                </div>
              ) : null}

              {order.status === "HELD" && !refundHold ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <p style={{ margin: 0 }}>
                    Hold reason: {order.operations.holdReason || "Not recorded"}
                  </p>
                  <label style={{ display: "grid", gap: 5 }}>
                    <strong>Review note required to resume</strong>
                    <input
                      style={input}
                      value={draft.reason}
                      onChange={(event) =>
                        updateDraft(order.id, "reason", event.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    style={{ ...button, justifySelf: "start" }}
                    disabled={busy}
                    onClick={() => void act(order, "START")}
                  >
                    Resume after review
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </main>
  );
}
