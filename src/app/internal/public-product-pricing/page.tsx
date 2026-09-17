"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type CostField =
  | "directDataCostCents"
  | "computeCostCents"
  | "reviewLaborMinutes"
  | "reviewLaborRateCentsHourly"
  | "supportReserveCents"
  | "overheadAllocationCents"
  | "paymentFeeBasisPoints"
  | "paymentFeeFixedCents"
  | "refundReserveBasisPoints"
  | "minimumMarginBasisPoints";

type EvidenceKind =
  | "DATA_AND_COMPUTE"
  | "REVIEW_LABOR"
  | "PAYMENT_PROCESSING"
  | "SUPPORT_AND_REFUNDS";
type Product = {
  code: string;
  publicName: string | null;
  catalogVersion: string;
  unitAmountCents: number;
  currency: string;
  fulfillmentMode: string;
  releaseState: string;
  pricingBasis: string;
};

type PriceReview = {
  id: string;
  unitAmountCents: number;
  currency: string;
  fullyLoadedCostCents: number;
  contributionMarginCents: number;
  contributionMarginBasisPoints: number;
  minimumMarginBasisPoints: number;
  reviewStatus: string;
  effectiveAt: string;
  expiresAt: string;
  reviewedAt: string | null;
  createdAt: string;
};
type PricingResponse = {
  ok: boolean;
  error?: string;
  product?: Product;
  current?: {
    allowed: boolean;
    reasons: string[];
    reviewId: string | null;
  };
  reviews?: PriceReview[];
};

type EvidenceDraft = {
  reference: string;
  asOf: string;
  reviewed: boolean;
};

type FormState = Record<CostField, string> & {
  effectiveAt: string;
  expiresAt: string;
  evidence: Record<EvidenceKind, EvidenceDraft>;
  approve: boolean;
};
const COST_FIELDS: ReadonlyArray<{
  key: CostField;
  label: string;
  hint: string;
}> = [
  { key: "directDataCostCents", label: "Direct data cost", hint: "cents" },
  { key: "computeCostCents", label: "Compute cost", hint: "cents" },
  { key: "reviewLaborMinutes", label: "Review labor", hint: "minutes" },
  {
    key: "reviewLaborRateCentsHourly",
    label: "Review labor rate",
    hint: "cents per hour",
  },
  { key: "supportReserveCents", label: "Support reserve", hint: "cents" },
  {
    key: "overheadAllocationCents",
    label: "Overhead allocation",
    hint: "cents",
  },
  {
    key: "paymentFeeBasisPoints",
    label: "Payment fee",
    hint: "basis points",
  },
  {
    key: "paymentFeeFixedCents",
    label: "Fixed payment fee",
    hint: "cents",
  },
  {
    key: "refundReserveBasisPoints",
    label: "Refund/chargeback reserve",
    hint: "basis points",
  },
  {
    key: "minimumMarginBasisPoints",
    label: "Minimum contribution margin",
    hint: "basis points",
  },
];

const EVIDENCE: ReadonlyArray<{ kind: EvidenceKind; label: string }> = [
  { kind: "DATA_AND_COMPUTE", label: "Data and compute evidence" },
  { kind: "REVIEW_LABOR", label: "Review labor evidence" },
  { kind: "PAYMENT_PROCESSING", label: "Payment processing evidence" },
  {
    kind: "SUPPORT_AND_REFUNDS",
    label: "Support and refund evidence",
  },
];

const panel = {
  padding: 18,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#ffffff",
} as const;

const input = {
  width: "100%",
  minHeight: 42,
  boxSizing: "border-box",
  border: "1px solid #94a3b8",
  borderRadius: 7,
  padding: "9px 11px",
  font: "inherit",
} as const;

function localDateTime(date: Date): string {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function initialForm(): FormState {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 90);
  const asOf = now.toISOString().slice(0, 10);
  const evidence = Object.fromEntries(
    EVIDENCE.map(({ kind }) => [
      kind,
      { reference: "", asOf, reviewed: false },
    ]),
  ) as Record<EvidenceKind, EvidenceDraft>;
  return {
    directDataCostCents: "",
    computeCostCents: "",
    reviewLaborMinutes: "",
    reviewLaborRateCentsHourly: "",
    supportReserveCents: "",
    overheadAllocationCents: "",
    paymentFeeBasisPoints: "",
    paymentFeeFixedCents: "",
    refundReserveBasisPoints: "",
    minimumMarginBasisPoints: "",
    effectiveAt: localDateTime(now),
    expiresAt: localDateTime(expires),
    evidence,
    approve: false,
  };
}

function money(cents: number, currency = "usd"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

function margin(basisPoints: number): string {
  return (basisPoints / 100).toFixed(2) + "%";
}

/**
 * Operator-only unit-economics review. No browser-supplied price can alter
 * checkout; approval only records evidence against the server catalog.
 */
export default function PublicProductPricingPage() {
  const [data, setData] = useState<PricingResponse | null>(null);
  const [form, setForm] = useState<FormState>(() => initialForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/internal/public-product-pricing/reviews?productCode=custom_property_analysis",
        { cache: "no-store" },
      );
      const result = (await response.json()) as PricingResponse;
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Pricing review could not be loaded.");
      }
      setData(result);
      setMessage(null);
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Pricing review could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const updateCost = (key: CostField, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateEvidence = (
    kind: EvidenceKind,
    change: Partial<EvidenceDraft>,
  ) => {
    setForm((current) => ({
      ...current,
      evidence: {
        ...current.evidence,
        [kind]: { ...current.evidence[kind], ...change },
      },
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const product = data?.product;
    if (!product) return;
    const numbers = Object.fromEntries(
      COST_FIELDS.map(({ key }) => [key, Number(form[key])]),
    ) as Record<CostField, number>;
    if (
      COST_FIELDS.some(
        ({ key }) =>
          form[key].trim() === "" ||
          !Number.isSafeInteger(numbers[key]) ||
          numbers[key] < 0,
      )
    ) {
      setMessage("Every cost field must contain a whole number of zero or more.");
      return;
    }
    const sourceRefs = EVIDENCE.map(({ kind }) => ({
      kind,
      reference: form.evidence[kind].reference.trim(),
      asOf: form.evidence[kind].asOf,
      reviewed: form.evidence[kind].reviewed,
    }));
    if (
      sourceRefs.some(
        (ref) => !ref.reference || !ref.asOf || !ref.reviewed,
      )
    ) {
      setMessage("Review and confirm all four evidence references.");
      return;
    }
    const effectiveAt = new Date(form.effectiveAt);
    const expiresAt = new Date(form.expiresAt);
    if (
      Number.isNaN(effectiveAt.getTime()) ||
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt <= effectiveAt
    ) {
      setMessage("The review expiry must be later than its effective time.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(
        "/api/internal/public-product-pricing/reviews",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productCode: product.code,
            productCatalogVersion: product.catalogVersion,
            unitAmountCents: product.unitAmountCents,
            currency: product.currency,
            ...numbers,
            effectiveAt: effectiveAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            sourceRefs,
            approve: form.approve,
          }),
        },
      );
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        review?: { reviewStatus?: string };
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Price review was not recorded.");
      }
      setMessage(
        result.review?.reviewStatus === "APPROVED"
          ? "The catalog price is approved for the recorded validity window."
          : "Draft price evidence was recorded without approving checkout.",
      );
      setForm((current) => ({ ...current, approve: false }));
      await load();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Price review was not recorded.",
      );
    } finally {
      setSaving(false);
    }
  };

  const product = data?.product;
  const current = data?.current;
  const reviews = data?.reviews ?? [];
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
          <p style={{ margin: 0, color: "#9a3412", fontWeight: 800 }}>
            INTERNAL USE ONLY
          </p>
          <h1 style={{ margin: 0 }}>Public product price review</h1>
          <p style={{ margin: 0, maxWidth: 820, lineHeight: 1.55 }}>
            Prove that the server-owned price covers current fulfillment,
            payment, support, refund, and operating costs before paid checkout
            can open.
          </p>
        </header>

        <section style={{ ...panel, display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 21 }}>Current gate</h2>
          {loading ? <p style={{ margin: 0 }}>Loading…</p> : null}
          {product ? (
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: 8,
                margin: 0,
              }}
            >
              <dt>Product</dt>
              <dd style={{ margin: 0 }}>{product.publicName}</dd>
              <dt>Locked catalog price</dt>
              <dd style={{ margin: 0 }}>
                {money(product.unitAmountCents, product.currency)}
              </dd>
              <dt>Catalog version</dt>
              <dd style={{ margin: 0 }}>{product.catalogVersion}</dd>
              <dt>Current approved review</dt>
              <dd style={{ margin: 0, fontWeight: 800 }}>
                {current?.allowed ? "VALID" : "NOT VALID"}
              </dd>
              <dt>Blocking reasons</dt>
              <dd style={{ margin: 0 }}>
                {current?.reasons.length
                  ? current.reasons.join(", ")
                  : "None"}
              </dd>
            </dl>
          ) : null}
          {message ? (
            <p role="status" style={{ margin: 0, fontWeight: 750 }}>
              {message}
            </p>
          ) : null}
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            style={{
              ...input,
              width: "fit-content",
              cursor: "pointer",
              fontWeight: 750,
            }}
          >
            Refresh
          </button>
        </section>

        {product ? (
          <form onSubmit={submit} style={{ ...panel, display: "grid", gap: 18 }}>
            <fieldset
              style={{
                display: "grid",
                gap: 12,
                border: 0,
                padding: 0,
                margin: 0,
              }}
            >
              <legend style={{ fontSize: 21, fontWeight: 800 }}>
                Fully loaded cost inputs
              </legend>
              <p style={{ margin: 0, color: "#475569" }}>
                Enter whole cents, minutes, or basis points exactly as labeled.
                Zero is permitted only where evidence supports zero.
              </p>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(230px, 1fr))",
                }}
              >
                {COST_FIELDS.map((field) => (
                  <label key={field.key} style={{ display: "grid", gap: 5 }}>
                    <strong>{field.label}</strong>
                    <input
                      style={input}
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={form[field.key]}
                      onChange={(event) =>
                        updateCost(field.key, event.target.value)
                      }
                    />
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      {field.hint}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset
              style={{
                display: "grid",
                gap: 12,
                border: 0,
                padding: 0,
                margin: 0,
              }}
            >
              <legend style={{ fontSize: 21, fontWeight: 800 }}>
                Evidence reviewed
              </legend>
              {EVIDENCE.map(({ kind, label }) => {
                const draft = form.evidence[kind];
                return (
                  <div
                    key={kind}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                  >
                    <strong>{label}</strong>
                    <label style={{ display: "grid", gap: 5 }}>
                      Source or internal evidence reference
                      <input
                        style={input}
                        required
                        value={draft.reference}
                        onChange={(event) =>
                          updateEvidence(kind, {
                            reference: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label style={{ display: "grid", gap: 5 }}>
                      Evidence as-of date
                      <input
                        style={input}
                        type="date"
                        required
                        value={draft.asOf}
                        onChange={(event) =>
                          updateEvidence(kind, { asOf: event.target.value })
                        }
                      />
                    </label>
                    <label style={{ display: "flex", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={draft.reviewed}
                        onChange={(event) =>
                          updateEvidence(kind, {
                            reviewed: event.target.checked,
                          })
                        }
                      />
                      I reviewed this evidence and it supports the input.
                    </label>
                  </div>
                );
              })}
            </fieldset>
            <fieldset
              style={{
                display: "grid",
                gap: 12,
                border: 0,
                padding: 0,
                margin: 0,
              }}
            >
              <legend style={{ fontSize: 21, fontWeight: 800 }}>
                Validity and approval
              </legend>
              <label style={{ display: "grid", gap: 5 }}>
                Effective
                <input
                  style={input}
                  type="datetime-local"
                  required
                  value={form.effectiveAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      effectiveAt: event.target.value,
                    }))
                  }
                />
              </label>
              <label style={{ display: "grid", gap: 5 }}>
                Expires
                <input
                  style={input}
                  type="datetime-local"
                  required
                  value={form.expiresAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      expiresAt: event.target.value,
                    }))
                  }
                />
              </label>
              <label
                style={{
                  display: "flex",
                  gap: 9,
                  padding: 13,
                  background: "#fff7ed",
                  borderRadius: 8,
                  fontWeight: 750,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.approve}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      approve: event.target.checked,
                    }))
                  }
                />
                I approve this exact{" "}
                {money(product.unitAmountCents, product.currency)} catalog
                price and evidence window. Leave unchecked to save a draft
                only.
              </label>
              <button
                type="submit"
                disabled={saving}
                style={{
                  minHeight: 44,
                  width: "fit-content",
                  padding: "9px 16px",
                  border: 0,
                  borderRadius: 7,
                  background: form.approve ? "#0f766e" : "#475569",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {saving
                  ? "Recording…"
                  : form.approve
                    ? "Approve price review"
                    : "Save draft review"}
              </button>
            </fieldset>
          </form>
        ) : null}

        <section style={{ ...panel, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 21 }}>Review history</h2>
          {reviews.length === 0 && !loading ? (
            <p style={{ margin: 0 }}>No review has been recorded.</p>
          ) : null}
          {reviews.map((review) => (
            <article
              key={review.id}
              style={{
                display: "grid",
                gap: 7,
                padding: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
              }}
            >
              <strong>
                {review.reviewStatus} · {money(review.unitAmountCents)}
              </strong>
              <span>
                Loaded cost {money(review.fullyLoadedCostCents)} · margin{" "}
                {money(review.contributionMarginCents)} (
                {margin(review.contributionMarginBasisPoints)})
              </span>
              <span>
                Minimum required margin{" "}
                {margin(review.minimumMarginBasisPoints)}
              </span>
              <span>
                Effective {new Date(review.effectiveAt).toLocaleString()} to{" "}
                {new Date(review.expiresAt).toLocaleString()}
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Review {review.id} · recorded{" "}
                {new Date(review.createdAt).toLocaleString()}
              </span>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
