"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  FinancingPathwayInput,
  FinancingPathwayResult,
  evaluateFinancingPathways,
} from "@/lib/financing/pathwayEngine";
import { chartSurface } from "@/lib/property/chartThemes";

/**
 * Financing Pathway Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable borrower pathway guidance.
 * - Vol II: blocks approval, guarantee, eligibility, underwriting, legal, and
 *   regulatory reliance claims.
 * - Vol III: uses deterministic backend-compatible pathway evaluation.
 * - Vol III-B: displays human-review and production-block posture.
 * - Vol IV: routes borrower next steps to application, document, and review
 *   workflows.
 * - Vol V-VII: preserves public-surface disclosures, source authority,
 *   conformance, and no-live-action boundaries.
 * Build 50 — moved to (public) group. Shell removed; layout provides background, font, and minHeight.
 *
 * Chart Table cohesion rollout (founder 2026-07-17): this surface sits on the
 * ledger stage via chartSurface("finance") — the bankers' lens. Facts and open
 * items only; presentation change only. FINANCING_NODE_LIVE stays false and
 * this page still shows no products, rates, terms, or eligibility.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  pathwayResult?: FinancingPathwayResult;
  governance?: {
    traceId?: string;
    versionRuntime?: {
      ok?: boolean;
      replaySafe?: boolean;
    };
    outputClassification?: {
      classificationLevel?: string;
      sensitivityScope?: string;
    };
    explainability?: {
      humanReviewRequired?: boolean;
      confidenceScore?: number | null;
    };
  };
};

const surface = chartSurface("finance");
const theme = surface.theme;

const containerStyle = surface.container;
const panelStyle = surface.panel;
const mutedText = surface.muted;
const inputStyle = surface.input;

function FieldLabel(props: { children: string; htmlFor?: string }) {
  return (
    <label
      htmlFor={props.htmlFor}
      style={{
        display: "block",
        marginBottom: 6,
        ...surface.label,
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {props.children}
    </label>
  );
}

function StatusBadge(props: { tone: "ready" | "review" | "blocked"; text: string }) {
  const tone = surface.badges[props.tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {props.text}
    </span>
  );
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const initialInput: FinancingPathwayInput = {
  borrowerId: "borrower-demo",
  applicationId: "",
  location: {
    country: "US",
    state: "MD",
    county: "Queen Anne's",
  },
  farmTypes: ["CROPS"],
  goals: ["EXPANSION", "SUSTAINABILITY"],
  acreage: 120,
  requestedAmount: 125000,
  stage: "INTERMEDIATE",
  requestedPrograms: [],
  documents: ["identity", "entity", "property/control"],
  metadata: {
    purpose: "Expansion and working capital planning",
  },
};

export default function FinancingPathwaysPage() {
  const [borrowerId, setBorrowerId] = useState(initialInput.borrowerId ?? "");
  const [applicationId, setApplicationId] = useState(
    initialInput.applicationId ?? ""
  );
  const [stateCode, setStateCode] = useState(initialInput.location?.state ?? "");
  const [county, setCounty] = useState(initialInput.location?.county ?? "");
  const [farmTypes, setFarmTypes] = useState(
    (initialInput.farmTypes ?? []).join(", ")
  );
  const [goals, setGoals] = useState((initialInput.goals ?? []).join(", "));
  const [acreage, setAcreage] = useState(String(initialInput.acreage ?? ""));
  const [requestedAmount, setRequestedAmount] = useState(
    String(initialInput.requestedAmount ?? "")
  );
  const [documents, setDocuments] = useState(
    (initialInput.documents ?? []).join(", ")
  );
  const [purpose, setPurpose] = useState(
    String(initialInput.metadata?.purpose ?? "")
  );
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<FinancingPathwayInput>(
    () => ({
      borrowerId,
      applicationId,
      location: {
        country: "US",
        state: stateCode,
        county,
      },
      farmTypes: splitCsv(farmTypes),
      goals: splitCsv(goals),
      acreage: Number(acreage),
      requestedAmount: Number(requestedAmount),
      stage: "INTERMEDIATE",
      documents: splitCsv(documents),
      metadata: {
        purpose,
      },
    }),
    [
      acreage,
      applicationId,
      borrowerId,
      county,
      documents,
      farmTypes,
      goals,
      purpose,
      requestedAmount,
      stateCode,
    ]
  );

  const localResult = useMemo(() => evaluateFinancingPathways(input), [input]);
  const result = apiResponse?.pathwayResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/financing/pathways", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...input,
          userId: borrowerId,
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Financing pathway request failed.");
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown financing pathway request error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <div style={containerStyle}>
        {/*
          Public Alpha Surface Content — Route 4 (Pathway Discovery +
          Financing Reality Classification)
          Source: docs/PUBLIC_ALPHA_SURFACE_CONTENT.md §Route 4
          No approval language permitted (§3).
        */}
        <section
          aria-label="Public Alpha pathway discovery and financing reality"
          style={{
            ...panelStyle,
            padding: 28,
            marginBottom: 16,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: theme.ink }}>
            Pathway discovery
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: theme.inkSoft, lineHeight: 1.6 }}>
            Each project is reviewed against the following categories.
            This is advisory and is not an approval, guarantee, or
            official determination.
          </p>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 22, color: theme.inkSoft, lineHeight: 1.7 }}>
            <li>
              <strong style={{ color: theme.ink }}>Likely pathways</strong> — pathways matched to your project&apos;s stated facts, advisory only.
            </li>
            <li>
              <strong style={{ color: theme.ink }}>Excluded pathways</strong> — pathways your project does not fit, with the rationale.
            </li>
            <li>
              <strong style={{ color: theme.ink }}>Rationale</strong> — plain-English explanation of why a pathway is included or excluded.
            </li>
          </ul>

          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, color: theme.ink }}>
            Financing reality classification
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: theme.inkSoft, lineHeight: 1.6 }}>
            Each candidate pathway is labeled with one of:
          </p>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 22, color: theme.inkSoft, lineHeight: 1.7 }}>
            <li>likely financeable</li>
            <li>financeable with conditions</li>
            <li>specialist review required</li>
            <li>limited financing market</li>
            <li>cash-favored transaction</li>
            <li>not enough information</li>
          </ul>

          <p style={{ marginTop: 20, fontSize: 14, color: theme.inkFaint, lineHeight: 1.6 }}>
            This information is advisory only and is not an approval,
            guarantee, or official determination. No legal, regulatory,
            or official reliance may be placed on this information.
            Furlong does not lend, does not commit funds, and does not
            decide credit, eligibility, or approval. AI does not decide,
            does not approve, does not determine, and does not
            underwrite — every recommendation is reviewed by a human
            reviewer (human review).
          </p>
        </section>

        <section
          style={{
            ...panelStyle,
            padding: 22,
            display: "grid",
            gap: 16,
          }}
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
            <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
              <span style={surface.kicker}>
                Borrower Financing Pathway
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, color: theme.ink }}>
                Financing Pathway Engine
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Review-bound program pathway guidance for borrower planning.
                This surface does not approve, preapprove, underwrite, certify,
                guarantee, or authorize legal or regulatory reliance.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="No approval" />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <FieldLabel htmlFor="fp-borrower-id">Borrower ID</FieldLabel>
              <input
                id="fp-borrower-id"
                style={inputStyle}
                value={borrowerId}
                onChange={(event) => setBorrowerId(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="fp-application-id">Application ID</FieldLabel>
              <input
                id="fp-application-id"
                style={inputStyle}
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <FieldLabel htmlFor="fp-state">State</FieldLabel>
              <input
                id="fp-state"
                style={inputStyle}
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="fp-county">County</FieldLabel>
              <input
                id="fp-county"
                style={inputStyle}
                value={county}
                onChange={(event) => setCounty(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="fp-farm-types">Farm Types</FieldLabel>
              <input
                id="fp-farm-types"
                style={inputStyle}
                value={farmTypes}
                onChange={(event) => setFarmTypes(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="fp-goals">Goals</FieldLabel>
              <input
                id="fp-goals"
                style={inputStyle}
                value={goals}
                onChange={(event) => setGoals(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="fp-acreage">Acreage</FieldLabel>
              <input
                id="fp-acreage"
                style={inputStyle}
                type="number"
                min="0"
                value={acreage}
                onChange={(event) => setAcreage(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="fp-requested-amount">Requested Amount</FieldLabel>
              <input
                id="fp-requested-amount"
                style={inputStyle}
                type="number"
                min="0"
                value={requestedAmount}
                onChange={(event) => setRequestedAmount(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="fp-documents">Supporting Documents</FieldLabel>
              <input
                id="fp-documents"
                style={inputStyle}
                value={documents}
                onChange={(event) => setDocuments(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="fp-purpose">Purpose</FieldLabel>
              <input
                id="fp-purpose"
                style={inputStyle}
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={submitForReview}
            disabled={submitting}
            style={{
              justifySelf: "start",
              ...surface.primaryButton,
              background: submitting
                ? surface.primaryButtonBusyBg
                : surface.primaryButton.background,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Submitting for review..." : "Evaluate Pathways"}
          </button>

          {error ? (
            <div style={surface.errorPanel}>
              {error}
            </div>
          ) : null}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          <div style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: theme.ink }}>Readiness</h2>
            <div
              style={{
                height: 12,
                borderRadius: 999,
                background: surface.meterTrack,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${result.readiness.readinessPercent}%`,
                  background:
                    result.readiness.readinessPercent >= 80
                      ? surface.meterGood
                      : surface.meterWarn,
                }}
              />
            </div>
            <strong style={{ fontSize: 28, color: theme.ink }}>
              {result.readiness.readinessPercent}%
            </strong>
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: theme.ink }}>Missing Items</h3>
              {result.readiness.missingItems.length === 0 ? (
                <p style={{ ...mutedText, margin: 0 }}>
                  Core pathway intake is complete enough for review.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: theme.inkSoft }}>
                  {result.readiness.missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: theme.ink }}>Review Signals</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: theme.inkSoft }}>
                {result.readiness.reviewSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {result.pathways.map((pathway) => (
              <article
                key={pathway.id}
                style={{
                  ...panelStyle,
                  padding: 16,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, color: theme.ink }}>{pathway.label}</h2>
                    <p style={{ ...mutedText, margin: "4px 0 0" }}>
                      Sponsor type: {pathway.sponsorType}
                    </p>
                  </div>
                  <StatusBadge
                    tone={pathway.status === "REVIEW_REQUIRED" ? "review" : "blocked"}
                    text={`${pathway.fitScore}% fit`}
                  />
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: theme.inkSoft }}>
                  {pathway.fitReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    color: theme.inkSoft,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {pathway.blockedClaims.map((claim) => (
                    <span
                      key={claim}
                      style={{
                        ...surface.cell,
                        borderRadius: 999,
                        padding: "4px 8px",
                      }}
                    >
                      No {claim}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: theme.ink }}>Governance Evidence</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 10,
            }}
          >
            <StatusBadge
              tone={result.productionBlocked ? "blocked" : "ready"}
              text="Production blocked"
            />
            <StatusBadge
              tone={result.humanReviewRequired ? "review" : "ready"}
              text="Human review required"
            />
            <StatusBadge tone="blocked" text="Advisory only" />
            <StatusBadge tone="blocked" text="No legal reliance" />
          </div>
          {apiResponse?.governance ? (
            <p style={{ ...mutedText, margin: 0 }}>
              Trace {apiResponse.governance.traceId ?? "pending"} · version
              runtime{" "}
              {apiResponse.governance.versionRuntime?.ok ? "passed" : "pending"} ·
              classification{" "}
              {apiResponse.governance.outputClassification?.classificationLevel ??
                "pending"}
            </p>
          ) : (
            <p style={{ ...mutedText, margin: 0 }}>
              Local preview is shown until the borrower submits the pathway for
              governed API review.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {result.recommendedNextRoutes.map((route) => (
              <Link
                key={route}
                href={route}
                style={surface.link}
              >
                {route}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <h2 style={{ marginTop: 0, fontSize: 22, color: theme.ink }}>Disclosures</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: theme.inkSoft }}>
            {result.disclosures.slice(0, 12).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
