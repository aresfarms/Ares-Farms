import {
  ADVISORY_FUSION_RESULTS,
  REVENUE_OPPORTUNITY_REGISTRY,
  REVENUE_SOURCE_REQUIRED_DISCLOSURES,
  SELLABLE_CATALOG,
  PROGRAM_GRAPH,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

type RevenueSurfaceAudience = "internal" | "borrower" | "lender" | "sponsor";

type RevenueIntelligenceSurfaceProps = {
  audience: RevenueSurfaceAudience;
  title: string;
  eyebrow: string;
  routeLabel: string;
};

const audienceStatus: Record<RevenueSurfaceAudience, string> = {
  internal: "Review queue: source lineage, conflicts, and claims posture.",
  borrower: "Opportunities are advisory and review-bound.",
  lender: "Coordination view only. No commitment has been created.",
  sponsor: "Project support view only. Human review is pending.",
};

const audienceTone: Record<RevenueSurfaceAudience, string> = {
  internal: "#164e63",
  borrower: "#166534",
  lender: "#1d4ed8",
  sponsor: "#7c2d12",
};

export function RevenueIntelligenceSurface({
  audience,
  title,
  eyebrow,
  routeLabel,
}: RevenueIntelligenceSurfaceProps) {
  const tone = audienceTone[audience];
  const fusion = ADVISORY_FUSION_RESULTS[0];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#111827",
        padding: "32px",
      }}
    >
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 24,
        }}
      >
        <header
          style={{
            display: "grid",
            gap: 10,
            borderBottom: "1px solid #dbe4ee",
            paddingBottom: 20,
          }}
        >
          <p style={{ margin: 0, color: tone, fontWeight: 700 }}>{eyebrow}</p>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.15 }}>{title}</h1>
          <p style={{ margin: 0, maxWidth: 820, color: "#475569", fontSize: 16 }}>
            {audienceStatus[audience]}
          </p>
        </header>

        <section
          aria-label="Governance status"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 12,
          }}
        >
          {[
            "Your document was received.",
            "Human review is pending.",
            "More information may be needed.",
            "No final decision has been made.",
          ].map((message) => (
            <div
              key={message}
              style={{
                background: "white",
                border: "1px solid #dbe4ee",
                borderRadius: 8,
                padding: 14,
                minHeight: 72,
              }}
            >
              <strong style={{ color: tone }}>{message}</strong>
            </div>
          ))}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.8fr)",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            {REVENUE_OPPORTUNITY_REGISTRY.map((opportunity) => (
              <article
                key={opportunity.revenue_opportunity_id}
                style={{
                  background: "white",
                  border: "1px solid #dbe4ee",
                  borderRadius: 8,
                  padding: 18,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                      {opportunity.customer_type} / {opportunity.geography_scope}
                    </p>
                    <h2 style={{ margin: "4px 0 0", fontSize: 20 }}>
                      {opportunity.product_or_service_category}
                    </h2>
                  </div>
                  <span
                    style={{
                      alignSelf: "flex-start",
                      border: `1px solid ${tone}`,
                      color: tone,
                      borderRadius: 999,
                      padding: "5px 10px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {opportunity.projection_basis}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#475569" }}>
                  Program refs: {opportunity.program_refs.join(", ")}
                </p>
                <p style={{ margin: 0, color: "#475569" }}>
                  Review items: {opportunity.compliance_constraints.join(", ")}
                </p>
              </article>
            ))}
          </div>

          <aside
            style={{
              display: "grid",
              gap: 14,
              alignContent: "start",
            }}
          >
            <section
              style={{
                background: "white",
                border: "1px solid #dbe4ee",
                borderRadius: 8,
                padding: 18,
              }}
            >
              <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Catalog Signals</h2>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                {SELLABLE_CATALOG.map((item) => (
                  <li key={item.item_id}>{item.common_name}</li>
                ))}
              </ul>
            </section>

            <section
              style={{
                background: "white",
                border: "1px solid #dbe4ee",
                borderRadius: 8,
                padding: 18,
              }}
            >
              <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Program Graph</h2>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                {PROGRAM_GRAPH.map((program) => (
                  <li key={program.program_id}>{program.program_name}</li>
                ))}
              </ul>
            </section>

            <section
              style={{
                background: "white",
                border: "1px solid #dbe4ee",
                borderRadius: 8,
                padding: 18,
              }}
            >
              <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Replay Basis</h2>
              <p style={{ margin: 0, color: "#475569" }}>
                {fusion.replay_refs.join(", ")}
              </p>
            </section>
          </aside>
        </section>

        <section
          style={{
            background: "#111827",
            color: "white",
            borderRadius: 8,
            padding: 18,
            display: "grid",
            gap: 8,
          }}
        >
          <strong>{routeLabel}</strong>
          <p style={{ margin: 0, color: "#cbd5e1" }}>
            {REVENUE_SOURCE_REQUIRED_DISCLOSURES.join(" ")}
          </p>
        </section>
      </section>
    </main>
  );
}
