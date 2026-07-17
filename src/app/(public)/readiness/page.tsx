"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { borrowerOnboardingInitialState } from "@/lib/borrower/onboardingCore";
import { chartSurface } from "@/lib/property/chartThemes";
import {
  ReadinessAssessmentInput,
  ReadinessAssessmentResult,
  ReadinessSection,
  ReadinessSectionStatus,
  assessBorrowerReadiness,
} from "@/lib/readiness/readinessAssessment";

/**
 * Borrower Readiness Assessment Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable borrower readiness state.
 * - Vol II: blocks readiness state from becoming approval, certification,
 *   eligibility, public verification, or regulatory reliance.
 * - Vol III: uses deterministic backend-compatible readiness aggregation.
 * - Vol III-B: displays human-review and production-block posture.
 * - Vol IV: routes borrower next steps to onboarding, financing, document,
 *   environmental, discovery, and data-rights workflows.
 * - Vol V-VII: preserves public-surface disclosures, source authority,
 *   conformance, and no-live-action boundaries.
 * Build 50 — moved to (public) group. Shell removed; layout provides background, font, and minHeight.
 *
 * Chart Table cohesion rollout (founder 2026-07-17): the page sits on the
 * navigator stage via chartSurface("buyer") — shared tokens, presentation only.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  assessment?: ReadinessAssessmentResult;
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

const surface = chartSurface("buyer");
const theme = surface.theme;

const containerStyle = surface.container;
const panelStyle = surface.panel;
const mutedText = surface.muted;
const inputStyle = surface.input;
const fieldLabelStyle = { fontSize: 14, fontWeight: 700, color: theme.inkSoft } as const;

function StatusBadge(props: {
  tone: "ready" | "review" | "blocked" | "neutral";
  text: string;
}) {
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

function statusBadgeTone(
  status: ReadinessSectionStatus
): "ready" | "review" | "blocked" | "neutral" {
  if (status === "READY_FOR_REVIEW") {
    return "ready";
  }

  if (status === "AWAITING_REVIEW") {
    return "review";
  }

  if (status === "NEEDS_INPUT") {
    return "blocked";
  }

  return "neutral";
}

function statusLabel(status: ReadinessSectionStatus): string {
  if (status === "READY_FOR_REVIEW") {
    return "Ready for review";
  }

  if (status === "AWAITING_REVIEW") {
    return "Awaiting human review";
  }

  if (status === "NEEDS_INPUT") {
    return "Needs borrower input";
  }

  return "Not started";
}

const initialInput: ReadinessAssessmentInput = {
  borrowerId: "borrower-demo",
  applicationId: "",
  onboarding: {
    ...borrowerOnboardingInitialState,
    stage: "INTERMEDIATE",
    location: {
      country: "US",
      state: "MD",
      county: "Queen Anne's",
    },
    farmTypes: ["CROPS"],
    goals: ["EXPANSION", "SUSTAINABILITY"],
    acreage: 120,
    interests: {
      ...borrowerOnboardingInitialState.interests,
      financing: true,
      environmentalReports: true,
    },
  },
  financing: {
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
    documents: ["identity", "entity", "property/control"],
    metadata: {
      purpose: "Expansion and working capital planning",
    },
  },
  documents: {
    requestedCount: 4,
    receivedCount: 3,
    pendingReviewCount: 2,
  },
  environmental: {
    triggerReviewRequested: false,
    exemptionReviewRequested: false,
    intakeSubmitted: false,
  },
  discovery: {
    interestsSelected: 1,
    advisoryViews: 0,
  },
  dataRights: {
    portabilityRequested: false,
    accessRequestSubmitted: false,
  },
};

export default function ReadinessAssessmentPage() {
  const [borrowerId, setBorrowerId] = useState(initialInput.borrowerId ?? "");
  const [applicationId, setApplicationId] = useState(
    initialInput.applicationId ?? ""
  );
  const [requestedCount, setRequestedCount] = useState(
    String(initialInput.documents?.requestedCount ?? 0)
  );
  const [receivedCount, setReceivedCount] = useState(
    String(initialInput.documents?.receivedCount ?? 0)
  );
  const [pendingReviewCount, setPendingReviewCount] = useState(
    String(initialInput.documents?.pendingReviewCount ?? 0)
  );
  const [environmentalIntakeSubmitted, setEnvironmentalIntakeSubmitted] =
    useState(Boolean(initialInput.environmental?.intakeSubmitted));
  const [discoveryViews, setDiscoveryViews] = useState(
    String(initialInput.discovery?.advisoryViews ?? 0)
  );
  const [portabilityRequested, setPortabilityRequested] = useState(
    Boolean(initialInput.dataRights?.portabilityRequested)
  );
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<ReadinessAssessmentInput>(
    () => ({
      ...initialInput,
      borrowerId,
      applicationId,
      documents: {
        requestedCount: Number(requestedCount) || 0,
        receivedCount: Number(receivedCount) || 0,
        pendingReviewCount: Number(pendingReviewCount) || 0,
      },
      environmental: {
        ...initialInput.environmental,
        intakeSubmitted: environmentalIntakeSubmitted,
      },
      discovery: {
        ...initialInput.discovery,
        advisoryViews: Number(discoveryViews) || 0,
      },
      dataRights: {
        ...initialInput.dataRights,
        portabilityRequested,
      },
    }),
    [
      applicationId,
      borrowerId,
      discoveryViews,
      environmentalIntakeSubmitted,
      pendingReviewCount,
      portabilityRequested,
      receivedCount,
      requestedCount,
    ]
  );

  const localAssessment = useMemo(() => assessBorrowerReadiness(input), [input]);
  const assessment = apiResponse?.assessment ?? localAssessment;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/readiness", {
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
        throw new Error(data.error ?? "Readiness assessment request failed.");
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown readiness assessment request error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <div style={containerStyle}>
        {/*
          Public Alpha Surface Content — Route 5 (Readiness Review)
          Source: docs/PUBLIC_ALPHA_SURFACE_CONTENT.md §Route 5
        */}
        <section
          aria-label="Public Alpha readiness review"
          style={{
            ...panelStyle,
            padding: 28,
            marginBottom: 16,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: theme.ink }}>
            Readiness review
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: theme.inkSoft, lineHeight: 1.6 }}>
            Every readiness assessment is advisory. A named credentialed
            reviewer can review your readiness with you on request
            (human review).
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, color: theme.ink }}>
            Readiness indicators
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: theme.inkSoft, lineHeight: 1.6 }}>
            The signals we computed about your project, with a plain-English &ldquo;why this matters&rdquo; for each.
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 20, color: theme.ink }}>
            Missing items
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: theme.inkSoft, lineHeight: 1.6 }}>
            What you still need to provide for a readiness assessment to be complete, each with a plain-English &ldquo;why this matters.&rdquo;
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 20, color: theme.ink }}>
            Documentation recommendations
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: theme.inkSoft, lineHeight: 1.6 }}>
            Documents we recommend you prepare. Each carries a &ldquo;why this matters&rdquo; sentence.
          </p>
          <p style={{ marginTop: 20, fontSize: 14, color: theme.inkFaint, lineHeight: 1.6 }}>
            This information is advisory only and is not an approval,
            guarantee, or official determination. No legal, regulatory,
            or official reliance may be placed on this information. You
            may request an accounting, export, deletion, or human
            review of your information at any time (data-rights).
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
                Borrower Readiness Assessment
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, color: theme.ink }}>
                Readiness Assessment
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Review-bound readiness snapshot for borrower planning. This
                surface is operational guidance only and does not certify,
                verify, approve, qualify, or authorize legal or regulatory
                reliance.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="No certification" />
              <StatusBadge tone="blocked" text="No public verification" />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>
                Borrower ID
              </span>
              <input
                value={borrowerId}
                onChange={(event) => setBorrowerId(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>
                Application ID
              </span>
              <input
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>
                Documents requested
              </span>
              <input
                type="number"
                min="0"
                value={requestedCount}
                onChange={(event) => setRequestedCount(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>
                Documents received
              </span>
              <input
                type="number"
                min="0"
                value={receivedCount}
                onChange={(event) => setReceivedCount(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>
                Documents pending review
              </span>
              <input
                type="number"
                min="0"
                value={pendingReviewCount}
                onChange={(event) => setPendingReviewCount(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>
                Discovery advisory views
              </span>
              <input
                type="number"
                min="0"
                value={discoveryViews}
                onChange={(event) => setDiscoveryViews(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 22,
                fontSize: 14,
                color: theme.inkSoft,
              }}
            >
              <input
                type="checkbox"
                checked={environmentalIntakeSubmitted}
                onChange={(event) =>
                  setEnvironmentalIntakeSubmitted(event.target.checked)
                }
              />
              Environmental intake submitted
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 22,
                fontSize: 14,
                color: theme.inkSoft,
              }}
            >
              <input
                type="checkbox"
                checked={portabilityRequested}
                onChange={(event) =>
                  setPortabilityRequested(event.target.checked)
                }
              />
              Data rights portability requested
            </label>
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
            {submitting
              ? "Submitting for review..."
              : "Assess Readiness"}
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
            <h2 style={{ margin: 0, fontSize: 22, color: theme.ink }}>Overall Readiness</h2>
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
                  width: `${assessment.overallReadinessPercent}%`,
                  background:
                    assessment.overallReadinessPercent >= 80
                      ? surface.meterGood
                      : surface.meterWarn,
                }}
              />
            </div>
            <strong style={{ fontSize: 28, color: theme.ink }}>
              {assessment.overallReadinessPercent}%
            </strong>
            <p style={{ ...mutedText, margin: 0 }}>
              Operational guidance only. No certification, public verification,
              approval, or regulatory reliance is created or implied.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: theme.ink }}>Missing Items</h3>
              {assessment.missingItems.length === 0 ? (
                <p style={{ ...mutedText, margin: 0 }}>
                  No missing items detected. Continue to human review.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: theme.inkSoft }}>
                  {assessment.missingItems.slice(0, 10).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: theme.ink }}>Review Signals</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: theme.inkSoft }}>
                {assessment.reviewSignals.slice(0, 6).map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {assessment.sections.map((section: ReadinessSection) => (
              <article
                key={section.id}
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
                    <h2 style={{ margin: 0, fontSize: 20, color: theme.ink }}>{section.label}</h2>
                    <p style={{ ...mutedText, margin: "4px 0 0" }}>
                      Next step: {section.nextRoute}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <StatusBadge
                      tone={statusBadgeTone(section.status)}
                      text={statusLabel(section.status)}
                    />
                    <StatusBadge
                      tone="neutral"
                      text={`${section.readinessPercent}%`}
                    />
                  </div>
                </div>
                {section.missingItems.length > 0 ? (
                  <div>
                    <h3 style={{ margin: "0 0 6px", fontSize: 14, color: theme.ink }}>
                      Missing items
                    </h3>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 18,
                        color: theme.inkSoft,
                      }}
                    >
                      {section.missingItems.slice(0, 8).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 14, color: theme.ink }}>
                    Review signals
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 18, color: theme.inkSoft }}>
                    {section.reviewSignals.slice(0, 4).map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
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
              tone={assessment.productionBlocked ? "blocked" : "ready"}
              text="Production blocked"
            />
            <StatusBadge
              tone={assessment.humanReviewRequired ? "review" : "ready"}
              text="Human review required"
            />
            <StatusBadge tone="blocked" text="Advisory only" />
            <StatusBadge tone="blocked" text="No legal reliance" />
            <StatusBadge tone="blocked" text="No certification" />
            <StatusBadge tone="blocked" text="No public verification" />
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
              Local preview is shown until the borrower submits the readiness
              assessment for governed API review.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {assessment.recommendedNextRoutes.map((route) => (
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
            {assessment.disclosures.slice(0, 14).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
