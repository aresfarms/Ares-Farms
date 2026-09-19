"use client";

import { useState, type ReactNode } from "react";

import type {
  RankedPropertyScenario,
  ScenarioCandidateRole,
  ScenarioRankingPlan,
} from "@/lib/intelligence/scenarioRankingPlan";

const ROLE_LABELS: Record<ScenarioCandidateRole, string> = {
  "best-single-enterprise": "Best single enterprise",
  "best-mixed-use": "Best mixed-use configuration",
  "customer-vision": "Customer vision",
  "best-distinct-alternative": "Best distinct alternative",
};

type DetailTab =
  | "summary"
  | "evidence"
  | "risks"
  | "economics"
  | "financing"
  | "next";

const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "summary", label: "Summary" },
  { id: "evidence", label: "Evidence" },
  { id: "risks", label: "Risks / constraints" },
  { id: "economics", label: "Economics" },
  { id: "financing", label: "Financing fit" },
  { id: "next", label: "Next steps" },
];

const scoreCell = {
  display: "grid",
  gap: 3,
  border: "1px solid #e2e7ee",
  borderRadius: 10,
  background: "#fbfcfe",
  padding: "10px 12px",
} as const;

function titleCasePosture(value: RankedPropertyScenario["posture"]) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function DetailList({
  items,
  empty,
}: {
  items: string[];
  empty: string;
}) {
  return items.length ? (
    <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
      {items.map((item) => (
        <li key={item} style={{ color: "#4d596d", lineHeight: 1.6 }}>
          {item}
        </li>
      ))}
    </ul>
  ) : (
    <p style={{ margin: 0, color: "#5d687a", lineHeight: 1.6 }}>{empty}</p>
  );
}

/**
 * PROPERTY-DECISION-FRONT-PAGE-001
 *
 * Customer-facing rendering of the replay-captured top-three property decision.
 * The initial state is deliberately sparse: three governed plan choices and a
 * short advisory. The detailed workspace and report offer remain hidden until
 * the customer explicitly opens one of the plans.
 *
 * Authority: FURLONG-VISION-001; FACILITATION-001; REG-SCORE-002/003;
 * TECH-SCORE-001; CANON-EXPL-001; PUBLIC-CLAIMS-001;
 * PROGRESSIVE-INTELLIGENCE-001.
 */
export function PropertyDecisionRankingPanel({
  plan,
  reportOffer,
  onSelectionChange,
}: {
  plan: ScenarioRankingPlan;
  reportOffer?: ReactNode;
  onSelectionChange?: (scenarioId: string | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("summary");
  const selected =
    plan.scenarios.find((scenario) => scenario.id === selectedId) ?? null;
  const selectedRank = selected
    ? plan.scenarios.findIndex((scenario) => scenario.id === selected.id) + 1
    : null;

  function openPlan(id: string) {
    setSelectedId(id);
    setDetailTab("summary");
    onSelectionChange?.(id);
  }

  return (
    <section
      aria-labelledby="property-decision-ranking"
      data-testid="property-decision-ranking"
      style={{
        display: "grid",
        gap: 14,
        border: "1px solid #d7deea",
        borderRadius: 16,
        background: "#ffffff",
        padding: "clamp(16px,3vw,22px)",
        boxShadow: "0 8px 24px rgba(16,26,43,0.06)",
      }}
    >
      <header style={{ display: "grid", gap: 5 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 850,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#0f766e",
          }}
        >
          Furlong property decision
        </span>
        <h2
          id="property-decision-ranking"
          style={{
            margin: 0,
            fontFamily: "Georgia,serif",
            fontSize: "clamp(23px,3vw,30px)",
            color: "#101a2b",
            lineHeight: 1.15,
          }}
        >
          Three property plans, ranked from the same evidence
        </h2>
      </header>

      <div
        data-testid="property-decision-choice-grid"
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(235px, 1fr))",
        }}
      >
        {plan.scenarios.map((scenario, index) => {
          const active = scenario.id === selectedId;
          return (
            <article
              key={scenario.id}
              style={{
                display: "grid",
                gap: 9,
                alignContent: "start",
                border: active
                  ? "2px solid #0f766e"
                  : index === 0
                    ? "2px solid #b8862f"
                    : "1px solid #d7deea",
                borderRadius: 13,
                background: active ? "#f4fbf9" : "#ffffff",
                padding: "15px",
                minHeight: 250,
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 850,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: active ? "#0f766e" : index === 0 ? "#8a651d" : "#607086",
                }}
              >
                Rank {index + 1} · {ROLE_LABELS[scenario.candidateRole]}
              </span>
              <strong
                style={{
                  color: "#162033",
                  fontSize: 17,
                  lineHeight: 1.3,
                  fontFamily: "Georgia,serif",
                }}
              >
                {scenario.title}
              </strong>
              <span
                style={{
                  color: "#526074",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  flex: "1 1 auto",
                }}
              >
                {scenario.summary}
              </span>
              <div style={{ display: "grid", gap: 4 }}>
                <span
                  style={{
                    color: "#162033",
                    fontSize: 12.5,
                    fontWeight: 800,
                  }}
                >
                  Property/project score {scenario.totalScore}/100
                </span>
                <span
                  style={{
                    color: "#526074",
                    fontSize: 11.5,
                    lineHeight: 1.45,
                  }}
                >
                  Financing fit {scenario.financeability}/100 · borrower
                  underwriting not evaluated
                </span>
              </div>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => openPlan(scenario.id)}
                style={{
                  minHeight: 44,
                  border: active ? "1px solid #0f766e" : "none",
                  borderRadius: 9,
                  padding: "10px 13px",
                  background: active ? "#ffffff" : "#0f766e",
                  color: active ? "#0f766e" : "#ffffff",
                  fontWeight: 850,
                  cursor: "pointer",
                  justifySelf: "stretch",
                }}
              >
                {active ? "Plan open" : "Open this plan"}
              </button>
            </article>
          );
        })}
      </div>

      {selected && selectedRank != null && (
        <section
          data-testid="selected-property-plan"
          aria-labelledby="selected-property-plan-heading"
          style={{
            display: "grid",
            gap: 14,
            borderTop: "1px solid #e4e9f0",
            paddingTop: 16,
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 4, maxWidth: 820 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 850,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#0f766e",
                }}
              >
                Selected plan · Rank {selectedRank}
              </span>
              <h3
                id="selected-property-plan-heading"
                style={{
                  margin: 0,
                  color: "#162033",
                  fontFamily: "Georgia,serif",
                  fontSize: 22,
                  lineHeight: 1.25,
                }}
              >
                {selected.title}
              </h3>
            </div>
            <span
              style={{
                border: "1px solid #d7deea",
                borderRadius: 999,
                padding: "6px 10px",
                color: "#526074",
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              {plan.status === "evidence-supported"
                ? "Evidence-supported ranking"
                : "Preliminary ranking"}
            </span>
          </header>

          <div
            role="tablist"
            aria-label="Selected plan details"
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {DETAIL_TABS.map((item) => {
              const active = item.id === detailTab;
              return (
                <button
                  key={item.id}
                  id={`plan-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`plan-panel-${item.id}`}
                  onClick={() => setDetailTab(item.id)}
                  style={{
                    flex: "0 0 auto",
                    minHeight: 42,
                    border: active
                      ? "1px solid #0f766e"
                      : "1px solid #d7deea",
                    borderRadius: 999,
                    padding: "8px 12px",
                    background: active ? "#0f766e" : "#ffffff",
                    color: active ? "#ffffff" : "#3b475a",
                    fontWeight: 800,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            id={`plan-panel-${detailTab}`}
            role="tabpanel"
            aria-labelledby={`plan-tab-${detailTab}`}
            style={{
              border: "1px solid #e2e7ee",
              borderRadius: 12,
              background: "#fbfcfe",
              padding: "15px 16px",
            }}
          >
            {detailTab === "summary" && (
              <div style={{ display: "grid", gap: 9 }}>
                <strong style={{ color: "#162033", fontSize: 16 }}>
                  {ROLE_LABELS[selected.candidateRole]}
                </strong>
                <p
                  style={{
                    margin: 0,
                    color: "#4d596d",
                    lineHeight: 1.65,
                  }}
                >
                  {selected.summary}
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "5px 9px",
                      background: "#eef4fb",
                      color: "#234e7a",
                      fontSize: 11.5,
                      fontWeight: 800,
                    }}
                  >
                    Property/project score {selected.totalScore}/100
                  </span>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "5px 9px",
                      background: "#fff7e8",
                      color: "#7a5816",
                      fontSize: 11.5,
                      fontWeight: 800,
                    }}
                  >
                    Current posture: {titleCasePosture(selected.posture)}
                  </span>
                </div>
              </div>
            )}

            {detailTab === "evidence" && (
              <DetailList
                items={selected.reasons}
                empty="The ranking carries no additional evidence reasons."
              />
            )}

            {detailTab === "risks" && (
              <div style={{ display: "grid", gap: 12 }}>
                <DetailList
                  items={selected.conditions}
                  empty="No scenario-specific conditions are recorded."
                />
                <details>
                  <summary
                    style={{
                      cursor: "pointer",
                      color: "#162033",
                      fontWeight: 800,
                      minHeight: 36,
                    }}
                  >
                    Conditions that would make Furlong stop or reconsider
                  </summary>
                  <div style={{ paddingTop: 8 }}>
                    <DetailList
                      items={plan.walkAwayGates}
                      empty="No canonical stop conditions are recorded."
                    />
                  </div>
                </details>
              </div>
            )}

            {detailTab === "economics" && (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                }}
              >
                {[
                  ["Overall property/project", selected.totalScore],
                  ["Property fit", selected.propertyFit],
                  ["Market viability", selected.marketViability],
                  ["Lifecycle resilience", selected.lifecycleResilience],
                  ["Tax resilience", selected.taxResilience],
                  ["Infrastructure resilience", selected.infrastructureResilience],
                ].map(([label, value]) => (
                  <div key={String(label)} style={scoreCell}>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "#6b7280",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      {label}
                    </span>
                    <strong style={{ color: "#162033", fontSize: 18 }}>
                      {value}/100
                    </strong>
                  </div>
                ))}
                <p
                  style={{
                    gridColumn: "1 / -1",
                    margin: 0,
                    color: "#5d687a",
                    fontSize: 12,
                    lineHeight: 1.55,
                  }}
                >
                  These are governed comparison dimensions, not substituted NOI,
                  cap rate, appraisal, cash flow, or purchase-price assumptions.
                  The detailed workspace below carries the underlying property
                  economics when the required evidence exists.
                </p>
              </div>
            )}

            {detailTab === "financing" && (
              <div style={{ display: "grid", gap: 8 }}>
                <strong style={{ color: "#162033", fontSize: 18 }}>
                  Property/project financing fit {selected.financeability}/100
                </strong>
                <p
                  style={{
                    margin: 0,
                    color: "#4d596d",
                    lineHeight: 1.65,
                  }}
                >
                  This score evaluates the property/project against the
                  available capital pathways. It does not evaluate the borrower
                  and is not lender approval, a term sheet, or a commitment.
                </p>
              </div>
            )}

            {detailTab === "next" && (
              <div style={{ display: "grid", gap: 10 }}>
                <strong style={{ color: "#162033", fontSize: 16 }}>
                  What still needs to be resolved for this plan
                </strong>
                <DetailList
                  items={selected.conditions}
                  empty="Open the detailed workspace below to review the remaining evidence."
                />
              </div>
            )}
          </div>

          <details
            style={{
              borderTop: "1px solid #e4e9f0",
              paddingTop: 11,
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                color: "#526074",
                fontSize: 12,
                fontWeight: 800,
                minHeight: 36,
              }}
            >
              How ranking works
            </summary>
            <p
              style={{
                margin: "8px 0 0",
                color: "#5d687a",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              {plan.rankingRule}
            </p>
          </details>

          {reportOffer && (
            <div data-testid="selected-plan-report-offer">{reportOffer}</div>
          )}

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: 11.5,
              lineHeight: 1.5,
            }}
          >
            The governed detailed workspace is now available below for this
            property. Switching plans changes the plan view; it does not rewrite
            the underlying evidence.
          </p>
        </section>
      )}

      <p
        style={{
          margin: 0,
          color: "#7a5a10",
          fontSize: 11.5,
          lineHeight: 1.5,
          fontWeight: 700,
        }}
      >
        Advisory only — not a loan approval, appraisal, permit, environmental
        clearance, or lender commitment.
      </p>
    </section>
  );
}
