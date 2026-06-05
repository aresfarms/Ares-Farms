"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { borrowerOnboardingInitialState } from "@/lib/borrower/onboardingCore";
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

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const containerStyle = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: 24,
  display: "grid",
  gap: 18,
} as const;

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 8,
} as const;

const mutedText = {
  color: "#5d687a",
  lineHeight: 1.5,
} as const;

function StatusBadge(props: {
  tone: "ready" | "review" | "blocked" | "neutral";
  text: string;
}) {
  const tones = {
    ready: { background: "#e7f5ed", color: "#047857" },
    review: { background: "#fff7ed", color: "#9a3412" },
    blocked: { background: "#fff1f0", color: "#b42318" },
    neutral: { background: "#eef2f7", color: "#475569" },
  } as const;
  const tone = tones[props.tone];

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
    <main style={shellStyle}>
      <div style={containerStyle}>
        {/*
          Public Alpha Surface Content — Route 5 (Readiness Review)
          Source: docs/PUBLIC_ALPHA_SURFACE_CONTENT.md §Route 5
        */}
        <section
          aria-label="Public Alpha readiness review"
          style={{
            background: "#ffffff",
            border: "1px solid #d7deea",
            borderRadius: 12,
            padding: 28,
            marginBottom: 16,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#162033" }}>
            Readiness review
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "#162033", lineHeight: 1.6 }}>
            Every readiness assessment is advisory. A named credentialed
            reviewer can review your readiness with you on request
            (human review).
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, color: "#162033" }}>
            Readiness indicators
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "#162033", lineHeight: 1.6 }}>
            The signals we computed about your project, with a plain-English &ldquo;why this matters&rdquo; for each.
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 20, color: "#162033" }}>
            Missing items
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "#162033", lineHeight: 1.6 }}>
            What you still need to provide for a readiness assessment to be complete, each with a plain-English &ldquo;why this matters.&rdquo;
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 20, color: "#162033" }}>
            Documentation recommendations
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "#162033", lineHeight: 1.6 }}>
            Documents we recommend you prepare. Each carries a &ldquo;why this matters&rdquo; sentence.
          </p>
          <p style={{ marginTop: 20, fontSize: 14, color: "#5d687a", lineHeight: 1.6 }}>
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
              <span
                style={{
                  color: "#456077",
                  fontSize: 13,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                Borrower Readiness Assessment
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
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
              <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                Borrower ID
              </span>
              <input
                value={borrowerId}
                onChange={(event) => setBorrowerId(event.target.value)}
                style={{
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                Application ID
              </span>
              <input
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="Optional"
                style={{
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                Documents requested
              </span>
              <input
                type="number"
                min="0"
                value={requestedCount}
                onChange={(event) => setRequestedCount(event.target.value)}
                style={{
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                Documents received
              </span>
              <input
                type="number"
                min="0"
                value={receivedCount}
                onChange={(event) => setReceivedCount(event.target.value)}
                style={{
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                Documents pending review
              </span>
              <input
                type="number"
                min="0"
                value={pendingReviewCount}
                onChange={(event) => setPendingReviewCount(event.target.value)}
                style={{
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                Discovery advisory views
              </span>
              <input
                type="number"
                min="0"
                value={discoveryViews}
                onChange={(event) => setDiscoveryViews(event.target.value)}
                style={{
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
              />
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 22,
                fontSize: 14,
                color: "#334155",
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
                color: "#334155",
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
              minHeight: 42,
              border: 0,
              borderRadius: 6,
              padding: "0 16px",
              background: submitting ? "#94a3b8" : "#1d4ed8",
              color: "#ffffff",
              fontWeight: 800,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting
              ? "Submitting for review..."
              : "Assess Readiness"}
          </button>

          {error ? (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fff1f0",
                color: "#991b1b",
                borderRadius: 8,
                padding: 12,
                fontWeight: 700,
              }}
            >
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
            <h2 style={{ margin: 0, fontSize: 22 }}>Overall Readiness</h2>
            <div
              style={{
                height: 12,
                borderRadius: 999,
                background: "#e2e8f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${assessment.overallReadinessPercent}%`,
                  background:
                    assessment.overallReadinessPercent >= 80
                      ? "#059669"
                      : "#ca8a04",
                }}
              />
            </div>
            <strong style={{ fontSize: 28 }}>
              {assessment.overallReadinessPercent}%
            </strong>
            <p style={{ ...mutedText, margin: 0 }}>
              Operational guidance only. No certification, public verification,
              approval, or regulatory reliance is created or implied.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Missing Items</h3>
              {assessment.missingItems.length === 0 ? (
                <p style={{ ...mutedText, margin: 0 }}>
                  No missing items detected. Continue to human review.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                  {assessment.missingItems.slice(0, 10).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Review Signals</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
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
                    <h2 style={{ margin: 0, fontSize: 20 }}>{section.label}</h2>
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
                    <h3 style={{ margin: "0 0 6px", fontSize: 14 }}>
                      Missing items
                    </h3>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 18,
                        color: "#475569",
                      }}
                    >
                      {section.missingItems.slice(0, 8).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 14 }}>
                    Review signals
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Governance Evidence</h2>
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
                style={{
                  color: "#1d4ed8",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {route}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Disclosures</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
            {assessment.disclosures.slice(0, 14).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
