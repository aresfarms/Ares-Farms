"use client";

import { useMemo, useState } from "react";

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
 * the licensed lender (Stuart / the lending spoke) who reviews it and follows
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
  | { phase: "done"; serviceRequestId: string; nextSteps: string[] }
  | { phase: "error"; message: string };

export function FinancingIntakePanel() {
  const [purpose, setPurpose] = useState<FinancingPurpose | "">("");
  const [programInterest, setProgramInterest] = useState<
    FinancingProgramInterest | ""
  >("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [propertyDescriptor, setPropertyDescriptor] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [estimatedProjectCost, setEstimatedProjectCost] = useState("");
  const [scopeSummary, setScopeSummary] = useState("");
  const [timeline, setTimeline] = useState("");
  const [feeAck, setFeeAck] = useState(false);
  const [consentAck, setConsentAck] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ phase: "idle" });

  const input = useMemo<FinancingIntakeInput>(
    () => ({
      purpose: purpose || null,
      programInterest: programInterest || null,
      contactName,
      contactEmail,
      contactPhone,
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
      propertyDescriptor,
      state,
      county,
      estimatedProjectCost,
      scopeSummary,
      timeline,
      feeAck,
      consentAck,
    ]
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
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>
          Your deal is recorded and routed to the licensed lender. Here&apos;s
          what happens next:
        </p>
        <ol style={{ margin: 0, paddingLeft: 18, color: "#3b475a", fontSize: 13, lineHeight: 1.6 }}>
          {submit.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <span style={{ fontSize: 11.5, color: "#708997" }}>
          A program fitting your project is not the same as you qualifying — the
          licensed lender makes that call, and nothing is committed until you and
          the lender agree.
        </span>
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
          Bring your deal — a licensed lender reviews it
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>
          Tell us what you&apos;re trying to finance. We record it and route it to
          the licensed lender, who reviews the fit and follows up. We don&apos;t
          lend, qualify, or price — the lender does.
        </p>
      </div>

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <div>
          <label style={label} htmlFor="fin-purpose">What is the financing for?</label>
          <select id="fin-purpose" style={field} value={purpose} onChange={(e) => setPurpose(e.target.value as FinancingPurpose | "")}>
            <option value="">Select…</option>
            {FINANCING_PURPOSES.map((p) => (
              <option key={p.code} value={p.code}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={label} htmlFor="fin-program">Program you have in mind (optional)</label>
          <select id="fin-program" style={field} value={programInterest} onChange={(e) => setProgramInterest(e.target.value as FinancingProgramInterest | "")}>
            <option value="">Select…</option>
            {FINANCING_PROGRAMS.map((p) => (
              <option key={p.code} value={p.code}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <div>
          <label style={label} htmlFor="fin-name">Your name</label>
          <input id="fin-name" style={field} value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="fin-email">Contact email</label>
          <input id="fin-email" type="email" style={field} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="fin-phone">Phone (optional)</label>
          <input id="fin-phone" style={field} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
      </div>

      <div>
        <label style={label} htmlFor="fin-property">The property or business (optional)</label>
        <input id="fin-property" style={field} value={propertyDescriptor} onChange={(e) => setPropertyDescriptor(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <div>
          <label style={label} htmlFor="fin-state">State</label>
          <input id="fin-state" style={field} value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="fin-county">County (optional)</label>
          <input id="fin-county" style={field} value={county} onChange={(e) => setCounty(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="fin-cost">Estimated project size (optional)</label>
          <input id="fin-cost" type="number" min="0" style={field} value={estimatedProjectCost} onChange={(e) => setEstimatedProjectCost(e.target.value)} placeholder="$ (context only)" />
        </div>
      </div>

      <div>
        <label style={label} htmlFor="fin-scope">Tell us about the deal (optional)</label>
        <textarea id="fin-scope" style={{ ...field, minHeight: 64, resize: "vertical" }} value={scopeSummary} onChange={(e) => setScopeSummary(e.target.value)} />
      </div>

      <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>
        <input type="checkbox" checked={feeAck} onChange={(e) => setFeeAck(e.target.checked)} style={{ marginTop: 2 }} />
        <span>I understand there is no fee to submit, and loan costs are set by the lender and disclosed in writing before I commit.</span>
      </label>
      <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>
        <input type="checkbox" checked={consentAck} onChange={(e) => setConsentAck(e.target.checked)} style={{ marginTop: 2 }} />
        <span>I consent to routing my request to the licensed lender, and understand this is not a qualification, pre-approval, rate lock, or lender commitment.</span>
      </label>

      {!ready && (
        <span style={{ fontSize: 11.5, color: "#708997" }}>
          Still needed: {preview.readiness.missingItems.join(" · ")}
        </span>
      )}

      {submit.phase === "error" && (
        <span style={{ fontSize: 12.5, color: "#b42318" }}>{submit.message}</span>
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
          cursor: ready && submit.phase !== "submitting" ? "pointer" : "default",
        }}
      >
        {submit.phase === "submitting" ? "Submitting…" : "Submit my deal"}
      </button>
    </section>
  );
}
