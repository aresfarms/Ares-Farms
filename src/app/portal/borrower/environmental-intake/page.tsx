"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  EnvironmentalIntakeInput,
  EnvironmentalIntakeResult,
  evaluateEnvironmentalIntake,
} from "@/lib/environmental/intakeRuntime";
import { chartSurface } from "@/lib/property/chartThemes";

/**
 * Borrower Environmental Intake Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable borrower environmental intake routing.
 * - Vol II: blocks intake from becoming an environmental determination,
 *   clearance, permit, lender commitment, legal advice, or regulatory
 *   reliance.
 * - Vol III: uses deterministic backend-compatible intake routing.
 * - Vol III-B: displays human-review, fee-disclosure, spoke-isolation, and
 *   production-block posture.
 * - Vol IV: routes borrower next steps to Module 21 environmental review,
 *   documents, applications, readiness, and data rights.
 * - Vol V-VII: preserves public-surface disclosures, source authority,
 *   conformance, provider-license boundaries, and no-live-action posture.
 *
 * Chart Table cohesion rollout (founder 2026-07-17): the intake sits on the
 * surveyor-green stage via chartSurface("environmental") — shared tokens,
 * presentation only; intake routing and copy unchanged.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  intakeResult?: EnvironmentalIntakeResult;
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

const surface = chartSurface("environmental");
const theme = surface.theme;

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const containerStyle = {
  ...surface.container,
  margin: "24px auto",
} as const;

const panelStyle = surface.panel;
const mutedText = surface.muted;
const inputStyle = surface.input;

function FieldLabel(props: { children: string }) {
  return (
    <span
      style={{
        display: "block",
        marginBottom: 6,
        ...surface.label,
      }}
    >
      {props.children}
    </span>
  );
}

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

function YesNoSelect(props: {
  value: boolean | null;
  onChange: (next: boolean | null) => void;
}) {
  const stringValue =
    props.value === true ? "true" : props.value === false ? "false" : "";

  return (
    <select
      value={stringValue}
      onChange={(event) => {
        if (event.target.value === "true") {
          props.onChange(true);
        } else if (event.target.value === "false") {
          props.onChange(false);
        } else {
          props.onChange(null);
        }
      }}
      style={inputStyle}
    >
      <option value="">Select…</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );
}

const initialInput: EnvironmentalIntakeInput = {
  borrowerId: "borrower-demo",
  applicationId: "",
  location: {
    country: "US",
    state: "MD",
    county: "Queen Anne's",
  },
  realPropertyCollateral: true,
  federalFundingTrigger: false,
  federalActionInvolvement: false,
  stateEnvironmentalActJurisdiction: false,
  knownEnvironmentalStatuteTrigger: false,
  knownContaminationConcern: false,
  protectedHabitatProximity: false,
  wetlandsOrFloodplainProximity: false,
  equipmentAssetValue: 0,
  requestExemptionEvaluation: false,
  borrowerExternalFirmInterest: false,
  feeDisclosureAcknowledged: false,
};

export default function BorrowerEnvironmentalIntakePage() {
  const [borrowerId, setBorrowerId] = useState(initialInput.borrowerId ?? "");
  const [applicationId, setApplicationId] = useState(
    initialInput.applicationId ?? ""
  );
  const [stateCode, setStateCode] = useState(
    initialInput.location?.state ?? ""
  );
  const [county, setCounty] = useState(initialInput.location?.county ?? "");
  const [realPropertyCollateral, setRealPropertyCollateral] = useState<
    boolean | null
  >(initialInput.realPropertyCollateral ?? null);
  const [federalFundingTrigger, setFederalFundingTrigger] = useState<
    boolean | null
  >(initialInput.federalFundingTrigger ?? null);
  const [federalActionInvolvement, setFederalActionInvolvement] = useState<
    boolean | null
  >(initialInput.federalActionInvolvement ?? null);
  const [stateEnvironmentalActJurisdiction, setStateAct] = useState<
    boolean | null
  >(initialInput.stateEnvironmentalActJurisdiction ?? null);
  const [knownStatuteTrigger, setKnownStatuteTrigger] = useState<
    boolean | null
  >(initialInput.knownEnvironmentalStatuteTrigger ?? null);
  const [knownContamination, setKnownContamination] = useState<boolean | null>(
    initialInput.knownContaminationConcern ?? null
  );
  const [protectedHabitat, setProtectedHabitat] = useState<boolean | null>(
    initialInput.protectedHabitatProximity ?? null
  );
  const [wetlands, setWetlands] = useState<boolean | null>(
    initialInput.wetlandsOrFloodplainProximity ?? null
  );
  const [equipmentAssetValue, setEquipmentAssetValue] = useState(
    String(initialInput.equipmentAssetValue ?? 0)
  );
  const [requestExemption, setRequestExemption] = useState<boolean | null>(
    initialInput.requestExemptionEvaluation ?? null
  );
  const [externalFirmInterest, setExternalFirmInterest] = useState<
    boolean | null
  >(initialInput.borrowerExternalFirmInterest ?? null);
  const [feeAcknowledged, setFeeAcknowledged] = useState<boolean>(
    Boolean(initialInput.feeDisclosureAcknowledged)
  );
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<EnvironmentalIntakeInput>(
    () => ({
      borrowerId,
      applicationId,
      location: {
        country: "US",
        state: stateCode,
        county,
      },
      realPropertyCollateral,
      federalFundingTrigger,
      federalActionInvolvement,
      stateEnvironmentalActJurisdiction,
      knownEnvironmentalStatuteTrigger: knownStatuteTrigger,
      knownContaminationConcern: knownContamination,
      protectedHabitatProximity: protectedHabitat,
      wetlandsOrFloodplainProximity: wetlands,
      equipmentAssetValue: Number(equipmentAssetValue) || 0,
      requestExemptionEvaluation: requestExemption,
      borrowerExternalFirmInterest: externalFirmInterest,
      feeDisclosureAcknowledged: feeAcknowledged,
    }),
    [
      applicationId,
      borrowerId,
      county,
      equipmentAssetValue,
      externalFirmInterest,
      federalActionInvolvement,
      federalFundingTrigger,
      feeAcknowledged,
      knownContamination,
      knownStatuteTrigger,
      protectedHabitat,
      requestExemption,
      realPropertyCollateral,
      stateCode,
      stateEnvironmentalActJurisdiction,
      wetlands,
    ]
  );

  const localResult = useMemo(
    () => evaluateEnvironmentalIntake(input),
    [input]
  );
  const result = apiResponse?.intakeResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/environmental/intake", {
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
        throw new Error(
          data.error ?? "Environmental intake request failed."
        );
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown environmental intake request error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
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
                Borrower Environmental Intake
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, color: theme.ink }}>
                Environmental Intake
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Review-bound environmental intake for borrower planning. This
                surface collects environmental context and routes
                trigger/exemption posture for human review only. It does not
                create an environmental determination, clearance, permit, or
                provider engagement.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="No clearance" />
              <StatusBadge tone="blocked" text="No provider engagement" />
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
              <FieldLabel>Borrower ID</FieldLabel>
              <input
                style={inputStyle}
                value={borrowerId}
                onChange={(event) => setBorrowerId(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Application ID</FieldLabel>
              <input
                style={inputStyle}
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <FieldLabel>State</FieldLabel>
              <input
                style={inputStyle}
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>County</FieldLabel>
              <input
                style={inputStyle}
                value={county}
                onChange={(event) => setCounty(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Real property collateral involved?</FieldLabel>
              <YesNoSelect
                value={realPropertyCollateral}
                onChange={setRealPropertyCollateral}
              />
            </div>
            <div>
              <FieldLabel>Federal funding involved?</FieldLabel>
              <YesNoSelect
                value={federalFundingTrigger}
                onChange={setFederalFundingTrigger}
              />
            </div>
            <div>
              <FieldLabel>Federal action involvement?</FieldLabel>
              <YesNoSelect
                value={federalActionInvolvement}
                onChange={setFederalActionInvolvement}
              />
            </div>
            <div>
              <FieldLabel>State environmental act jurisdiction?</FieldLabel>
              <YesNoSelect
                value={stateEnvironmentalActJurisdiction}
                onChange={setStateAct}
              />
            </div>
            <div>
              <FieldLabel>Known environmental statute trigger?</FieldLabel>
              <YesNoSelect
                value={knownStatuteTrigger}
                onChange={setKnownStatuteTrigger}
              />
            </div>
            <div>
              <FieldLabel>Known contamination concern?</FieldLabel>
              <YesNoSelect
                value={knownContamination}
                onChange={setKnownContamination}
              />
            </div>
            <div>
              <FieldLabel>Protected habitat proximity?</FieldLabel>
              <YesNoSelect
                value={protectedHabitat}
                onChange={setProtectedHabitat}
              />
            </div>
            <div>
              <FieldLabel>Wetlands or floodplain proximity?</FieldLabel>
              <YesNoSelect value={wetlands} onChange={setWetlands} />
            </div>
            <div>
              <FieldLabel>Equipment asset value (USD)</FieldLabel>
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={equipmentAssetValue}
                onChange={(event) =>
                  setEquipmentAssetValue(event.target.value)
                }
              />
            </div>
            <div>
              <FieldLabel>Request exemption pathway evaluation?</FieldLabel>
              <YesNoSelect
                value={requestExemption}
                onChange={setRequestExemption}
              />
            </div>
            <div>
              <FieldLabel>Interest in approved external firm?</FieldLabel>
              <YesNoSelect
                value={externalFirmInterest}
                onChange={setExternalFirmInterest}
              />
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 26,
                fontSize: 14,
                color: theme.inkSoft,
              }}
            >
              <input
                type="checkbox"
                checked={feeAcknowledged}
                onChange={(event) => setFeeAcknowledged(event.target.checked)}
              />
              I acknowledge provider fee disclosure boundaries.
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
              : "Submit Environmental Intake"}
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
            <h2 style={{ margin: 0, fontSize: 22, color: theme.ink }}>Intake Readiness</h2>
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
              <h3 style={{ margin: 0, fontSize: 15, color: theme.ink }}>Assessment Route</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <StatusBadge tone="review" text={result.assessmentRoute} />
                <StatusBadge tone="neutral" text={result.pathwayPosture} />
              </div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: theme.ink }}>Missing Items</h3>
              {result.readiness.missingItems.length === 0 ? (
                <p style={{ ...mutedText, margin: 0 }}>
                  Core intake fields are ready for review.
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
                {result.readiness.reviewSignals.slice(0, 8).map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <article
              style={{
                ...panelStyle,
                padding: 16,
                display: "grid",
                gap: 8,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, color: theme.ink }}>Trigger Signals</h2>
              {result.triggerSignals.length === 0 ? (
                <p style={{ ...mutedText, margin: 0 }}>
                  No trigger signals disclosed.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: theme.inkSoft }}>
                  {result.triggerSignals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              )}
            </article>
            <article
              style={{
                ...panelStyle,
                padding: 16,
                display: "grid",
                gap: 8,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, color: theme.ink }}>Exemption Candidates</h2>
              {result.exemptionCandidates.length === 0 ? (
                <p style={{ ...mutedText, margin: 0 }}>
                  No exemption candidates identified for the disclosed context.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: theme.inkSoft }}>
                  {result.exemptionCandidates.map((candidate) => (
                    <li key={candidate}>{candidate}</li>
                  ))}
                </ul>
              )}
            </article>
            <article
              style={{
                ...panelStyle,
                padding: 16,
                display: "grid",
                gap: 8,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, color: theme.ink }}>Blocked Claims</h2>
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
                {result.blockedClaims.map((claim) => (
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
            <StatusBadge tone="blocked" text="No clearance" />
            <StatusBadge tone="blocked" text="No provider engagement" />
            <StatusBadge tone="blocked" text="Banker spoke isolated" />
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
              Local preview is shown until the borrower submits the intake for
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
            {result.disclosures.slice(0, 14).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
