"use client";

import { FormEvent, useState } from "react";

import styles from "./FurlongExperience.module.css";

const OPTIONS = [
  ["phase-i-esa", "Phase I environmental site assessment"],
  ["phase-ii-investigation", "Phase II environmental investigation"],
  ["phase-iii-remediation", "Phase III remediation"],
  ["remediation-site-supervision", "Remediation or site supervision"],
  ["environmental-consulting", "Environmental engineering consulting"],
  ["civil-engineering-consulting", "Civil engineering consulting"],
  ["chemical-engineering-consulting", "Chemical engineering consulting"],
  ["nuclear-engineering-consulting", "Nuclear engineering consulting"],
  ["general-engineering-advisory", "Other engineering advisory"],
  ["professional-firm-referral", "Stamped-plan or specialist-firm referral"],
  ["custom-concept-review", "Custom property or enterprise concept review"],
] as const;

type Result = {
  ok?: boolean;
  error?: string;
  message?: string;
  serviceRequestId?: string;
};

export function ProfessionalServicesIntake(props: { initialAddress: string }) {
  const [serviceType, setServiceType] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [exactAddress, setExactAddress] = useState(props.initialAddress);
  const [scopeSummary, setScopeSummary] = useState("");
  const [desiredTiming, setDesiredTiming] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/public/professional-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          contactName,
          contactEmail,
          contactPhone,
          exactAddress,
          scopeSummary,
          desiredTiming,
          consent,
        }),
      });
      const payload = (await response.json()) as Result;
      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error || "The scope request could not be submitted.",
        );
      }
      setResult(payload);
    } catch (caught) {
      setResult({
        ok: false,
        error:
          caught instanceof Error
            ? caught.message
            : "The scope request could not be submitted.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    return (
      <section className={styles.accepted} aria-live="polite">
        <p className={styles.eyebrow}>Scope request recorded</p>
        <h2>No charge was made.</h2>
        <p>{result.message}</p>
        <p>
          Reference: <strong>{result.serviceRequestId}</strong>
        </p>
      </section>
    );
  }

  const field = {
    display: "grid",
    gap: 6,
  } as const;
  const control = {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 44,
    border: "1px solid #b8c8ce",
    borderRadius: 8,
    padding: "10px 12px",
    background: "#fff",
    color: "#162b40",
    font: "inherit",
  } as const;

  return (
    <form onSubmit={(event) => void submit(event)} className={styles.checkout}>
      <div>
        <p className={styles.eyebrow}>Separate professional engagement</p>
        <h2>Request a scope review</h2>
        <p>
          Tell Furlong what must be investigated or performed. This form does
          not order work, set a universal deadline, or capture payment.
        </p>
      </div>

      <label style={field}>
        <strong>Service needed</strong>
        <select
          required
          value={serviceType}
          onChange={(event) => setServiceType(event.target.value)}
          style={control}
        >
          <option value="">Choose one</option>
          {OPTIONS.map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label style={field}>
        <strong>Property address</strong>
        <input
          required
          value={exactAddress}
          onChange={(event) => setExactAddress(event.target.value)}
          style={control}
          autoComplete="street-address"
        />
      </label>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        }}
      >
        <label style={field}>
          <strong>Name</strong>
          <input
            required
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            style={control}
            autoComplete="name"
          />
        </label>
        <label style={field}>
          <strong>Email</strong>
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            style={control}
            autoComplete="email"
          />
        </label>
        <label style={field}>
          <strong>Phone (optional)</strong>
          <input
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            style={control}
            autoComplete="tel"
          />
        </label>
      </div>

      <label style={field}>
        <strong>What must be evaluated or performed?</strong>
        <textarea
          required
          minLength={20}
          rows={6}
          value={scopeSummary}
          onChange={(event) => setScopeSummary(event.target.value)}
          style={control}
          placeholder="Describe the property condition, decision, suspected issue, documents already available, access limits, and the output you need."
        />
      </label>
      <label style={field}>
        <strong>Desired timing (not a promised deadline)</strong>
        <input
          value={desiredTiming}
          onChange={(event) => setDesiredTiming(event.target.value)}
          style={control}
          placeholder="Example: under contract; diligence ends October 30"
        />
      </label>

      <div className={styles.refundTerms}>
        <h3>Engagement boundary</h3>
        <p>
          Phase I–III work, remediation, site supervision, field sampling,
          laboratory work, engineering consulting, and specialist referrals are
          not included in either paid property report.
        </p>
        <p>
          Furlong does not provide or stamp customer drawings and does not
          consult on structural or electrical plans. When those deliverables are
          needed, the scope is routed to an appropriate firm.
        </p>
        <p>
          Feasibility, evidence requirements, responsibility, timing, fee,
          insurance, and engagement terms must be reviewed and accepted before
          work begins.
        </p>
      </div>

      <label className={styles.agreementCheck}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
        />
        <strong>
          I authorize Furlong to review this property and scope and contact me
          about a proposal or referral. I understand no work is ordered and no
          charge is made by submitting this form.
        </strong>
      </label>
      <p className={styles.note}>
        Do not enter a Social Security number, bank account, tax return, medical
        information, or other personal financial information.
      </p>

      <button
        type="submit"
        className={styles.primary}
        disabled={busy || !consent}
      >
        {busy ? "SUBMITTING…" : "SUBMIT SCOPE REQUEST — NO CHARGE"}
      </button>
      {result?.error ? (
        <p role="alert" className={styles.error}>
          {result.error}
        </p>
      ) : null}
    </form>
  );
}
