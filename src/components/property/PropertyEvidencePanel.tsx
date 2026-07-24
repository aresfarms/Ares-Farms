import type { PropertyEvidenceManifest, ManifestStatus } from "@/lib/property/propertyEvidenceManifest";

const STATUS_LABEL: Record<ManifestStatus, string> = {
  verified: "Verified",
  supported: "Supported",
  inferred: "Inferred",
  unresolved: "Unknown",
  stale: "Stale",
  "professional-confirmation-required": "Confirmation required",
};

const STATUS_MARK: Record<ManifestStatus, string> = {
  verified: "✓",
  supported: "◐",
  inferred: "≈",
  unresolved: "?",
  stale: "↻",
  "professional-confirmation-required": "!",
};

export function PropertyEvidencePanel({ manifest }: { manifest: PropertyEvidenceManifest }) {
  const blockers = manifest.items.filter((item) => ["unresolved", "stale", "professional-confirmation-required"].includes(item.status));
  return (
    <section data-testid="property-evidence-panel" aria-label="Property evidence status" className="report-section" style={{ display: "grid", gap: 14, border: "1px solid #d7deea", borderRadius: 14, padding: 18, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#667085" }}>Evidence manifest</div>
          <h2 style={{ margin: "4px 0 0", fontSize: 20, color: "#101a2b" }}>What is known—and what still needs proof</h2>
        </div>
        <span data-reliance={manifest.relianceAllowed ? "allowed" : "blocked"} style={{ borderRadius: 999, padding: "6px 11px", fontSize: 12, fontWeight: 800, background: manifest.relianceAllowed ? "#e8f5ee" : "#fff2df", color: manifest.relianceAllowed ? "#166534" : "#92400e" }}>
          {manifest.relianceAllowed ? "Evidence ready for reliance" : `${blockers.length} item${blockers.length === 1 ? "" : "s"} block final reliance`}
        </span>
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {manifest.items.map((item) => (
          <article key={item.id} data-evidence-status={item.status} style={{ border: "1px solid #e5e9f0", borderRadius: 10, padding: "11px 13px", display: "grid", gap: 5 }}>
            <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
              <strong aria-hidden style={{ width: 20, textAlign: "center" }}>{STATUS_MARK[item.status]}</strong>
              <strong style={{ color: "#101a2b" }}>{item.label}</strong>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: item.status === "verified" ? "#166534" : "#92400e" }}>{STATUS_LABEL[item.status]}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#4d596d" }}>{item.summary}</p>
            {(item.authority || item.reference || item.asOf) && <div style={{ fontSize: 11.5, color: "#667085" }}>{[item.authority, item.reference, item.asOf ? `As of ${item.asOf}` : null].filter(Boolean).join(" · ")}</div>}
            {item.warnings.map((warning) => <div key={warning} style={{ fontSize: 12, color: "#7c2d12" }}>{warning}</div>)}
          </article>
        ))}
      </div>
      {!manifest.relianceAllowed && <div style={{ borderLeft: "4px solid #b8862f", background: "#faf6ec", padding: "10px 12px", fontSize: 12.5, color: "#4d596d" }}><strong style={{ color: "#101a2b" }}>Before relying on this analysis:</strong> refresh or resolve {manifest.unresolvedDomains.join(", ")} evidence.</div>}
    </section>
  );
}
