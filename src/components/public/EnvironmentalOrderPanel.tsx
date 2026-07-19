"use client";

import { useMemo, useState } from "react";

import {
  ENVIRONMENTAL_SERVICES,
  EnvironmentalOrderInput,
  EnvironmentalServiceCode,
  evaluateEnvironmentalOrder,
} from "@/lib/environmental/orderRuntime";
import { accentForLane } from "@/lib/property/laneThemes";

/**
 * EnvironmentalOrderPanel — the customer-facing order surface for the licensed
 * Environmental module. The customer orders a real Phase I/II/III assessment or
 * a licensed PE review; the order is recorded and routed to the PE (the
 * Environmental Engineering Spoke) who confirms scope, quotes the fee, and
 * fulfills. Client component: local readiness preview mirrors the governed
 * route, then submit posts to /api/environmental/order.
 *
 * Master Volume Governance (mirrors src/app/api/environmental/order/route.ts):
 * - FACILITATION-001: records + routes an order; never a determination.
 * - CANON-TREASURY-001 §9.1: fee disclosed here, at intake — quoted and
 *   approved before any work or charge. Live capture stays gated.
 * - CANON-CONSENT-001 §6 + HITL-GOV-001: consent + human review, recorded.
 */

const EMERALD = accentForLane("environmental-compliance", "light"); // #127a4f

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

export function EnvironmentalOrderPanel() {
  const [serviceCode, setServiceCode] =
    useState<EnvironmentalServiceCode | "">("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [propertyDescriptor, setPropertyDescriptor] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [scopeSummary, setScopeSummary] = useState("");
  const [timeline, setTimeline] = useState("");
  const [feeAck, setFeeAck] = useState(false);
  const [consentAck, setConsentAck] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ phase: "idle" });

  const input = useMemo<EnvironmentalOrderInput>(
    () => ({
      serviceCode: serviceCode || null,
      contactName,
      contactEmail,
      contactPhone,
      contactAddress,
      propertyDescriptor,
      location: { state, county },
      scopeSummary,
      timeline,
      feeDisclosureAcknowledged: feeAck,
      consentAcknowledged: consentAck,
    }),
    [
      serviceCode,
      contactName,
      contactEmail,
      contactPhone,
      contactAddress,
      propertyDescriptor,
      state,
      county,
      scopeSummary,
      timeline,
      feeAck,
      consentAck,
    ]
  );

  const preview = useMemo(() => evaluateEnvironmentalOrder(input), [input]);
  const ready = preview.readiness.missingItems.length === 0;

  async function placeOrder() {
    if (!ready) return;
    setSubmit({ phase: "submitting" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch("/api/environmental/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Order could not be submitted.");
      }
      setSubmit({
        phase: "done",
        serviceRequestId: data.serviceRequestId,
        nextSteps: data.orderResult?.nextSteps ?? [],
      });
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "This is taking longer than expected — please try again in a moment."
          : err instanceof Error
            ? err.message
            : "Order could not be submitted.";
      setSubmit({ phase: "error", message });
    } finally {
      clearTimeout(timeout);
    }
  }

  if (submit.phase === "done") {
    return (
      <section aria-label="Order received" style={{ ...panel, gap: 10 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: EMERALD,
          }}
        >
          Order received
        </span>
        <strong style={{ fontSize: 16, color: "#101a2b" }}>
          Your reference is {submit.serviceRequestId}
        </strong>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>
          Your request is recorded and routed to the licensed PE. Here&apos;s
          what happens next:
        </p>
        <ol style={{ margin: 0, paddingLeft: 18, color: "#3b475a", fontSize: 13, lineHeight: 1.6 }}>
          {submit.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <span style={{ fontSize: 11.5, color: "#708997" }}>
          You&apos;ll receive a written quote to approve before any work or
          charge. Nothing is billed without your acknowledgement.
        </span>
        <a href="/status" style={{ fontSize: 12.5, fontWeight: 700, color: EMERALD, textDecoration: "none" }}>
          Check your status anytime with this reference →
        </a>
      </section>
    );
  }

  return (
    <section aria-label="Order a site assessment" style={panel}>
      <div style={{ display: "grid", gap: 4 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: EMERALD,
          }}
        >
          Order the work — a licensed PE fulfills it
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>
          Order a Phase I, II, or III assessment or a licensed PE review. We
          record it, route it to the PE, and you approve a written quote before
          any work begins.
        </p>
      </div>

      <div
        style={{
          background: "#eef7f1",
          borderLeft: `3px solid ${EMERALD}`,
          borderRadius: "0 8px 8px 0",
          padding: "9px 12px",
          fontSize: 12,
          color: "#245c43",
          lineHeight: 1.55,
        }}
      >
        <strong>Fee disclosure:</strong> {preview.feeDisclosure.payerPosture}{" "}
        {preview.feeDisclosure.note}
      </div>

      <div>
        <label style={label} htmlFor="env-service">
          What do you need?
        </label>
        <select
          id="env-service"
          style={field}
          value={serviceCode}
          onChange={(e) =>
            setServiceCode(e.target.value as EnvironmentalServiceCode | "")
          }
        >
          <option value="">Select a service…</option>
          {ENVIRONMENTAL_SERVICES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
        {serviceCode && (
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#708997", lineHeight: 1.5 }}>
            {ENVIRONMENTAL_SERVICES.find((s) => s.code === serviceCode)?.deliverable}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <div>
          <label style={label} htmlFor="env-name">Your name</label>
          <input id="env-name" style={field} value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="env-email">Contact email</label>
          <input id="env-email" type="email" style={field} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="env-phone">Phone (optional)</label>
          <input id="env-phone" style={field} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
      </div>

      <div>
        <label style={label} htmlFor="env-address">Your mailing address</label>
        <input id="env-address" style={field} value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} />
      </div>

      <div>
        <label style={label} htmlFor="env-property">The property (address or parcel)</label>
        <input id="env-property" style={field} value={propertyDescriptor} onChange={(e) => setPropertyDescriptor(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <div>
          <label style={label} htmlFor="env-state">State</label>
          <input id="env-state" style={field} value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="env-county">County (optional)</label>
          <input id="env-county" style={field} value={county} onChange={(e) => setCounty(e.target.value)} />
        </div>
        <div>
          <label style={label} htmlFor="env-timeline">Timeline (optional)</label>
          <input id="env-timeline" style={field} value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. closing in 45 days" />
        </div>
      </div>

      <div>
        <label style={label} htmlFor="env-scope">Anything we should know? (optional)</label>
        <textarea id="env-scope" style={{ ...field, minHeight: 64, resize: "vertical" }} value={scopeSummary} onChange={(e) => setScopeSummary(e.target.value)} />
      </div>

      <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>
        <input type="checkbox" checked={feeAck} onChange={(e) => setFeeAck(e.target.checked)} style={{ marginTop: 2 }} />
        <span>I understand the fee is quoted and approved before any work begins — no charge without my acknowledgement.</span>
      </label>
      <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>
        <input type="checkbox" checked={consentAck} onChange={(e) => setConsentAck(e.target.checked)} style={{ marginTop: 2 }} />
        <span>I consent to routing my request to the licensed PE, and understand this is not a determination, clearance, permit, or lender commitment.</span>
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
        onClick={placeOrder}
        disabled={!ready || submit.phase === "submitting"}
        style={{
          justifySelf: "start",
          border: "none",
          borderRadius: 10,
          padding: "10px 18px",
          fontSize: 13.5,
          fontWeight: 700,
          color: "#ffffff",
          background: ready ? EMERALD : "#9fb3ab",
          cursor: ready && submit.phase !== "submitting" ? "pointer" : "default",
        }}
      >
        {submit.phase === "submitting" ? "Submitting…" : "Submit order"}
      </button>
    </section>
  );
}
