"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  BorrowerOnboardingState,
  FarmType,
  Goal,
  InterestKey,
  borrowerOnboardingInitialState,
  createBorrowerOnboardingWorkflow,
  formatBorrowerOnboardingLabel,
} from "@/lib/borrower/onboardingCore";

/**
 * Core Borrower Onboarding Page
 *
 * Master Volume Governance:
 * - Vol I: preserves borrower clarity, accountability, and governed intake.
 * - Vol II: keeps borrower intake advisory, review-bound, and non-reliance.
 * - Vol III: submits replay-safe onboarding data to the governed API surface.
 * - Vol III-B: exposes runtime, version, classification, and review posture.
 * - Vol IV: supports operator continuity and next-step handoff.
 * - Vol V-VII: enforces disclosure, claims, data-rights, and conformance
 *   boundaries across borrower-facing surfaces.
 */

type OnboardResponse = {
  ok: boolean;
  accepted?: boolean;
  error?: string;
  application?: {
    id?: string;
    status?: string;
    reviewStatus?: string;
    decisionStatus?: string;
  };
  borrowerWorkflow?: ReturnType<typeof createBorrowerOnboardingWorkflow>;
  onboarding?: {
    classification?: {
      classificationLevel?: string;
      sensitivityScope?: string;
    };
  };
  governance?: {
    traceId?: string;
    runtimeGuard?: {
      allowed?: boolean;
    };
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
      confidenceScore?: number;
    };
    observability?: {
      eventType?: string;
      severity?: string;
    };
  };
};

const farmTypeOptions: FarmType[] = [
  "CROPS",
  "LIVESTOCK",
  "POULTRY",
  "DAIRY",
  "BEEF",
  "PIG",
  "ORCHARD",
  "AQUACULTURE",
  "EXOTIC_ANIMALS",
  "EXOTIC_BIRDS",
];

const goalOptions: Goal[] = [
  "PROFIT_MAXIMIZATION",
  "EXPANSION",
  "LAND_ACQUISITION",
  "SUSTAINABILITY",
];

const interestOptions: Array<{
  key: InterestKey;
  label: string;
  detail: string;
}> = [
  {
    key: "financing",
    label: "Financing pathway",
    detail: "Advisory pathways and intake readiness.",
  },
  {
    key: "environmentalReports",
    label: "Environmental intake",
    detail: "Trigger, exemption, and review routing.",
  },
  {
    key: "soilAnalysis",
    label: "Soil and site context",
    detail: "Discovery support, not official certification.",
  },
  {
    key: "vendorRecommendations",
    label: "Equipment and vendors",
    detail: "Marketplace discovery with source limits.",
  },
  {
    key: "commodityIntelligence",
    label: "Market intelligence",
    detail: "Advisory market and revenue context.",
  },
];

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#152033",
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

function formatBoolean(value: boolean | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Pending";
}

function stepIsReady(step: number, state: BorrowerOnboardingState): boolean {
  if (step === 1) return Boolean(state.stage);
  if (step === 2) {
    return Boolean(
      state.location.country.trim() &&
        state.location.state.trim() &&
        state.location.county.trim()
    );
  }
  if (step === 3) return state.farmTypes.length > 0;
  if (step === 4) return state.goals.length > 0;
  if (step === 5) {
    return (
      Number.isFinite(state.acreage) &&
      state.acreage > 0 &&
      Object.values(state.interests).some(Boolean)
    );
  }
  return true;
}

function StatusBadge(props: { tone: "ready" | "review" | "blocked"; text: string }) {
  const tones = {
    ready: { background: "#e7f5ed", color: "#047857" },
    review: { background: "#fff7ed", color: "#9a3412" },
    blocked: { background: "#fff1f0", color: "#b42318" },
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

function FieldLabel(props: { children: string }) {
  return (
    <span
      style={{
        display: "block",
        marginBottom: 6,
        color: "#334155",
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      {props.children}
    </span>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<BorrowerOnboardingState>(
    borrowerOnboardingInitialState
  );
  const [response, setResponse] = useState<OnboardResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workflow = useMemo(
    () => createBorrowerOnboardingWorkflow(state),
    [state]
  );
  const classification =
    response?.governance?.outputClassification ??
    response?.onboarding?.classification;

  function setStage(stage: BorrowerOnboardingState["stage"]) {
    setState((current) => ({ ...current, stage }));
  }

  function updateLocation(
    field: keyof BorrowerOnboardingState["location"],
    value: string
  ) {
    setState((current) => ({
      ...current,
      location: {
        ...current.location,
        [field]: value,
      },
    }));
  }

  function toggleFarmType(type: FarmType) {
    setState((current) => {
      const exists = current.farmTypes.includes(type);

      return {
        ...current,
        farmTypes: exists
          ? current.farmTypes.filter((item) => item !== type)
          : [...current.farmTypes, type],
      };
    });
  }

  function toggleGoal(goal: Goal) {
    setState((current) => {
      const exists = current.goals.includes(goal);

      return {
        ...current,
        goals: exists
          ? current.goals.filter((item) => item !== goal)
          : [...current.goals, goal],
      };
    });
  }

  function toggleInterest(key: InterestKey) {
    setState((current) => ({
      ...current,
      interests: {
        ...current.interests,
        [key]: !current.interests[key],
      },
    }));
  }

  function updateAcreage(value: string) {
    const acreage = Number(value);

    setState((current) => ({
      ...current,
      acreage: Number.isFinite(acreage) ? acreage : 0,
    }));
  }

  async function submitOnboarding() {
    setSubmitting(true);
    setError(null);

    try {
      const borrowerId = "demo-borrower-001";
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "borrower",
          userId: borrowerId,
          borrowerId,
          tenantId: "demo-user-001",
          state,
          metadata: {
            source: "core-borrower-onboarding",
            readinessPercent: workflow.readinessPercent,
            selectedInterestCount: workflow.selectedInterestCount,
            productionBlocked: workflow.productionBlocked,
            humanReviewRequired: workflow.humanReviewRequired,
          },
        }),
      });

      const json = (await res.json()) as OnboardResponse;
      setResponse(json);

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Onboarding runtime returned an error.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unknown onboarding runtime error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        {/*
          Public Alpha Surface Content — Route 6 (Customer Project Intake)
          Source: docs/PUBLIC_ALPHA_SURFACE_CONTENT.md §Route 6
        */}
        <section
          aria-label="Public Alpha customer project intake"
          style={{
            background: "#ffffff",
            border: "1px solid #d7deea",
            borderRadius: 12,
            padding: 28,
            marginBottom: 16,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#162033" }}>
            Tell us about your project
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "#162033", lineHeight: 1.6 }}>
            We ask only what we need to give you advisory guidance. You
            may stop at any time, request deletion, or request human
            review (human review).
          </p>
          <ol style={{ marginTop: 12, paddingLeft: 22, color: "#162033", lineHeight: 1.7 }}>
            <li>What type of business do you own?</li>
            <li>What are you trying to accomplish?</li>
            <li>Where is the property located?</li>
            <li>What type of asset is involved?</li>
          </ol>
          <p style={{ marginTop: 20, fontSize: 13, color: "#5d687a", lineHeight: 1.6 }}>
            This information is advisory only and is not an approval,
            guarantee, or official determination. You may exercise your
            data rights at any time: request an accounting, export,
            deletion, or human review of your information (data-rights).
            Borrowers pay nothing. Free for borrowers. Your information
            belongs to you; Furlong does not secretly submit, sell, or
            distribute your information; no silent submission and no
            information sale.
          </p>
        </section>

        <header
          style={{
            display: "grid",
            gap: 12,
            padding: "14px 0 4px",
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusBadge tone="review" text="Human review pending" />
            <StatusBadge tone="blocked" text="No approval or guarantee" />
            <StatusBadge tone="blocked" text="Production actions blocked" />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 300px)",
              gap: 18,
              alignItems: "end",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <p
                style={{
                  margin: 0,
                  color: "#5d687a",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 0,
                  textTransform: "uppercase",
                }}
              >
                Borrower Portal
              </p>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.12 }}>
                Core Borrower Onboarding
              </h1>
              <p style={{ ...mutedText, margin: 0, maxWidth: 760 }}>
                Start a governed intake record, see what is complete, and move
                into application, document, environmental, opportunity, and
                data-rights workflows without creating approval or reliance.
              </p>
            </div>
            <section style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
              <span style={{ color: "#5d687a", fontSize: 13, fontWeight: 800 }}>
                Intake Readiness
              </span>
              <strong style={{ fontSize: 34, lineHeight: 1 }}>
                {workflow.readinessPercent}%
              </strong>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "#e7edf5",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${workflow.readinessPercent}%`,
                    height: "100%",
                    background: "#0f766e",
                  }}
                />
              </div>
            </section>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "260px minmax(0, 1fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <aside style={{ ...panelStyle, padding: 14, display: "grid", gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStep(item)}
                style={{
                  minHeight: 42,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border:
                    step === item ? "2px solid #0f766e" : "1px solid #d7deea",
                  background: step === item ? "#ecfdf5" : "#ffffff",
                  color: "#172033",
                  textAlign: "left",
                  fontWeight: 800,
                }}
              >
                {item}.{" "}
                {
                  [
                    "Farm stage",
                    "Location",
                    "Operation type",
                    "Goals",
                    "Interests",
                    "Review",
                  ][item - 1]
                }{" "}
                {stepIsReady(item, state) ? " Ready" : ""}
              </button>
            ))}
          </aside>

          <section style={{ ...panelStyle, padding: 18, display: "grid", gap: 16 }}>
            {step === 1 && (
              <div style={{ display: "grid", gap: 14 }}>
                <h2 style={{ margin: 0 }}>Farm Stage</h2>
                <p style={{ ...mutedText, margin: 0 }}>
                  Choose the current operating stage so review teams can
                  understand where the intake should begin.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map(
                    (stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setStage(stage)}
                        style={{
                          minHeight: 44,
                          padding: "0 14px",
                          borderRadius: 6,
                          border:
                            state.stage === stage
                              ? "2px solid #0f766e"
                              : "1px solid #b9c2d0",
                          background:
                            state.stage === stage ? "#ecfdf5" : "#ffffff",
                          color: "#172033",
                          fontWeight: 800,
                        }}
                      >
                        {formatBorrowerOnboardingLabel(stage)}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "grid", gap: 14, maxWidth: 620 }}>
                <h2 style={{ margin: 0 }}>Location</h2>
                <p style={{ ...mutedText, margin: 0 }}>
                  County and state help route environmental, program, and
                  opportunity context. This does not create eligibility.
                </p>
                {(["country", "state", "county"] as const).map((field) => (
                  <label key={field}>
                    <FieldLabel>{formatBorrowerOnboardingLabel(field)}</FieldLabel>
                    <input
                      value={state.location[field]}
                      onChange={(event) =>
                        updateLocation(field, event.target.value)
                      }
                      style={{
                        width: "100%",
                        minHeight: 42,
                        padding: "0 10px",
                        border: "1px solid #b9c2d0",
                        borderRadius: 6,
                      }}
                    />
                  </label>
                ))}
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "grid", gap: 14 }}>
                <h2 style={{ margin: 0 }}>Operation Type</h2>
                <p style={{ ...mutedText, margin: 0 }}>
                  Select all operation types that apply. These are intake
                  signals, not official classifications.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: 10,
                  }}
                >
                  {farmTypeOptions.map((type) => {
                    const selected = state.farmTypes.includes(type);

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleFarmType(type)}
                        style={{
                          minHeight: 46,
                          padding: "0 12px",
                          borderRadius: 6,
                          border: selected
                            ? "2px solid #0f766e"
                            : "1px solid #b9c2d0",
                          background: selected ? "#ecfdf5" : "#ffffff",
                          color: "#172033",
                          fontWeight: 800,
                          textAlign: "left",
                        }}
                      >
                        {formatBorrowerOnboardingLabel(type)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ display: "grid", gap: 14 }}>
                <h2 style={{ margin: 0 }}>Goals</h2>
                <p style={{ ...mutedText, margin: 0 }}>
                  Goals help route advisory pathway guidance and human review.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {goalOptions.map((goal) => {
                    const selected = state.goals.includes(goal);

                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        style={{
                          minHeight: 44,
                          padding: "0 14px",
                          borderRadius: 6,
                          border: selected
                            ? "2px solid #0f766e"
                            : "1px solid #b9c2d0",
                          background: selected ? "#ecfdf5" : "#ffffff",
                          color: "#172033",
                          fontWeight: 800,
                        }}
                      >
                        {formatBorrowerOnboardingLabel(goal)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 5 && (
              <div style={{ display: "grid", gap: 14 }}>
                <h2 style={{ margin: 0 }}>Acreage and Interests</h2>
                <label style={{ maxWidth: 320 }}>
                  <FieldLabel>Acreage</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={state.acreage}
                    onChange={(event) => updateAcreage(event.target.value)}
                    style={{
                      width: "100%",
                      minHeight: 42,
                      padding: "0 10px",
                      border: "1px solid #b9c2d0",
                      borderRadius: 6,
                    }}
                  />
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 10,
                  }}
                >
                  {interestOptions.map((interest) => {
                    const selected = state.interests[interest.key];

                    return (
                      <label
                        key={interest.key}
                        style={{
                          ...panelStyle,
                          minHeight: 104,
                          padding: 14,
                          display: "grid",
                          gap: 8,
                          border: selected
                            ? "2px solid #0f766e"
                            : "1px solid #d7deea",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            fontWeight: 800,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleInterest(interest.key)}
                          />
                          {interest.label}
                        </span>
                        <span style={{ ...mutedText, fontSize: 13 }}>
                          {interest.detail}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 6 && (
              <div style={{ display: "grid", gap: 16 }}>
                <h2 style={{ margin: 0 }}>Review Intake</h2>
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "220px minmax(0, 1fr)",
                    gap: 10,
                    margin: 0,
                  }}
                >
                  <dt>Stage</dt>
                  <dd>{state.stage ? formatBorrowerOnboardingLabel(state.stage) : "Pending"}</dd>
                  <dt>Location</dt>
                  <dd>
                    {state.location.county || "Unknown"},{" "}
                    {state.location.state || "Unknown"},{" "}
                    {state.location.country || "Unknown"}
                  </dd>
                  <dt>Operation Types</dt>
                  <dd>
                    {state.farmTypes.length
                      ? state.farmTypes
                          .map(formatBorrowerOnboardingLabel)
                          .join(", ")
                      : "Pending"}
                  </dd>
                  <dt>Goals</dt>
                  <dd>
                    {state.goals.length
                      ? state.goals.map(formatBorrowerOnboardingLabel).join(", ")
                      : "Pending"}
                  </dd>
                  <dt>Acreage</dt>
                  <dd>{state.acreage || "Pending"}</dd>
                  <dt>Readiness</dt>
                  <dd>{workflow.readinessPercent}%</dd>
                </dl>
                {workflow.missingItems.length > 0 && (
                  <section
                    style={{
                      border: "1px solid #fed7aa",
                      borderRadius: 8,
                      background: "#fff7ed",
                      padding: 14,
                    }}
                  >
                    <strong>More information may be needed.</strong>
                    <p style={{ ...mutedText, margin: "6px 0 0" }}>
                      Missing: {workflow.missingItems.join(", ")}.
                    </p>
                  </section>
                )}
              </div>
            )}

            <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={step === 1}
                style={{ minHeight: 42, padding: "0 14px" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(6, current + 1))}
                disabled={step === 6}
                style={{ minHeight: 42, padding: "0 14px" }}
              >
                Next
              </button>
              <button
                type="button"
                onClick={submitOnboarding}
                disabled={submitting}
                style={{
                  minHeight: 42,
                  padding: "0 16px",
                  border: "1px solid #0f766e",
                  borderRadius: 6,
                  background: "#0f766e",
                  color: "#ffffff",
                  fontWeight: 800,
                }}
              >
                {submitting ? "Submitting..." : "Submit Governed Intake"}
              </button>
            </nav>
          </section>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {workflow.handoffs.map((handoff) => (
            <article
              key={handoff.id}
              style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "start",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 18 }}>{handoff.label}</h3>
                <StatusBadge
                  tone={handoff.status === "complete" ? "ready" : "review"}
                  text={
                    handoff.status === "complete"
                      ? "Ready"
                      : handoff.status === "needs-input"
                        ? "Needs input"
                        : "Review"
                  }
                />
              </div>
              <p style={{ ...mutedText, margin: 0 }}>{handoff.reason}</p>
              <Link href={handoff.route}>Open surface</Link>
            </article>
          ))}
        </section>

        {error && (
          <section
            style={{
              border: "1px solid #fecdd3",
              borderRadius: 8,
              background: "#fff1f2",
              padding: 16,
            }}
          >
            <h2 style={{ margin: 0 }}>Runtime Error</h2>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </section>
        )}

        {response?.ok && (
          <section style={{ ...panelStyle, padding: 18, display: "grid", gap: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Your Intake Was Received</h2>
                <p style={{ ...mutedText, margin: "6px 0 0" }}>
                  Human review is pending. More information may be needed.
                </p>
              </div>
              <StatusBadge tone="ready" text="Runtime accepted" />
            </div>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "240px minmax(0, 1fr)",
                gap: 10,
                margin: 0,
              }}
            >
              <dt>Application ID</dt>
              <dd>{response.application?.id ?? "Pending"}</dd>
              <dt>Application Status</dt>
              <dd>{response.application?.status ?? "Pending"}</dd>
              <dt>Review Status</dt>
              <dd>{response.application?.reviewStatus ?? "Pending"}</dd>
              <dt>Decision Status</dt>
              <dd>{response.application?.decisionStatus ?? "Pending"}</dd>
              <dt>Runtime Guard</dt>
              <dd>{response.governance?.runtimeGuard?.allowed ? "Allowed" : "Pending"}</dd>
              <dt>Version Runtime</dt>
              <dd>{response.governance?.versionRuntime?.ok ? "Valid" : "Pending"}</dd>
              <dt>Replay Safe</dt>
              <dd>{formatBoolean(response.governance?.versionRuntime?.replaySafe)}</dd>
              <dt>Classification</dt>
              <dd>
                {classification?.classificationLevel ?? "Pending"} /{" "}
                {classification?.sensitivityScope ?? "Pending"}
              </dd>
              <dt>Human Review Required</dt>
              <dd>
                {formatBoolean(
                  response.governance?.explainability?.humanReviewRequired
                )}
              </dd>
              <dt>Trace ID</dt>
              <dd>{response.governance?.traceId ?? "Pending"}</dd>
            </dl>
          </section>
        )}

        <section style={{ ...panelStyle, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Required Borrower Disclosures</h2>
          <ul style={{ marginBottom: 0, paddingLeft: 20, lineHeight: 1.7 }}>
            {workflow.disclosures.map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
