import Link from "next/link";

import {
  EXPLORATION_CATEGORIES,
  explorationHref,
} from "@/lib/customer-landing/featuredExplorationStories";

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#152033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const containerStyle = {
  maxWidth: 1080,
  margin: "0 auto",
  padding: "28px 24px 56px",
  display: "grid",
  gap: 20,
} as const;

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 14,
  padding: 22,
} as const;

const mutedText = {
  color: "#5d687a",
  lineHeight: 1.6,
} as const;

const VALUE_SIGNALS = [
  "Full Map shows all eight exploration categories before any personal intake.",
  "Focus My Exploration helps you narrow to one path once you have seen the map.",
  "Human review begins only after value is clear and only when you want a deeper handoff.",
];

const FOCUS_QUESTIONS = [
  "What type of business do you own?",
  "What are you trying to accomplish?",
  "Where is the property located?",
  "What type of asset is involved?",
];

const HOW_FOCUS_WORKS = [
  "Choose a category or stay broad while you compare pathways.",
  "Review what people usually explore in that category: readiness, land, programs, capital, stewardship, and next questions.",
  "If you want a guided handoff after that, move into the human-reviewed borrower portal.",
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedSlugValue = resolvedSearchParams?.explore;
  const selectedSlug = Array.isArray(selectedSlugValue)
    ? selectedSlugValue[0]
    : selectedSlugValue;
  const selectedCategory =
    EXPLORATION_CATEGORIES.find((category) => category.slug === selectedSlug) ??
    null;
  const modeValue = resolvedSearchParams?.mode;
  const mode =
    (Array.isArray(modeValue) ? modeValue[0] : modeValue) === "focus"
      ? "focus"
      : "full";

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        <section
          aria-label="Public Alpha customer project intake"
          style={panelStyle}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <span
              style={{
                display: "inline-flex",
                alignSelf: "start",
                padding: "4px 10px",
                borderRadius: 999,
                background: "#eef6f5",
                color: "#0f766e",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Exploration-first intake
            </span>
            <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.12 }}>
              Explore the full map first, then focus your journey.
            </h1>
            <p style={{ ...mutedText, margin: 0, fontSize: 16 }}>
              We ask only what we need to give you advisory guidance. You may
              stop at any time, request deletion, or request human review
              (human review).
            </p>
            <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.7 }}>
              {FOCUS_QUESTIONS.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
            <p style={{ ...mutedText, margin: 0, fontSize: 14 }}>
              This information is advisory only and is not an approval,
              guarantee, or official determination. You may exercise your data
              rights at any time: request an accounting, export, deletion, or
              human review of your information (data-rights). Borrowers pay
              nothing. Free for borrowers. Your information belongs to you;
              Furlong does not secretly submit, sell, or distribute your
              information; no silent submission and no information sale.
            </p>
          </div>
        </section>

        <section
          style={{
            ...panelStyle,
            display: "grid",
            gap: 16,
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 24 }}>Full Map vs Focus My Exploration</h2>
            <p style={{ ...mutedText, margin: 0 }}>
              Start broad if you want to see the whole map of possibilities.
              Switch to focus mode when you want one category to guide your next
              step. No account or personal information is required before value.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              href="/onboarding"
              style={{
                display: "inline-flex",
                minHeight: 42,
                alignItems: "center",
                padding: "0 14px",
                borderRadius: 999,
                border: mode === "full" ? "2px solid #0f766e" : "1px solid #cbd5e1",
                background: mode === "full" ? "#ecfdf5" : "#ffffff",
                color: "#162033",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Full Map
            </Link>
            <Link
              href={
                selectedCategory
                  ? `${explorationHref(selectedCategory.slug)}&mode=focus`
                  : "/onboarding?mode=focus"
              }
              style={{
                display: "inline-flex",
                minHeight: 42,
                alignItems: "center",
                padding: "0 14px",
                borderRadius: 999,
                border: mode === "focus" ? "2px solid #0f766e" : "1px solid #cbd5e1",
                background: mode === "focus" ? "#ecfdf5" : "#ffffff",
                color: "#162033",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Focus My Exploration
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {VALUE_SIGNALS.map((signal) => (
              <div
                key={signal}
                style={{
                  border: "1px solid #d7deea",
                  borderRadius: 12,
                  background: "#f8fbff",
                  padding: 16,
                  lineHeight: 1.6,
                }}
              >
                {signal}
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 24 }}>
              {mode === "focus" ? "Focus My Exploration" : "Full Map"}
            </h2>
            <p style={{ ...mutedText, margin: 0 }}>
              {mode === "focus"
                ? "Choose one lane to explore more intentionally. This is still advisory and still pre-intake; human review comes later if you want it."
                : "Browse every exploration lane at once. The map is national, illustrative, and not based on your location."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {EXPLORATION_CATEGORIES.map((category) => {
              const selected = category.slug === selectedCategory?.slug;
              const focusHref = `${explorationHref(category.slug)}&mode=focus`;
              return (
                <article
                  key={category.slug}
                  style={{
                    border: selected ? "2px solid #0f766e" : "1px solid #d7deea",
                    borderRadius: 12,
                    background: selected ? "#f0fdf9" : "#ffffff",
                    padding: 18,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <strong style={{ fontSize: 17 }}>{category.label}</strong>
                    <span style={{ ...mutedText, fontSize: 14 }}>
                      {category.blurb}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Link
                      href={explorationHref(category.slug)}
                      style={{
                        display: "inline-flex",
                        minHeight: 38,
                        alignItems: "center",
                        padding: "0 12px",
                        borderRadius: 999,
                        background: "#e8eef8",
                        color: "#162033",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      View in Full Map
                    </Link>
                    <Link
                      href={focusHref}
                      style={{
                        display: "inline-flex",
                        minHeight: 38,
                        alignItems: "center",
                        padding: "0 12px",
                        borderRadius: 999,
                        background: "#0f766e",
                        color: "#ffffff",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Focus this exploration
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          style={{
            ...panelStyle,
            display: "grid",
            gap: 14,
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)",
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 24 }}>What happens in focus mode</h2>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
              {HOW_FOCUS_WORKS.map((item) => (
                <li key={item} style={{ lineHeight: 1.6 }}>
                  {item}
                </li>
              ))}
            </ul>
            <p style={{ ...mutedText, margin: 0 }}>
              If you are ready for a deeper conversation after exploring the
              map, continue into the borrower portal. That is where human review
              and governed intake begin.
            </p>
          </div>

          <aside
            style={{
              border: "1px solid #d7deea",
              borderRadius: 12,
              background: "#f8fbff",
              padding: 18,
              display: "grid",
              gap: 10,
              alignContent: "start",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "#5d687a" }}>
              Next step
            </span>
            <strong style={{ fontSize: 20 }}>
              {selectedCategory?.label ?? "Choose a category or stay broad"}
            </strong>
            <p style={{ ...mutedText, margin: 0, fontSize: 14 }}>
              {selectedCategory?.blurb ??
                "You can keep exploring the full map, then request a human-reviewed handoff only if you want one."}
            </p>
            <Link
              href="/portal/borrower"
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 44,
                padding: "0 14px",
                borderRadius: 999,
                background: "#0f766e",
                color: "#ffffff",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Continue to human-reviewed intake
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
