import {
  PROPERTY_DISCOVERY_DISCLOSURES,
  propertyDiscovery,
} from "@/lib/source-intelligence/sourceIntelligenceRuntime";
import { chartSurface } from "@/lib/property/chartThemes";

/**
 * Borrower portal — Property Discovery status surface.
 *
 * Chart Table cohesion rollout (founder 2026-07-17): sits on the navigator
 * stage via chartSurface("buyer") — shared tokens, presentation only; the
 * governed discovery runtime and disclosures are unchanged.
 */

const surface = chartSurface("buyer");
const theme = surface.theme;

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#172033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const containerStyle = {
  ...surface.container,
  maxWidth: 1120,
  margin: "24px auto",
} as const;

const panelStyle = {
  ...surface.panel,
  padding: 18,
} as const;

export default function BorrowerPropertyDiscoveryPage() {
  const discovery = propertyDiscovery({});
  const sources = Array.isArray(discovery.sources) ? discovery.sources : [];

  return (
    <main style={shellStyle}>
      <section style={containerStyle}>
        <header>
          <p style={{ margin: "0 0 6px", ...surface.kicker }}>
            Borrower portal
          </p>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.15, color: theme.ink }}>
            Property Discovery
          </h1>
          <p style={{ maxWidth: 760, color: theme.inkSoft }}>
            Governed property discovery uses marketplace sources as advisory
            discovery intelligence before any institutional review.
          </p>
        </header>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0, fontSize: 20, color: theme.ink }}>Status</h2>
          <div style={{ display: "grid", gap: 6, color: theme.inkSoft }}>
            <span>Your document was received.</span>
            <span>Human review is pending.</span>
            <span>More information may be needed.</span>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0, fontSize: 20, color: theme.ink }}>Discovery Sources</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {sources.map((source) => {
              const record = source as Record<string, unknown>;

              return (
                <div
                  key={String(record.sourceId)}
                  style={{
                    ...surface.cell,
                    padding: 14,
                  }}
                >
                  <strong style={{ color: theme.ink }}>{String(record.sourceName)}</strong>
                  <p style={{ margin: "6px 0 0", color: theme.inkSoft }}>
                    {String(record.useBoundary)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0, fontSize: 20, color: theme.ink }}>Required Disclosures</h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: theme.inkSoft }}>
            {PROPERTY_DISCOVERY_DISCLOSURES.map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
