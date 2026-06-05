"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * /onboarding — Customer-facing guided project intake (Build 44 UX rebuild).
 *
 * A plain-English intake page for prospective borrowers. It deliberately
 * shows NO internal or developer-facing language and no diagnostic output —
 * only customer-readable copy. The Public Alpha customer portal is
 * /portal/borrower.
 *
 * It answers, in order: What is this? · What do I do first? · What
 * information do I need? · What happens after I submit? · What does Furlong
 * not do?
 */

type IntakeField = {
  id: string;
  question: string;
  help: string;
  placeholder: string;
  multiline?: boolean;
};

// The questions we ask, in plain language. The first four are the canonical
// customer-journey intake questions, kept verbatim.
const intakeFields: IntakeField[] = [
  {
    id: "goal",
    question: "What are you trying to accomplish?",
    help: "Your goal in your own words — buy land, expand, refinance, or start something new.",
    placeholder: "e.g., I want to buy the farm I currently lease.",
    multiline: true,
  },
  {
    id: "business",
    question: "What type of business do you own?",
    help: "If you do not own one yet, describe what you plan to start.",
    placeholder: "e.g., Row-crop farm, cattle operation, orchard.",
  },
  {
    id: "asset",
    question: "What type of asset is involved?",
    help: "The land, property, equipment, or facility your project involves.",
    placeholder: "e.g., 60 acres of cropland and a barn.",
  },
  {
    id: "location",
    question: "Where is the property located?",
    help: "County and state are enough to get started.",
    placeholder: "e.g., Carroll County, Maryland.",
  },
  {
    id: "ownership",
    question: "Do you own it now, or do you want to buy it?",
    help: "Let us know if you own it, lease it, or hope to purchase it.",
    placeholder: "e.g., I lease it now and want to buy it.",
  },
  {
    id: "stage",
    question: "What stage are you in?",
    help: "Just exploring, actively planning, or ready to move soon?",
    placeholder: "e.g., Just exploring my options.",
  },
  {
    id: "questions",
    question: "What questions are you trying to answer?",
    help: "Tell us what you most want help understanding.",
    placeholder: "e.g., What financing might fit, and what I would need to prepare.",
    multiline: true,
  },
];

const helpfulLinks: Array<{ href: string; label: string; detail: string }> = [
  {
    href: "/trust",
    label: "How we handle your information",
    detail: "Our promises about your data and how we work.",
  },
  {
    href: "/data-rights",
    label: "Your data rights",
    detail: "Request an accounting, export, or deletion any time.",
  },
  {
    href: "/financing-pathways",
    label: "Financing pathways",
    detail: "See the kinds of financing that might fit a project like yours.",
  },
  {
    href: "/portal/borrower",
    label: "Your borrower portal",
    detail: "Track your project and reach a human reviewer.",
  },
];

const shell = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const container = {
  maxWidth: 820,
  margin: "0 auto",
  padding: "32px 24px 56px",
  display: "grid",
  gap: 22,
} as const;

const card = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 12,
  padding: 24,
} as const;

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

const inputStyle = {
  width: "100%",
  minHeight: 44,
  padding: "10px 12px",
  border: "1px solid #b9c2d0",
  borderRadius: 8,
  fontSize: 15,
  fontFamily: "inherit",
  color: "#162033",
  background: "#ffffff",
} as const;

export default function OnboardingPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<null | "review" | "draft" | "human">(
    null
  );

  function update(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  const confirmation =
    submitted === "review"
      ? "Thanks — we’ve started your project review. There’s nothing else you need to do right now."
      : submitted === "draft"
        ? "Your draft is saved. You can come back and finish any time."
        : submitted === "human"
          ? "Thanks — a human reviewer will follow up with you."
          : null;

  return (
    <main style={shell}>
      <div style={container}>
        {/* 1. Hero — What is this? */}
        <header style={{ display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.15 }}>
            Tell us about your project
          </h1>
          <p style={{ ...muted, margin: 0, fontSize: 17 }}>
            Furlong helps you understand possible financing pathways, readiness
            gaps, risks, and next steps. Share a little about what you’re working
            on, and we’ll help you see your options. This is advisory
            information only, and it’s free for borrowers.
          </p>
        </header>

        {/* 2. Advisory disclosure — What does Furlong not do? */}
        <section
          aria-label="What Furlong is and is not"
          style={{
            ...card,
            background: "#fffbeb",
            border: "1px solid #f3d28a",
          }}
        >
          <p style={{ margin: 0, lineHeight: 1.6, color: "#7c2d12" }}>
            <strong>Furlong is not a lender.</strong> Furlong does not approve,
            deny, guarantee, or make official determinations. Everything here is
            advisory information only — it is not an approval, guarantee, or
            official determination. A person reviews your project; Furlong does
            not make automatic decisions.
          </p>
        </section>

        {/* Confirmation after a button is pressed */}
        {confirmation && (
          <section
            role="status"
            style={{
              ...card,
              background: "#ecfdf5",
              border: "1px solid #9ae6c4",
            }}
          >
            <p style={{ margin: 0, lineHeight: 1.6, color: "#065f46" }}>
              {confirmation} We may ask follow-up questions if information is
              missing or conflicting. Missing information does not mean denial.
            </p>
          </section>
        )}

        {/* 2 + 3. What do I do first / What information do I need */}
        <section style={card}>
          <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 22 }}>
            Start here
          </h2>
          <p style={{ ...muted, marginTop: 0 }}>
            Answer in your own words — there are no wrong answers, and you can
            leave anything blank for now. Here’s what we’ll ask:
          </p>

          <div style={{ display: "grid", gap: 18, marginTop: 8 }}>
            {intakeFields.map((field) => (
              <label key={field.id} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  {field.question}
                </span>
                <span style={{ ...muted, fontSize: 13 }}>{field.help}</span>
                {field.multiline ? (
                  <textarea
                    value={values[field.id] ?? ""}
                    onChange={(event) => update(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                ) : (
                  <input
                    value={values[field.id] ?? ""}
                    onChange={(event) => update(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    style={inputStyle}
                  />
                )}
              </label>
            ))}
          </div>

          {/* 4. Buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 22,
            }}
          >
            <button
              type="button"
              onClick={() => setSubmitted("review")}
              style={{
                minHeight: 48,
                padding: "0 20px",
                borderRadius: 8,
                border: "1px solid #0f766e",
                background: "#0f766e",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Start project review
            </button>
            <button
              type="button"
              onClick={() => setSubmitted("draft")}
              style={{
                minHeight: 48,
                padding: "0 20px",
                borderRadius: 8,
                border: "1px solid #0f766e",
                background: "#ffffff",
                color: "#0f766e",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => setSubmitted("human")}
              style={{
                minHeight: 48,
                padding: "0 20px",
                borderRadius: 8,
                border: "1px solid #b9c2d0",
                background: "#ffffff",
                color: "#162033",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Request human review
            </button>
          </div>
        </section>

        {/* 5. After-submit explanation — What happens after I submit? */}
        <section style={card}>
          <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 22 }}>
            What happens after you submit?
          </h2>
          <p style={{ ...muted, margin: 0 }}>
            We may ask follow-up questions if information is missing or
            conflicting. <strong>Missing information does not mean denial.</strong>{" "}
            A person reviews what you share and helps you understand your
            options and next steps. You can request human review at any time.
          </p>
        </section>

        {/* 6. Data notice */}
        <section style={card}>
          <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 22 }}>
            Your information
          </h2>
          <p style={{ ...muted, margin: 0 }}>
            We do not sell your information. Your information belongs to you. You
            can request an accounting, export, deletion, or human review of your
            data at any time — these are your data rights. Borrowers pay nothing;
            Furlong is free for borrowers. Furlong does not secretly submit your
            information to anyone — no silent submission and no information sale.
          </p>
        </section>

        {/* 7. Helpful links */}
        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Helpful links</h2>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            {helpfulLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  ...card,
                  padding: 16,
                  display: "grid",
                  gap: 6,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <strong style={{ fontSize: 16 }}>{link.label}</strong>
                <span style={{ ...muted, fontSize: 13 }}>{link.detail}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
