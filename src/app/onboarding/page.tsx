"use client";

import { useMemo, useState } from "react";

/**
 * Borrower Onboarding Page
 *
 * Master Volume Governance:
 * - Vol I: preserves borrower clarity, accessibility, and governed intake.
 * - Vol II: keeps intake context suitable for regulated review.
 * - Vol III: submits replay-safe onboarding data to the governed API surface.
 * - Vol IV: supports operator review, escalation, and continuity workflows.
 * - Vol V: surfaces classification, consent, explainability, observability,
 *   and version lineage returned by the runtime.
 */

type FarmType =
  | "CROPS"
  | "LIVESTOCK"
  | "POULTRY"
  | "DAIRY"
  | "BEEF"
  | "PIG"
  | "ORCHARD"
  | "AQUACULTURE"
  | "EXOTIC_ANIMALS"
  | "EXOTIC_BIRDS";

type Goal =
  | "PROFIT_MAXIMIZATION"
  | "EXPANSION"
  | "LAND_ACQUISITION"
  | "SUSTAINABILITY";

type InterestKey =
  | "soilAnalysis"
  | "environmentalReports"
  | "financing"
  | "vendorRecommendations"
  | "commodityIntelligence";

type OnboardingState = {
  stage: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "";
  location: {
    country: string;
    state: string;
    county: string;
  };
  farmTypes: FarmType[];
  goals: Goal[];
  acreage: number;
  interests: Record<InterestKey, boolean>;
};

type OnboardResponse = {
  ok: boolean;
  accepted?: boolean;
  error?: string;
  onboarding?: {
    tenantId?: string;
    state?: OnboardingState;
    classification?: {
      classificationLevel?: string;
      sensitivityScope?: string;
      sharingPermissions?: string[];
      exportRestrictions?: string[];
      consentRequirements?: string[];
      replayClassificationContext?: {
        replayRef?: string;
      };
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
    classification?: {
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
      anomalyCandidate?: boolean;
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
}> = [
  { key: "soilAnalysis", label: "Soil analysis" },
  { key: "environmentalReports", label: "Environmental reports" },
  { key: "financing", label: "Financing" },
  { key: "vendorRecommendations", label: "Vendor recommendations" },
  { key: "commodityIntelligence", label: "Commodity intelligence" },
];

const initialState: OnboardingState = {
  stage: "",
  location: {
    country: "US",
    state: "MD",
    county: "",
  },
  farmTypes: [],
  goals: [],
  acreage: 0,
  interests: {
    soilAnalysis: false,
    environmentalReports: false,
    financing: true,
    vendorRecommendations: false,
    commodityIntelligence: false,
  },
};

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatBoolean(value: boolean | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Pending";
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>(initialState);
  const [response, setResponse] = useState<OnboardResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedInterestCount = useMemo(() => {
    return Object.values(state.interests).filter(Boolean).length;
  }, [state.interests]);

  function setStage(stage: OnboardingState["stage"]) {
    setState((current) => ({
      ...current,
      stage,
    }));
  }

  function updateLocation(field: keyof OnboardingState["location"], value: string) {
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
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: "demo-user-001",
          state,
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

  const governance = response?.governance;
  const classification =
    response?.onboarding?.classification ?? governance?.classification;

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        display: "grid",
        gap: 20,
        maxWidth: 1040,
      }}
    >
      <header>
        <h1>Farm Onboarding</h1>
        <p>Step {step} of 6</p>
      </header>

      <section>
        {step === 1 && (
          <div style={{ display: "grid", gap: 12 }}>
            <h2>Farm Stage</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map(
                (stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setStage(stage)}
                    style={{
                      padding: "10px 14px",
                      border:
                        state.stage === stage
                          ? "2px solid #0f766e"
                          : "1px solid #9ca3af",
                      background: state.stage === stage ? "#ccfbf1" : "#fff",
                    }}
                  >
                    {formatLabel(stage)}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            <h2>Location</h2>
            <label>
              Country
              <input
                value={state.location.country}
                onChange={(event) =>
                  updateLocation("country", event.target.value)
                }
                style={{ display: "block", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              State
              <input
                value={state.location.state}
                onChange={(event) => updateLocation("state", event.target.value)}
                style={{ display: "block", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              County
              <input
                value={state.location.county}
                onChange={(event) => updateLocation("county", event.target.value)}
                style={{ display: "block", marginTop: 4, padding: 8 }}
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "grid", gap: 12 }}>
            <h2>Farm Types</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {farmTypeOptions.map((type) => {
                const selected = state.farmTypes.includes(type);

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleFarmType(type)}
                    style={{
                      padding: "10px 14px",
                      border: selected
                        ? "2px solid #0f766e"
                        : "1px solid #9ca3af",
                      background: selected ? "#ccfbf1" : "#fff",
                    }}
                  >
                    {formatLabel(type)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "grid", gap: 12 }}>
            <h2>Goals</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {goalOptions.map((goal) => {
                const selected = state.goals.includes(goal);

                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    style={{
                      padding: "10px 14px",
                      border: selected
                        ? "2px solid #0f766e"
                        : "1px solid #9ca3af",
                      background: selected ? "#ccfbf1" : "#fff",
                    }}
                  >
                    {formatLabel(goal)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            <h2>Acreage and Interests</h2>
            <label>
              Acreage
              <input
                type="number"
                value={state.acreage}
                onChange={(event) => updateAcreage(event.target.value)}
                style={{ display: "block", marginTop: 4, padding: 8 }}
              />
            </label>
            <fieldset
              style={{
                border: "1px solid #d0d7de",
                padding: 12,
              }}
            >
              <legend>Service interests</legend>
              <div style={{ display: "grid", gap: 8 }}>
                {interestOptions.map((interest) => (
                  <label key={interest.key}>
                    <input
                      type="checkbox"
                      checked={state.interests[interest.key]}
                      onChange={() => toggleInterest(interest.key)}
                    />{" "}
                    {interest.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 6 && (
          <div style={{ display: "grid", gap: 12 }}>
            <h2>Review Intake</h2>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: 8,
                margin: 0,
              }}
            >
              <dt>Stage</dt>
              <dd>{state.stage ? formatLabel(state.stage) : "Pending"}</dd>

              <dt>Location</dt>
              <dd>
                {state.location.county || "Unknown"},{" "}
                {state.location.state || "Unknown"},{" "}
                {state.location.country || "Unknown"}
              </dd>

              <dt>Farm Types</dt>
              <dd>
                {state.farmTypes.length
                  ? state.farmTypes.map(formatLabel).join(", ")
                  : "Pending"}
              </dd>

              <dt>Goals</dt>
              <dd>
                {state.goals.length
                  ? state.goals.map(formatLabel).join(", ")
                  : "Pending"}
              </dd>

              <dt>Acreage</dt>
              <dd>{state.acreage}</dd>

              <dt>Selected Interests</dt>
              <dd>{selectedInterestCount}</dd>
            </dl>
          </div>
        )}
      </section>

      <nav style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1}
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setStep((current) => Math.min(6, current + 1))}
          disabled={step === 6}
        >
          Next
        </button>
        <button
          type="button"
          onClick={submitOnboarding}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Intake"}
        </button>
      </nav>

      {error && (
        <section>
          <h2>Runtime Error</h2>
          <p>{error}</p>
        </section>
      )}

      {response?.ok && (
        <section>
          <h2>Governed Intake Result</h2>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: 8,
              margin: 0,
            }}
          >
            <dt>Accepted</dt>
            <dd>{formatBoolean(response.accepted)}</dd>

            <dt>Runtime Guard</dt>
            <dd>{governance?.runtimeGuard?.allowed ? "Allowed" : "Pending"}</dd>

            <dt>Version Runtime</dt>
            <dd>{governance?.versionRuntime?.ok ? "Valid" : "Pending"}</dd>

            <dt>Replay Safe</dt>
            <dd>{formatBoolean(governance?.versionRuntime?.replaySafe)}</dd>

            <dt>Classification</dt>
            <dd>
              {classification?.classificationLevel ?? "Pending"} /{" "}
              {classification?.sensitivityScope ?? "Pending"}
            </dd>

            <dt>Human Review Required</dt>
            <dd>
              {formatBoolean(governance?.explainability?.humanReviewRequired)}
            </dd>

            <dt>Observability</dt>
            <dd>
              {governance?.observability?.eventType ?? "Pending"} /{" "}
              {governance?.observability?.severity ?? "Pending"}
            </dd>

            <dt>Trace ID</dt>
            <dd>{governance?.traceId ?? "Pending"}</dd>
          </dl>
        </section>
      )}
    </main>
  );
}
