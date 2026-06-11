"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * /accessibility-feedback — Report an accessibility issue (Build 56)
 *
 * Reached from the "Report an accessibility issue" button on /accessibility.
 * A visitor describes what is not working; on submit the report is emailed to
 * the accessibility owner (see /api/accessibility-feedback) and the visitor
 * sees a plain thank-you confirmation.
 *
 * Fields: what page, what is not working (required), how they access the site,
 * and an optional reply-to email. No account or tracking.
 *
 * Public Alpha remains PENDING.
 */

const container = {
  maxWidth: 680,
  margin:   "0 auto",
  padding:  "48px 24px 80px",
  display:  "grid",
  gap:      24,
} as const;

const labelStyle = {
  display:    "grid",
  gap:        6,
  fontSize:   15,
  fontWeight: 600,
  color:      "#162033",
} as const;

const fieldStyle = {
  width:        "100%",
  minHeight:    48,
  padding:      "10px 12px",
  borderRadius: 10,
  border:       "1.5px solid #cdd9ec",
  background:   "#ffffff",
  color:        "#162033",
  fontSize:     15,
  fontFamily:   "inherit",
} as const;

const ACCESS_METHODS = [
  "Mouse / trackpad",
  "Keyboard only",
  "Screen reader",
  "Screen magnifier / zoom",
  "Voice control",
  "Mobile / touch",
  "Other / prefer not to say",
];

type Status = "idle" | "submitting" | "done" | "error";

export default function AccessibilityFeedbackPage() {
  const [status, setStatus]     = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      page:         String(data.get("page") ?? ""),
      problem:      String(data.get("problem") ?? ""),
      accessMethod: String(data.get("accessMethod") ?? ""),
      email:        String(data.get("email") ?? ""),
    };

    if (!payload.problem.trim()) {
      setErrorMsg("Please describe what is not working so we can fix it.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/accessibility-feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Something went wrong sending your report.");
      }
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong sending your report.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main>
        <div style={container}>
          <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, color: "#162033" }}>
            Thanks — we&rsquo;ll look into this.
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: "#3b475a", lineHeight: 1.7 }}>
            Your report has been sent to our team. If you left an email, we may
            reach out to confirm once the barrier is fixed. We take this
            seriously — a tool you cannot use is not a tool.
          </p>
          <div>
            <Link href="/accessibility" style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
              &larr; Back to Accessibility
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div style={container}>
        <header style={{ display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, color: "#162033", lineHeight: 1.15 }}>
            Report an accessibility issue
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: "#5d687a", lineHeight: 1.7 }}>
            If a part of Furlong is not working with your assistive technology, or
            you have hit a barrier of any kind, tell us. The more detail you can
            give, the faster we can fix it.
          </p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }} noValidate>
          <label style={labelStyle} htmlFor="page">
            What page or feature had the problem?
            <input
              id="page"
              name="page"
              type="text"
              placeholder="e.g. the homepage map, the onboarding form"
              style={fieldStyle}
              autoComplete="off"
            />
          </label>

          <label style={labelStyle} htmlFor="problem">
            What is not working? <span style={{ color: "#8a2018" }}>(required)</span>
            <textarea
              id="problem"
              name="problem"
              required
              rows={5}
              placeholder="Describe what you were trying to do and what went wrong."
              style={{ ...fieldStyle, minHeight: 120, resize: "vertical", lineHeight: 1.5 }}
            />
          </label>

          <label style={labelStyle} htmlFor="accessMethod">
            How are you accessing the site?
            <select id="accessMethod" name="accessMethod" style={fieldStyle} defaultValue="">
              <option value="">Prefer not to say</option>
              {ACCESS_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label style={labelStyle} htmlFor="email">
            Your email (optional — so we can confirm once it&rsquo;s fixed)
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              style={fieldStyle}
              autoComplete="email"
            />
          </label>

          {status === "error" && (
            <p role="alert" style={{ margin: 0, color: "#8a2018", fontSize: 14, fontWeight: 600 }}>
              {errorMsg}
            </p>
          )}

          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                display:        "inline-flex",
                alignItems:     "center",
                justifyContent: "center",
                minHeight:      52,
                padding:        "0 28px",
                borderRadius:   999,
                background:     status === "submitting" ? "#5b8a85" : "#0f766e",
                color:          "#ffffff",
                fontWeight:     800,
                fontSize:       16,
                border:         "none",
                cursor:         status === "submitting" ? "default" : "pointer",
              }}
            >
              {status === "submitting" ? "Sending…" : "Send report"}
            </button>
            <Link href="/accessibility" style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
              &larr; Back to Accessibility
            </Link>
          </div>
        </form>

        <p style={{ margin: 0, fontSize: 13, color: "#5d687a", lineHeight: 1.65 }}>
          We use what you send only to fix the problem and, if you leave an email,
          to confirm the fix. Furlong does not sell or distribute your information.
        </p>
      </div>
    </main>
  );
}
