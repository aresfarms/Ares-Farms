import type {
  ScenarioCandidateRole,
  ScenarioRankingPlan,
} from "@/lib/intelligence/scenarioRankingPlan";

const ROLE_LABELS: Record<ScenarioCandidateRole, string> = {
  "best-single-enterprise": "Best single enterprise",
  "best-mixed-use": "Best mixed-use configuration",
  "customer-vision": "Customer vision",
  "best-distinct-alternative": "Best distinct alternative",
};

/**
 * Customer-facing rendering of the replay-captured top-three property decision.
 * Authority: FURLONG-VISION-001; FACILITATION-001; REG-SCORE-002/003;
 * TECH-SCORE-001; CANON-EXPL-001; PUBLIC-CLAIMS-001.
 */
export function PropertyDecisionRankingPanel({
  plan,
}: {
  plan: ScenarioRankingPlan;
}) {
  return (
    <section
      aria-labelledby="property-decision-ranking"
      data-testid="property-decision-ranking"
      style={{
        display: "grid",
        gap: 14,
        border: "2px solid #0f766e",
        borderRadius: 16,
        background: "#f4fbf9",
        padding: "18px 18px",
      }}
    >
      <div style={{ display: "grid", gap: 5 }}>
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
          style={{ margin: 0, fontSize: 24, color: "#101a2b" }}
        >
          Three property plans, ranked from the same evidence
        </h2>
        <p
          style={{
            margin: 0,
            maxWidth: 900,
            color: "#4d596d",
            fontSize: 13.5,
            lineHeight: 1.6,
          }}
        >
          Furlong compares the strongest single enterprise, the strongest
          compatible mixed-use configuration, and your selected vision. The
          highest property/project result leads; your preference never fixes
          the rank.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(235px, 1fr))",
        }}
      >
        {plan.scenarios.map((scenario, index) => (
          <article
            key={scenario.id}
            style={{
              display: "grid",
              gap: 7,
              border: index === 0 ? "2px solid #0f766e" : "1px solid #d7deea",
              borderRadius: 12,
              background: "#ffffff",
              padding: "14px 15px",
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 850,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: index === 0 ? "#0f766e" : "#607086",
              }}
            >
              Rank {index + 1} · {ROLE_LABELS[scenario.candidateRole]}
            </span>
            <strong
              style={{ color: "#162033", fontSize: 16, lineHeight: 1.3 }}
            >
              {scenario.title}
            </strong>
            <span
              style={{ color: "#526074", fontSize: 12.5, lineHeight: 1.5 }}
            >
              {scenario.summary}
            </span>
            <span
              style={{ color: "#0f766e", fontSize: 12, fontWeight: 800 }}
            >
              Property/project score {scenario.totalScore}/100
            </span>
            <span
              style={{ color: "#526074", fontSize: 11.5, lineHeight: 1.5 }}
            >
              Property/project financing fit {scenario.financeability}/100 ·
              borrower underwriting not evaluated
            </span>
          </article>
        ))}
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <span
          style={{ color: "#526074", fontSize: 11.5, lineHeight: 1.5 }}
        >
          {plan.rankingRule}
        </span>
        <strong
          style={{ color: "#7a5a10", fontSize: 11.5, lineHeight: 1.5 }}
        >
          Preliminary property intelligence is not a loan approval, appraisal,
          permit, or lender commitment.
        </strong>
      </div>
    </section>
  );
}
