"use client";

import { useEffect, useMemo, useState } from "react";

import {
  FINANCING_PROGRAMS,
  FINANCING_PURPOSES,
  FinancingIntakeInput,
  FinancingProgramInterest,
  FinancingPurpose,
  evaluateFinancingIntake,
} from "@/lib/financing/intakeRuntime";
import { accentForLane } from "@/lib/property/laneThemes";

/**
 * FinancingIntakePanel — the customer-facing intake for the licensed Financial
 * module. The customer submits a financing deal; it is recorded and routed to
 * an appropriately credentialed lender or external financing spoke that reviews it and follows
 * up. Client component: local readiness preview mirrors the governed route,
 * then submit posts to /api/financing/intake.
 *
 * Master Volume Governance (mirrors src/app/api/financing/intake/route.ts):
 * - CONST-PATHWAY-001 / FACILITATION-001: facilitate, do not decide/qualify.
 * - Section 1071 firewall: no demographic fields exist.
 * - CANON-TREASURY-001 §9.1: fee posture disclosed here. Bright line: Furlong
 *   takes no transaction-tied compensation.
 * - CANON-CONSENT-001 + HITL-GOV-001: consent + human review, recorded.
 */

const PURPLE = accentForLane("financing-capital", "light"); // #534AB7

const panel = {
  border: "1px solid #d7deea",
  borderRadius: 14,
  background: "#ffffff",
  padding: "16px 16px",
  display: "grid",
  gap: 12,
} as const;

const label = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#3b475a",
  marginBottom: 5,
} as const;

const field = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #cfd8e6",
  borderRadius: 9,
  padding: "9px 11px",
  fontSize: 13.5,
  color: "#101a2b",
  background: "#fbfcfe",
};

type SubmitState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | {
      phase: "done";
      serviceRequestId: string;
      nextSteps: string[];
      secureUploadPath: string | null;
      bookingUrl: string | null;
    }
  | { phase: "error"; message: string };

export type FinancingSyntheticFixture = {
  syntheticPersonaId: string;
  humanVisibleName: string;
  testRunId: string;
  fixtureVersion: string;
  environment: string;
  operatorIdentity: string;
  createdAt: string;
  scenarioId: string;
};

export function FinancingIntakePanel({
  syntheticFixture = null,
}: {
  syntheticFixture?: FinancingSyntheticFixture | null;
}) {
  // #lender-intake deep links (0% DOWN callout, report hand-off): the browser's
  // native hash scroll fires before below-fold content loads, so re-anchor
  // after mount (founder-caught 2026-07-29).
  useEffect(() => {
    if (window.location.hash !== "#lender-intake") return;
    const land = () =>
      document
        .getElementById("lender-intake")
        ?.scrollIntoView({ block: "start" });
    land();
    // Content above the panel (rates, program tables) can finish rendering
    // after mount and push the anchor down — re-assert once layout settles.
    const settle = window.setTimeout(land, 700);
    return () => window.clearTimeout(settle);
  }, []);
  const [purpose, setPurpose] = useState<FinancingPurpose | "">("");
  const [programInterest, setProgramInterest] = useState<
    FinancingProgramInterest | ""
  >("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactCity, setContactCity] = useState("");
  const [contactState, setContactState] = useState("");
  const [contactPostalCode, setContactPostalCode] = useState("");
  const [propertyDescriptor, setPropertyDescriptor] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [estimatedProjectCost, setEstimatedProjectCost] = useState("");
  const [scopeSummary, setScopeSummary] = useState("");
  const [timeline, setTimeline] = useState("");
  const [feeAck, setFeeAck] = useState(false);
  const [consentAck, setConsentAck] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ phase: "idle" });

  useEffect(() => {
    if (!syntheticFixture) return;
    setContactName((current) => current || syntheticFixture.humanVisibleName);
    setContactEmail(
      (current) =>
        current || syntheticFixture.operatorIdentity.replace(/^user:/, ""),
    );
  }, [syntheticFixture]);

  const input = useMemo<FinancingIntakeInput>(
    () => ({
      purpose: purpose || null,
      programInterest: programInterest || null,
      contactName,
      contactEmail,
      contactPhone,
      contactAddress,
      contactCity,
      contactState,
      contactPostalCode,
      propertyDescriptor,
      location: { state, county },
      estimatedProjectCost: estimatedProjectCost
        ? Number(estimatedProjectCost)
        : null,
      scopeSummary,
      timeline,
      feeDisclosureAcknowledged: feeAck,
      consentAcknowledged: consentAck,
    }),
    [
      purpose,
      programInterest,
      contactName,
      contactEmail,
      contactPhone,
      contactAddress,
      contactCity,
      contactState,
      contactPostalCode,
      propertyDescriptor,
      state,
      county,
      estimatedProjectCost,
      scopeSummary,
      timeline,
      feeAck,
      consentAck,
    ],
  );

  const preview = useMemo(() => evaluateFinancingIntake(input), [input]);
  const ready = preview.readiness.missingItems.length === 0;

  async function submitDeal() {
    if (!ready) return;
    setSubmit({ phase: "submitting" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch("/api/financing/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Your deal could not be submitted.");
      }
      setSubmit({
        phase: "done",
        serviceRequestId: data.serviceRequestId,
        nextSteps: data.intakeResult?.nextSteps ?? [],
        secureUploadPath:
          typeof data.secureUploadPath === "string"
            ? data.secureUploadPath
            : null,
        bookingUrl:
          typeof data.bookingUrl === "string" ? data.bookingUrl : null,
      });
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "This is taking longer than expected — please try again in a moment."
          : err instanceof Error
            ? err.message
            : "Your deal could not be submitted.";
      setSubmit({ phase: "error", message });
    } finally {
      clearTimeout(timeout);
    }
  }

  if (submit.phase === "done") {
    return (
      <section aria-label="Deal received" style={{ ...panel, gap: 10 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: PURPLE,
          }}
        >
          Deal received
        </span>
        <strong style={{ fontSize: 16, color: "#101a2b" }}>
          Your reference is {submit.serviceRequestId}
        </strong>
        {syntheticFixture ? (
          <span style={{ fontSize: 12, color: "#6d28d9", fontWeight: 800 }}>
            Synthetic test run {syntheticFixture.testRunId} — no real customer
            authority.
          </span>
        ) : null}
        <p
          style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}
        >
          Your deal is recorded in the Furlong Capital Desk. Here&apos;s what happens next:
        </p>
        {submit.secureUploadPath && (
          <a
            href={submit.secureUploadPath}
            style={{
              justifySelf: "start",
              borderRadius: 9,
              padding: "11px 16px",
              background: "#1C2B45",
              color: "#fff",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: 13.5,
            }}
          >
            🔒 Securely upload your documents →
          </a>
        )}
        {submit.secureUploadPath && (
          <p
            style={{
              margin: 0,
              fontSize: 11.5,
              color: "#6B7280",
              lineHeight: 1.55,
            }}
          >
            Financial statements and identification never travel by email here:
            the button opens your deal&apos;s encrypted upload channel —
            single-purpose, expiring, and held inside Furlong&apos;s governed custody until an authorized
            Capital Desk or later consented lender handoff. Bookmark it or return to this page;
            the link stays valid for 72 hours.
          </p>
        )}
        {submit.bookingUrl && (
          <a
            href={submit.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              justifySelf: "start",
              borderRadius: 9,
              padding: "11px 16px",
              background: "#1c5aa0",
              color: "#fff",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: 13.5,
            }}
          >
            📅 Schedule a Capital Desk call →
          </a>
        )}
        {submit.bookingUrl && (
          <p
            style={{
              margin: 0,
              fontSize: 11.5,
              color: "#6B7280",
              lineHeight: 1.55,
            }}
          >
            Booking a time gets you a focused conversation about your deal —
            pick a slot that works instead of playing phone tag.
          </p>
        )}
        <ol
          style={{
            margin: 0,
            paddingLeft: 18,
            color: "#3b475a",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {submit.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <span style={{ fontSize: 11.5, color: "#708997" }}>
          A program fitting your project is not the same as you qualifying — the
          funding lender makes that call, and nothing is committed until you and
          the lender agree.
        </span>
        <a
          href="/status"
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: PURPLE,
            textDecoration: "none",
          }}
        >
          Check your status anytime with this reference →
        </a>
      </section>
    );
  }

  return (
    <section aria-label="Submit your financing deal" style={panel}>
      <div style={{ display: "grid", gap: 4 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: PURPLE,
          }}
        >
          Bring your deal — the Furlong Capital Desk organizes the path
        </span>
        <p
          style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}
        >
          Tell us what you&apos;re trying to finance. We record it in the Furlong Capital Desk,
          organize readiness evidence, and identify appropriate lender/program candidates. Furlong Core
          does not lend, qualify, price, or approve. No lender receives your case from this intake alone;
          a live handoff requires a certified recipient and your exact consent.
        </p>
      </div>

      {syntheticFixture ? (
        <div
          role="status"
          style={{
            border: "2px solid #7c3aed",
            background: "#f5f3ff",
            borderRadius: 10,
            padding: "10px 12px",
            display: "grid",
            gap: 4,
            color: "#4c1d95",
          }}
        >
          <strong>
            SYNTHETIC TEST FIXTURE — {syntheticFixture.humanVisibleName}
          </strong>
          <span style={{ fontSize: 12.5 }}>
            {syntheticFixture.syntheticPersonaId} · {syntheticFixture.testRunId}{" "}
            · {syntheticFixture.scenarioId}
          </span>
          <span style={{ fontSize: 11.5 }}>
            Version {syntheticFixture.fixtureVersion} ·{" "}
            {syntheticFixture.environment} · created{" "}
            {syntheticFixture.createdAt}
          </span>
        </div>
      ) : null}

      <div
        style={{
          background: "#efedfb",
          borderLeft: `3px solid ${PURPLE}`,
          borderRadius: "0 8px 8px 0",
          padding: "9px 12px",
          fontSize: 12,
          color: "#3b3474",
          lineHeight: 1.55,
        }}
      >
        <strong>Fee disclosure:</strong> {preview.feeDisclosure.payerPosture}{" "}
        {preview.feeDisclosure.note}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        <div>
          <label style={label} htmlFor="fin-purpose">
            What is the financing for?
          </label>
          <select
            id="fin-purpose"
            style={field}
            value={purpose}
            onChange={(e) =>
              setPurpose(e.target.value as FinancingPurpose | "")
            }
          >
            <option value="">Select…</option>
            {FINANCING_PURPOSES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={label} htmlFor="fin-program">
            Program you have in mind (optional)
          </label>
          <select
            id="fin-program"
            style={field}
            value={programInterest}
            onChange={(e) =>
              setProgramInterest(
                e.target.value as FinancingProgramInterest | "",
              )
            }
          >
            <option value="">Select…</option>
            {FINANCING_PROGRAMS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        <div>
          <label style={label} htmlFor="fin-name">
            Your name
          </label>
          <input
            id="fin-name"
            style={field}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>
        <div>
          <label style={label} htmlFor="fin-email">
            Contact email
          </label>
          <input
            id="fin-email"
            type="email"
            style={field}
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div>
          <label style={label} htmlFor="fin-phone">
            Phone (optional)
          </label>
          <input
            id="fin-phone"
            style={field}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label style={label} htmlFor="fin-address">
          Your mailing address (optional — useful for later lender paperwork)
        </label>
        <input
          id="fin-address"
          style={field}
          value={contactAddress}
          onChange={(e) => setContactAddress(e.target.value)}
          placeholder="Street address"
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}
      >
        <div>
          <label style={label} htmlFor="fin-city">
            City
          </label>
          <input
            id="fin-city"
            style={field}
            value={contactCity}
            onChange={(e) => setContactCity(e.target.value)}
          />
        </div>
        <div>
          <label style={label} htmlFor="fin-mailing-state">
            State
          </label>
          <input
            id="fin-mailing-state"
            style={field}
            value={contactState}
            onChange={(e) => setContactState(e.target.value)}
          />
        </div>
        <div>
          <label style={label} htmlFor="fin-zip">
            ZIP code
          </label>
          <input
            id="fin-zip"
            style={field}
            value={contactPostalCode}
            onChange={(e) => setContactPostalCode(e.target.value)}
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <label style={label} htmlFor="fin-property">
          The property or business (optional)
        </label>
        <input
          id="fin-property"
          style={field}
          value={propertyDescriptor}
          onChange={(e) => setPropertyDescriptor(e.target.value)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
        }}
      >
        <div>
          <label style={label} htmlFor="fin-state">
            State the property is in
          </label>
          <input
            id="fin-state"
            style={field}
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
        <div>
          <label style={label} htmlFor="fin-county">
            Property county (optional)
          </label>
          <input
            id="fin-county"
            style={field}
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          />
        </div>
        <div>
          <label style={label} htmlFor="fin-cost">
            Estimated project size (optional)
          </label>
          <input
            id="fin-cost"
            type="number"
            min="0"
            style={field}
            value={estimatedProjectCost}
            onChange={(e) => setEstimatedProjectCost(e.target.value)}
            placeholder="$ (context only)"
          />
        </div>
      </div>

      <div>
        <label style={label} htmlFor="fin-scope">
          Tell us about the deal (optional)
        </label>
        <textarea
          id="fin-scope"
          style={{ ...field, minHeight: 64, resize: "vertical" }}
          value={scopeSummary}
          onChange={(e) => setScopeSummary(e.target.value)}
        />
      </div>

      <label
        style={{
          display: "flex",
          gap: 9,
          alignItems: "flex-start",
          fontSize: 12.5,
          color: "#3b475a",
          lineHeight: 1.5,
        }}
      >
        <input
          type="checkbox"
          checked={feeAck}
          onChange={(e) => setFeeAck(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>
          I understand there is no fee to submit, and loan costs are set by the
          lender and disclosed in writing before I commit.
        </span>
      </label>
      <label
        style={{
          display: "flex",
          gap: 9,
          alignItems: "flex-start",
          fontSize: 12.5,
          color: "#3b475a",
          lineHeight: 1.5,
        }}
      >
        <input
          type="checkbox"
          checked={consentAck}
          onChange={(e) => setConsentAck(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>
          I consent to placing my request in the Furlong Capital Desk for readiness review and
          lender-network coordination. I understand this is not a qualification, pre-approval, rate lock,
          lender commitment, or permission to send my information to an outside lender without a later governed handoff.
        </span>
      </label>

      {!ready && (
        <span style={{ fontSize: 11.5, color: "#708997" }}>
          Still needed: {preview.readiness.missingItems.join(" · ")}
        </span>
      )}

      {submit.phase === "error" && (
        <span style={{ fontSize: 12.5, color: "#b42318" }}>
          {submit.message}
        </span>
      )}

      <button
        type="button"
        onClick={submitDeal}
        disabled={!ready || submit.phase === "submitting"}
        style={{
          justifySelf: "start",
          border: "none",
          borderRadius: 10,
          padding: "10px 18px",
          fontSize: 13.5,
          fontWeight: 700,
          color: "#ffffff",
          background: ready ? PURPLE : "#a7a3cf",
          cursor:
            ready && submit.phase !== "submitting" ? "pointer" : "default",
        }}
      >
        {submit.phase === "submitting" ? "Submitting…" : "Submit my deal"}
      </button>
    </section>
  );
}
