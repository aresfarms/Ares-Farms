// DIVEST-001: reach property data via the core-backbone property-discovery
// CONTRACT, never the source-intelligence unit's internals directly (keeps
// lender-sponsor-surfaces separable from source-intelligence).
import {
  PROPERTY_DISCOVERY_DISCLOSURES,
  propertyDiscovery,
} from "@/lib/property-discovery";

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#172033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const containerStyle = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "28px 20px",
  display: "grid",
  gap: 18,
} as const;

const panelStyle = {
  border: "1px solid #d8dee8",
  borderRadius: 8,
  background: "#ffffff",
  padding: 18,
} as const;

export default function LenderPropertyOpportunitiesPage() {
  const discovery = propertyDiscovery({});
  const sources = Array.isArray(discovery.sources) ? discovery.sources : [];

  return (
    <main style={shellStyle}>
      <section style={containerStyle}>
        <header>
          <p style={{ margin: "0 0 6px", color: "#546276", fontSize: 14 }}>
            Lender surface
          </p>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.15 }}>
            Property Opportunities
          </h1>
          <p style={{ maxWidth: 760, color: "#4d5a6c" }}>
            Property opportunity views are coordination surfaces only. They do
            not create commitments, underwriting outcomes, or collateral
            determinations.
          </p>
        </header>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>Review Posture</h2>
          <div style={{ display: "grid", gap: 6, color: "#334155" }}>
            <span>Your document was received.</span>
            <span>Human review is pending.</span>
            <span>More information may be needed.</span>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>Available Source Types</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {sources.map((source) => {
              const record = source as Record<string, unknown>;

              return (
                <div
                  key={String(record.sourceId)}
                  style={{
                    border: "1px solid #e1e7f0",
                    borderRadius: 8,
                    padding: 14,
                  }}
                >
                  <strong>{String(record.sourceName)}</strong>
                  <p style={{ margin: "6px 0 0", color: "#526073" }}>
                    Authority tier: {String(record.authorityTier)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>Disclosures</h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#334155" }}>
            {PROPERTY_DISCOVERY_DISCLOSURES.map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
