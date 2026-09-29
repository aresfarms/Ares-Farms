"use client";

import { useEffect, useRef, useState } from "react";

import {
  PUBLIC_ORDER_AGREEMENT_ACCEPTANCE,
  PUBLIC_ORDER_AGREEMENT_TERMS,
  PUBLIC_ORDER_AGREEMENT_TITLE,
  PUBLIC_ORDER_AGREEMENT_VERSION,
  publicOrderPaymentButtonLabel,
} from "@/lib/billing/publicOrderAgreement";
import type { PublicProductCode } from "@/lib/billing/publicProductCatalog";
import styles from "./FurlongExperience.module.css";

export type PublicOrderCheckoutTarget =
  | {
      type: "PROPERTY";
      exactAddress: string;
      propertyId?: string | null;
      analysisComparisonId?: string | null;
    }
  | {
      type: "PROPERTY_COMPARISON";
      comparisonId: string;
    };

type CheckoutResponse = {
  ok?: boolean;
  error?: string;
  orderId?: string;
  orderAccessToken?: string;
  checkoutUrl?: string | null;
  retryWithNewRequest?: boolean;
};

function moneyLine(amountCents: number, currency: string): string {
  return (amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

export function PublicOrderCheckoutAgreement(props: {
  productCode: PublicProductCode;
  productName: string;
  productDescription: string;
  targetLabel: string;
  target: PublicOrderCheckoutTarget;
  amountCents: number;
  currency: string;
  deliveryPromise: string;
  included: readonly string[];
  excluded: readonly string[];
  upgradeFromOrderId: string | null;
}) {
  const [customerVision, setCustomerVision] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditAmountCents, setCreditAmountCents] = useState(0);
  const [upgradeAccessToken, setUpgradeAccessToken] = useState<string | null>(
    null,
  );
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(
    props.upgradeFromOrderId ? "Confirming prior-report credit…" : null,
  );
  const requestId = useRef<string | null>(null);
  const recoveryToken = useRef<string | null>(null);
  const payableAmountCents = Math.max(0, props.amountCents - creditAmountCents);
  const upgradeBlocked = Boolean(
    props.upgradeFromOrderId && !upgradeAccessToken,
  );

  useEffect(() => {
    const sourceOrderId = props.upgradeFromOrderId;
    if (!sourceOrderId) return;
    const token = window.sessionStorage.getItem(
      `furlong:public-order:${sourceOrderId}`,
    );
    if (!token) {
      setUpgradeMessage(
        "This browser no longer has the secure token for the prior report. The credit cannot be applied here.",
      );
      return;
    }
    let stopped = false;
    void (async () => {
      try {
        const response = await fetch(`/api/public/purchases/${sourceOrderId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = (await response.json()) as {
          ok?: boolean;
          order?: {
            target?: {
              exactAddress?: string | null;
              propertyId?: string | null;
            };
            upgradeOffer?: {
              eligible?: boolean;
              creditAmountCents?: number;
              payableAmountCents?: number | null;
              expiresAt?: string | null;
            } | null;
          };
        };
        const offer = result.order?.upgradeOffer;
        const sourceTarget = result.order?.target;
        const sameProperty =
          props.target.type === "PROPERTY" &&
          ((props.target.propertyId &&
            sourceTarget?.propertyId === props.target.propertyId) ||
            sourceTarget?.exactAddress?.toLowerCase() ===
              props.target.exactAddress.toLowerCase());
        if (
          !response.ok ||
          !result.ok ||
          !offer?.eligible ||
          !sameProperty ||
          !Number.isSafeInteger(offer.creditAmountCents) ||
          (offer.creditAmountCents ?? 0) <= 0
        ) {
          throw new Error(
            "The prior report is not eligible for a same-property credit.",
          );
        }
        if (stopped) return;
        setCreditAmountCents(offer.creditAmountCents ?? 0);
        setUpgradeAccessToken(token);
        setUpgradeMessage(
          `Verified credit: ${((offer.creditAmountCents ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: props.currency.toUpperCase() })}. The server will re-check it before payment.`,
        );
      } catch (caught) {
        if (!stopped) {
          setUpgradeMessage(
            caught instanceof Error
              ? caught.message
              : "The prior-report credit could not be verified.",
          );
        }
      }
    })();
    return () => {
      stopped = true;
    };
  }, [props.currency, props.target, props.upgradeFromOrderId]);

  async function beginCheckout() {
    if (!accepted || busy || upgradeBlocked) return;
    setBusy(true);
    setError(null);
    const recoveryKey = "furlong:checkout:" + JSON.stringify([props.productCode, props.target, customerVision, props.upgradeFromOrderId]);
    try {
      const saved = window.sessionStorage.getItem(recoveryKey);
      if (saved) {
        const value = JSON.parse(saved) as { requestId: string; token: string };
        requestId.current = value.requestId;
        recoveryToken.current = value.token;
      } else {
        requestId.current = "public-checkout-" + window.crypto.randomUUID();
        const bytes = window.crypto.getRandomValues(new Uint8Array(32));
        recoveryToken.current = "furlong-order-" + window.btoa(String.fromCharCode(...bytes))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        window.sessionStorage.setItem(recoveryKey, JSON.stringify({ requestId: requestId.current, token: recoveryToken.current }));
      }
      const storedComparison = window.sessionStorage.getItem("furlong:property-comparison-access:v1");
      const comparisonAccess = storedComparison ? JSON.parse(storedComparison) as { comparisonId?: string; accessToken?: string } : null;
      const analysisToken = props.target.type === "PROPERTY" && props.target.analysisComparisonId &&
        comparisonAccess?.comparisonId === props.target.analysisComparisonId ? comparisonAccess.accessToken : null;
      const response = await fetch("/api/public/purchases/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestId.current!,
          "X-Checkout-Recovery": recoveryToken.current!,
          ...(analysisToken ? { Authorization: `Bearer ${analysisToken}` } : {}),
        },
        body: JSON.stringify({
          productCode: props.productCode,
          target: props.target.type === "PROPERTY" ? { ...props.target, customerVision } : props.target,
          agreement: {
            accepted: true,
            version: PUBLIC_ORDER_AGREEMENT_VERSION,
          },
          upgrade:
            props.upgradeFromOrderId && upgradeAccessToken
              ? {
                  sourceOrderId: props.upgradeFromOrderId,
                  sourceAccessToken: upgradeAccessToken,
                }
              : undefined,
        }),
      });
      const result = (await response.json()) as CheckoutResponse;
      if (result.retryWithNewRequest) window.sessionStorage.removeItem(recoveryKey);
      if (
        !response.ok ||
        !result.ok ||
        !result.checkoutUrl ||
        !result.orderId ||
        !result.orderAccessToken
      ) {
        throw new Error(
          result.error || "Furlong could not open secure checkout.",
        );
      }
      window.sessionStorage.setItem(
        `furlong:public-order:${result.orderId}`,
        result.orderAccessToken,
      );
      window.location.assign(result.checkoutUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Furlong could not open secure checkout.",
      );
      setBusy(false);
    }
  }

  return (
    <section
      className={styles.checkout}
      aria-labelledby="public-order-checkout-heading"
    >
      <div className={styles.checkoutSummary}>
        <p className={styles.eyebrow}>Confirm your order</p>
        <h2 id="public-order-checkout-heading">{props.productName}</h2>
        <p>{props.productDescription}</p>
        <dl>
          <div>
            <dt>Property or list</dt>
            <dd>{props.targetLabel}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>
              {(payableAmountCents / 100).toLocaleString("en-US", {
                style: "currency",
                currency: props.currency.toUpperCase(),
              })}
              {creditAmountCents > 0 ? (
                <span style={{ display: "block", fontSize: 12 }}>
                  {moneyLine(props.amountCents, props.currency)} list price less{" "}
                  {moneyLine(creditAmountCents, props.currency)} verified
                  prior-report credit
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Delivery target</dt>
            <dd>{props.deliveryPromise}</dd>
          </div>
        </dl>
        <div className={styles.orderScope}>
          <div>
            <h3>Included in this exact price</h3>
            <ul>
              {props.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Not included</h3>
            <ul>
              {props.excluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {upgradeMessage ? (
        <p
          role={upgradeBlocked ? "alert" : "status"}
          className={upgradeBlocked ? styles.error : styles.actionMessage}
        >
          {upgradeMessage}
        </p>
      ) : null}

      {props.productCode === "focused_property_report" ? (
        <label>
          What would you like to do with this property? (optional)
          <textarea value={customerVision} maxLength={1000} disabled={busy}
            onChange={event => setCustomerVision(event.target.value)} />
          <span>Your idea is treated as a proposed use, not a verified property fact.</span>
        </label>
      ) : null}
      <div className={styles.refundTerms}>
        <h3>{PUBLIC_ORDER_AGREEMENT_TITLE}</h3>
        {PUBLIC_ORDER_AGREEMENT_TERMS.map((term) => (
          <p key={term}>{term}</p>
        ))}
      </div>
      <label className={styles.agreementCheck}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          required
        />
        <strong>{PUBLIC_ORDER_AGREEMENT_ACCEPTANCE}</strong>
      </label>

      <button
        type="button"
        className={styles.primary}
        disabled={!accepted || busy || upgradeBlocked}
        onClick={() => void beginCheckout()}
      >
        {busy
          ? (props.productCode === "focused_property_report" ? "VERIFYING YOUR REPORT BEFORE CHECKOUT…" : "OPENING SECURE CHECKOUT…")
          : publicOrderPaymentButtonLabel(payableAmountCents, props.currency)}
      </button>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
