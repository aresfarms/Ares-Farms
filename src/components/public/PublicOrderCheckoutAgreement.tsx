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
    requestId.current ??= "public-checkout-" + window.crypto.randomUUID();
    try {
      const response = await fetch("/api/public/purchases/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestId.current,
        },
        body: JSON.stringify({
          productCode: props.productCode,
          target: props.target,
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
      requestId.current = null;
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
          ? "OPENING SECURE CHECKOUT…"
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
