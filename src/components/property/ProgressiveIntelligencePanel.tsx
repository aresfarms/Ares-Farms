"use client";

import type { FurlongAnswer } from "@/lib/property/furlongAnswer";

type ProgressiveIntelligencePanelProps = {
  answer: FurlongAnswer;
  discoveredFacts: number;
  unresolvedCount: number;
  ownerAssertionsCount: number;
  comparisonCountHint?: number;
  onOpenEvidence: () => void;
  onOpenFinance: () => void;
  onOpenReport: () => void;
};

function statusTone(status: string) {
  if (status === "VERIFIED") return { bg: "#EAF7F1", ink: "#0C5D4E", border: "#B9E2D3" };
  if (status === "SUPPORTED") return { bg: "#EEF4FB", ink: "#234E7A", border: "#C9DAEC" };
  if (status === "SCREENING") return { bg: "#FFF7E8", ink: "#7A5816", border: "#E8D5A7" };
  return { bg: "#FFF1EE", ink: "#8A3A2B", border: "#E9C7C0" };
}

export function ProgressiveIntelligencePanel({
  answer,
  discoveredFacts,
  unresolvedCount,
  ownerAssertionsCount,
  onOpenEvidence,
  onOpenFinance,
  onOpenReport,
}: ProgressiveIntelligencePanelProps) {
  const possibilities = answer.sections.find((section) => section.key === "possibilities");
  const unknowns = answer.sections.find((section) => section.key === "unknowns");
  const next = answer.sections.find((section) => section.key === "next");
  const constraints = answer.sections.find((section) => section.key === "constraints");

  const evidenceStates = answer.sections.reduce<Record<string, number>>((acc, section) => {
    acc[section.status] = (acc[section.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section
      data-testid="progressive-intelligence-panel"
      aria-labelledby="progressive-intelligence-heading"
      style={{
        border: "1px solid #D9D2C3",
        borderRadius: 16,
        background: "linear-gradient(180deg,#FFFDF8 0%,#F7F3E9 100%)",
        padding: "18px",
        display: "grid",
        gap: 15,
      }}
    >
      <header style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "#8F6E1F", fontSize: 10.5, fontWeight: 850, letterSpacing: ".14em", textTransform: "uppercase" }}>
          Progressive intelligence
        </span>
        <h2 id="progressive-intelligence-heading" style={{ margin: 0, color: "#162B40", fontFamily: "Georgia,serif", fontSize: 24 }}>
          What you have discovered — and what could change next
        </h2>
        <p style={{ margin: 0, color: "#5A6172", lineHeight: 1.6, fontSize: 13.5, maxWidth: 880 }}>
          Furlong does not manufacture a completion score. This trail is built from the evidence actually attached to this property, the remaining gaps, and the next useful action.
        </p>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span style={{ border: "1px solid #D9D2C3", background: "#fff", borderRadius: 999, padding: "7px 10px", fontSize: 12, color: "#334155", fontWeight: 750 }}>
          {discoveredFacts} sourced fact{discoveredFacts === 1 ? "" : "s"}
        </span>
        <span style={{ border: "1px solid #D9D2C3", background: "#fff", borderRadius: 999, padding: "7px 10px", fontSize: 12, color: "#334155", fontWeight: 750 }}>
          {answer.sources.length} source{answer.sources.length === 1 ? "" : "s"} attached
        </span>
        <span style={{ border: "1px solid #E9C7C0", background: "#FFF7F4", borderRadius: 999, padding: "7px 10px", fontSize: 12, color: "#7A3428", fontWeight: 750 }}>
          {unresolvedCount} unresolved item{unresolvedCount === 1 ? "" : "s"}
        </span>
        {ownerAssertionsCount > 0 && (
          <span style={{ border: "1px solid #D7C4E8", background: "#FBF7FF", borderRadius: 999, padding: "7px 10px", fontSize: 12, color: "#65407F", fontWeight: 750 }}>
            {ownerAssertionsCount} customer-added fact{ownerAssertionsCount === 1 ? "" : "s"} awaiting verification
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
        {answer.sections.map((section) => {
          const tone = statusTone(section.status);
          return (
            <article key={section.key} style={{ background: "#fff", border: `1px solid ${tone.border}`, borderRadius: 12, padding: "13px 14px", display: "grid", gap: 6 }}>
              <span style={{ color: tone.ink, background: tone.bg, width: "fit-content", borderRadius: 999, padding: "4px 8px", fontSize: 10.5, fontWeight: 850 }}>
                {section.status}
              </span>
              <strong style={{ color: "#162B40", fontSize: 14.5, lineHeight: 1.35 }}>{section.question}</strong>
              <span style={{ color: "#5A6172", fontSize: 12.5, lineHeight: 1.55 }}>{section.text}</span>
            </article>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))", gap: 10 }}>
        <article style={{ background: "#10243B", color: "#fff", borderRadius: 13, padding: "15px 16px", display: "grid", gap: 7 }}>
          <span style={{ color: "#D7B85A", fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: ".12em" }}>Opportunity signal</span>
          <strong style={{ fontSize: 16, lineHeight: 1.4 }}>{possibilities?.status ?? "SCREENING"}</strong>
          <span style={{ color: "#E6EEF2", fontSize: 12.5, lineHeight: 1.55 }}>{possibilities?.text ?? "Opportunity analysis is still assembling."}</span>
        </article>

        <article style={{ background: "#fff", border: "1px solid #E6CFC9", borderRadius: 13, padding: "15px 16px", display: "grid", gap: 7 }}>
          <span style={{ color: "#8A3A2B", fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: ".12em" }}>Still undiscovered</span>
          <strong style={{ color: "#162B40", fontSize: 16, lineHeight: 1.4 }}>
            {unresolvedCount > 0 ? `${unresolvedCount} evidence gap${unresolvedCount === 1 ? "" : "s"} still matter` : "No listed gap is complete clearance"}
          </strong>
          <span style={{ color: "#5A6172", fontSize: 12.5, lineHeight: 1.55 }}>{unknowns?.text ?? constraints?.text ?? "Review remaining legal, physical, market, and financial constraints."}</span>
        </article>

        <article style={{ background: "#FFF9E8", border: "1px solid #E3CE93", borderRadius: 13, padding: "15px 16px", display: "grid", gap: 7 }}>
          <span style={{ color: "#7A5816", fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: ".12em" }}>Unlock next</span>
          <strong style={{ color: "#162B40", fontSize: 16, lineHeight: 1.4 }}>Resolve the next evidence that can change the conclusion</strong>
          <span style={{ color: "#5A6172", fontSize: 12.5, lineHeight: 1.55 }}>{next?.text ?? "Review the remaining evidence before relying on the result."}</span>
        </article>
      </div>

      <div style={{ borderTop: "1px solid #DDD5C6", paddingTop: 13, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" onClick={onOpenEvidence} style={{ border: "1px solid #C9D4E1", borderRadius: 9, padding: "10px 12px", background: "#fff", color: "#162B40", fontWeight: 800, cursor: "pointer" }}>
            Investigate evidence
          </button>
          <button type="button" onClick={onOpenFinance} style={{ border: "1px solid #C9D4E1", borderRadius: 9, padding: "10px 12px", background: "#fff", color: "#162B40", fontWeight: 800, cursor: "pointer" }}>
            Test the economics
          </button>
          <button type="button" onClick={onOpenReport} style={{ border: 0, borderRadius: 9, padding: "10px 13px", background: "#0F766E", color: "#fff", fontWeight: 850, cursor: "pointer" }}>
            Promote this investigation
          </button>
        </div>
        <span style={{ color: "#6B7280", fontSize: 11.5, lineHeight: 1.5 }}>
          Evidence states in this answer: {Object.entries(evidenceStates).map(([state, count]) => `${count} ${state.toLowerCase()}`).join(" · ")}. Furlong reveals known conclusions immediately; it does not hide facts to create engagement.
        </span>
      </div>
    </section>
  );
}
