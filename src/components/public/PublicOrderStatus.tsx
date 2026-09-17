"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import styles from "./FurlongExperience.module.css";

type OrderAgreement = {
  id: string | null;
  version: string | null;
  title: string | null;
  terms: string[];
  acceptanceText: string | null;
  exactTextSha256: string | null;
  acceptedAt: string | null;
};

type OrderReport = {
  artifactId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  availableAt: string | null;
  firstDownloadedAt: string | null;
  lastDownloadedAt: string | null;
  downloadCount: number;
  downloadPath: string;
};

type OrderStatus = {
  id: string;
  productCode: string;
  productName: string | null;
  fulfillmentMode: string;
  status: string;
  canCancelForFullRefund: boolean;
  refundPending: boolean;
  amountTotalCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  currency: string;
  target: {
    exactAddress: string | null;
    propertyId: string | null;
  };
  report: OrderReport | null;
  upgradeOffer: {
    eligible: boolean;
    creditAmountCents: number;
    payableAmountCents: number | null;
    expiresAt: string | null;
    targetProductCode: string;
    targetProductName: string | null;
  } | null;
  paidAt: string | null;
  fulfillmentStartedAt: string | null;
  fulfilledAt: string | null;
};

const TERMINAL = new Set([
  "FULFILLED",
  "FAILED",
  "CANCELED",
  "REFUNDED",
  "DISPUTED",
  "DISPUTE_WON",
  "DISPUTE_LOST",
]);

export function PublicOrderStatus(props: { orderId: string }) {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [agreement, setAgreement] = useState<OrderAgreement | null>(null);
  const [message, setMessage] = useState("Confirming payment…");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = window.sessionStorage.getItem(
      `furlong:public-order:${props.orderId}`,
    );
    if (!token) {
      setMessage(
        "Payment returned successfully. Save the order reference below while Furlong confirms it.",
      );
      return;
    }

    let stopped = false;
    let timer: number | null = null;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/public/purchases/${props.orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = (await response.json()) as {
          ok?: boolean;
          error?: string;
          order?: OrderStatus;
          agreement?: OrderAgreement | null;
        };
        if (!response.ok || !result.ok || !result.order) {
          throw new Error(
            result.error || "Order status is temporarily unavailable.",
          );
        }
        if (stopped) return;
        setOrder(result.order);
        setAgreement(result.agreement ?? null);
        setMessage(
          result.order.status === "REFUND_PENDING"
            ? "Your analysis is paused while Stripe processes the full refund."
            : result.order.status === "REFUNDED"
              ? "Your full refund has been confirmed."
              : result.order.status === "DISPUTED"
                ? "A payment dispute is open. Order access is paused."
                : result.order.status === "DISPUTE_WON"
                  ? "The payment dispute closed in Furlong’s favor. Order access remains paused for review."
                  : result.order.status === "DISPUTE_LOST"
                    ? "The payment dispute closed in the customer’s favor. Order access remains revoked."
                    : result.order.status === "FULFILLED"
                      ? result.order.report
                        ? "Your verified report is ready for secure download."
                        : "Your report is complete while secure delivery evidence is reconciled."
                      : result.order.amountPaidCents > 0
                        ? "Payment confirmed. Furlong is preparing your analysis."
                        : "Payment is still being confirmed.",
        );
        if (!TERMINAL.has(result.order.status)) {
          timer = window.setTimeout(() => void refresh(), 3_000);
        }
      } catch (caught) {
        if (stopped) return;
        setMessage(
          caught instanceof Error
            ? caught.message
            : "Order status is temporarily unavailable.",
        );
      }
    };
    void refresh();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [props.orderId, refreshKey]);

  const requestCancellation = async () => {
    const token = window.sessionStorage.getItem(
      `furlong:public-order:${props.orderId}`,
    );
    if (!token) {
      setActionMessage(
        "This browser no longer has the secure order token. Contact Furlong with the order reference.",
      );
      return;
    }

    setCancelBusy(true);
    setActionMessage(null);
    try {
      const response = await fetch(
        `/api/public/purchases/${props.orderId}/cancel`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "The cancellation could not be submitted.",
        );
      }
      setActionMessage(
        result.message || "Your full refund is being processed.",
      );
      setCancelOpen(false);
      setRefreshKey((value) => value + 1);
    } catch (caught) {
      setActionMessage(
        caught instanceof Error
          ? caught.message
          : "The cancellation could not be submitted.",
      );
    } finally {
      setCancelBusy(false);
    }
  };

  const downloadReport = async () => {
    if (!order?.report) return;
    const token = window.sessionStorage.getItem(
      `furlong:public-order:${props.orderId}`,
    );
    if (!token) {
      setActionMessage(
        "This browser no longer has the secure order token. Contact Furlong with the order reference.",
      );
      return;
    }

    setDownloadBusy(true);
    setActionMessage(null);
    try {
      const response = await fetch(order.report.downloadPath, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(result?.error || "The report could not be downloaded.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = order.report.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setActionMessage(
        "The verified report download was recorded to this order.",
      );
      setRefreshKey((value) => value + 1);
    } catch (caught) {
      setActionMessage(
        caught instanceof Error
          ? caught.message
          : "The report could not be downloaded.",
      );
    } finally {
      setDownloadBusy(false);
    }
  };

  const upgradeHref = (() => {
    if (!order?.upgradeOffer?.eligible || !order.target.exactAddress) {
      return null;
    }
    const query = new URLSearchParams({
      product: order.upgradeOffer.targetProductCode,
      address: order.target.exactAddress,
      upgradeFrom: order.id,
    });
    if (order.target.propertyId) {
      query.set("propertyId", order.target.propertyId);
    }
    return `/purchase?${query.toString()}`;
  })();

  return (
    <section className={styles.start} aria-live="polite">
      <p className={styles.eyebrow}>Order received</p>
      <h1>{order?.productName || "Furlong property analysis"}</h1>
      <p>{message}</p>
      <dl className={styles.orderStatus}>
        <div>
          <dt>Order reference</dt>
          <dd>{props.orderId}</dd>
        </div>
        {order ? (
          <>
            <div>
              <dt>Status</dt>
              <dd>{order.status.replaceAll("_", " ").toLowerCase()}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>
                {(order.amountTotalCents / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: order.currency.toUpperCase(),
                })}
              </dd>
            </div>
          </>
        ) : null}
      </dl>
      {order?.report ? (
        <div className={styles.upgradeOffer}>
          <strong>Your verified report is ready</strong>
          <span>
            {order.report.fileName} ·{" "}
            {(order.report.byteSize / 1024 / 1024).toFixed(2)} MB
          </span>
          <span className={styles.receiptDigest}>
            SHA-256: {order.report.sha256}
          </span>
          <button
            type="button"
            className={styles.primary}
            disabled={downloadBusy}
            onClick={() => void downloadReport()}
          >
            {downloadBusy
              ? "Preparing secure download…"
              : "Download verified report"}
          </button>
          <span>
            Access is bound to this paid order and is revoked after a refund or
            dispute.
          </span>
        </div>
      ) : null}
      {upgradeHref && order?.upgradeOffer ? (
        <div className={styles.upgradeOffer}>
          <strong>
            The reviewed Decision Report is available with your one-time
            prior-report credit.
          </strong>
          <span>
            Credit:{" "}
            {(order.upgradeOffer.creditAmountCents / 100).toLocaleString(
              "en-US",
              {
                style: "currency",
                currency: order.currency.toUpperCase(),
              },
            )}
            {order.upgradeOffer.expiresAt
              ? ` · valid through ${new Date(
                  order.upgradeOffer.expiresAt,
                ).toLocaleDateString()}`
              : ""}
          </span>
          <Link href={upgradeHref} className={styles.primary}>
            Review Decision Report scope and credited total
          </Link>
        </div>
      ) : null}
      {agreement ? (
        <details className={styles.orderReceipt}>
          <summary>View accepted order terms</summary>
          <div>
            <h2>{agreement.title || "Order terms"}</h2>
            <p>
              Accepted{" "}
              {agreement.acceptedAt
                ? new Date(agreement.acceptedAt).toLocaleString()
                : "at checkout"}
              {agreement.version ? ` · Version ${agreement.version}` : ""}
            </p>
            <ol>
              {agreement.terms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ol>
            {agreement.acceptanceText ? (
              <p>
                <strong>{agreement.acceptanceText}</strong>
              </p>
            ) : null}
            {agreement.exactTextSha256 ? (
              <p className={styles.receiptDigest}>
                Terms fingerprint: {agreement.exactTextSha256}
              </p>
            ) : null}
            <button
              type="button"
              className={styles.secondary}
              onClick={(event) => {
                event.currentTarget
                  .closest("details")
                  ?.setAttribute("open", "");
                window.print();
              }}
            >
              Print or save this receipt
            </button>
          </div>
        </details>
      ) : null}
      {order?.canCancelForFullRefund ? (
        <div className={styles.refundAction}>
          {!cancelOpen ? (
            <button
              className={styles.secondary}
              type="button"
              onClick={() => setCancelOpen(true)}
            >
              Cancel before processing and refund in full
            </button>
          ) : (
            <div className={styles.refundConfirm}>
              <h2>Confirm cancellation</h2>
              <p>
                This permanently stops this analysis before processing begins.
                Stripe will refund the full{" "}
                {(order.amountTotalCents / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: order.currency.toUpperCase(),
                })}
                .
              </p>
              <div>
                <button
                  className={styles.primary}
                  type="button"
                  disabled={cancelBusy}
                  onClick={() => void requestCancellation()}
                >
                  {cancelBusy
                    ? "Submitting refund…"
                    : "Yes, cancel and refund in full"}
                </button>
                <button
                  className={styles.secondary}
                  type="button"
                  disabled={cancelBusy}
                  onClick={() => setCancelOpen(false)}
                >
                  Keep my analysis
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {actionMessage ? (
        <p className={styles.actionMessage}>{actionMessage}</p>
      ) : null}
      {order?.status === "IN_FULFILLMENT" ? (
        <p className={styles.note}>
          Property-specific processing has started, so automatic cancellation is
          no longer available.
        </p>
      ) : null}
      <p className={styles.note}>
        An unfavorable property conclusion is still a completed analysis.
        Payment never guarantees financing, approvals, grants, or profit.
      </p>
    </section>
  );
}
