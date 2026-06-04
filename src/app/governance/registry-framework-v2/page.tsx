"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  RegistryFrameworkV2CatalogResult,
  RegistryFrameworkV2CrossSourceConflict,
  RegistryFrameworkV2Entry,
  RegistryFrameworkV2Input,
  RegistryFrameworkV2Result,
  composeRegistryFrameworkV2,
} from "@/lib/registry/frameworkV2Runtime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  v2Result?: RegistryFrameworkV2Result;
};

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const containerStyle = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: 24,
  display: "grid",
  gap: 18,
} as const;

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 8,
} as const;

const mutedText = { color: "#5d687a", lineHeight: 1.5 } as const;

const inputStyle = {
  width: "100%",
  minHeight: 42,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 14,
  background: "#ffffff",
} as const;

function StatusBadge(props: {
  tone: "ready" | "review" | "blocked" | "neutral";
  label: string;
}) {
  const palette = {
    ready: { bg: "#dbf0e2", fg: "#1f5a32", border: "#a8d8b3" },
    review: { bg: "#fff4d6", fg: "#7a4d00", border: "#f0d27a" },
    blocked: { bg: "#fde4e4", fg: "#80222d", border: "#f4b1b7" },
    neutral: { bg: "#e3e8ef", fg: "#3b475a", border: "#bcc7d6" },
  } as const;
  const tone = palette[props.tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 999,
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.border}`,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {props.label}
    </span>
  );
}

function EntryCard(props: { entry: RegistryFrameworkV2Entry }) {
  const { entry } = props;
  return (
    <div style={{ ...panelStyle, padding: 12, marginBottom: 8 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.title}</div>
      <div style={{ ...mutedText, fontSize: 11, marginBottom: 6 }}>
        {entry.summary}
      </div>
      <ul style={{ marginLeft: 14, fontSize: 11, ...mutedText }}>
        {entry.fields.slice(0, 5).map((field, idx) => (
          <li key={`${entry.entryId}-${idx}`}>
            <strong>{field.label}:</strong> {field.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CatalogSection(props: { catalog: RegistryFrameworkV2CatalogResult }) {
  const { catalog } = props;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? catalog.entries : catalog.entries.slice(0, 3);

  return (
    <div style={{ ...panelStyle, padding: 14, marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{catalog.label}</div>
          <div style={{ ...mutedText, fontSize: 11 }}>
            review route: {catalog.reviewRoute}
          </div>
        </div>
        <StatusBadge
          tone="neutral"
          label={`${catalog.entries.length} entries`}
        />
      </div>
      {visible.length === 0 ? (
        <div style={mutedText}>No entries.</div>
      ) : (
        visible.map((entry) => (
          <EntryCard key={entry.entryId} entry={entry} />
        ))
      )}
      {catalog.entries.length > 3 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          style={{
            background: "transparent",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {expanded
            ? "Show fewer"
            : `Show all ${catalog.entries.length} entries`}
        </button>
      )}
    </div>
  );
}

function ConflictCard(props: {
  conflict: RegistryFrameworkV2CrossSourceConflict;
}) {
  return (
    <div
      style={{
        ...panelStyle,
        padding: 12,
        marginBottom: 8,
        borderLeft: "4px solid #c14757",
        background: "#fde4e4",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13 }}>{props.conflict.topic}</div>
      <div style={{ ...mutedText, fontSize: 12 }}>
        {props.conflict.description}
      </div>
    </div>
  );
}

export default function RegistryFrameworkV2Page() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [declaredCustomerTypes, setDeclaredCustomerTypes] = useState(
    "beginning farmer, rural small business"
  );
  const [intendedUses, setIntendedUses] = useState(
    "specialty crops, energy efficiency"
  );
  const [stateValue, setStateValue] = useState("MD");
  const [sovereignAllowed, setSovereignAllowed] = useState(false);
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<RegistryFrameworkV2Input>(
    () => ({
      reviewerRole,
      borrowerContext: {
        declaredCustomerTypes: declaredCustomerTypes
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        intendedUses: intendedUses
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        jurisdiction: stateValue ? { federal: true, state: stateValue } : null,
      },
      scope: { sovereignFederationAllowed: sovereignAllowed },
    }),
    [
      reviewerRole,
      declaredCustomerTypes,
      intendedUses,
      stateValue,
      sovereignAllowed,
    ]
  );

  const previewResult = useMemo(
    () => composeRegistryFrameworkV2(localInput),
    [localInput]
  );

  const result = serverResult?.v2Result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/governance/registry-framework-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localInput),
      });
      const data: ApiResponse = await response.json();
      setServerResult(data);
      if (!data.ok) {
        setError(data.error ?? "Unknown error from API");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown fetch error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={containerStyle}>
        <header style={{ ...panelStyle, padding: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>
                Registry Framework v2
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Internal registry framework composition over Certification
                Engine v2 (and the full canonical v2 stack) plus the legacy
                v1 registry framework. Internal evidence only — no external
                promotion, public verification, regulatory reliance, or any
                autonomous determination; no live external fetch; no
                source-certainty claim.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge tone="neutral" label="Internal registry only" />
            </div>
          </div>
        </header>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Reviewer input
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Reviewer role
              </span>
              <input
                style={inputStyle}
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Declared customer types
              </span>
              <input
                style={inputStyle}
                value={declaredCustomerTypes}
                onChange={(e) => setDeclaredCustomerTypes(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Intended uses
              </span>
              <input
                style={inputStyle}
                value={intendedUses}
                onChange={(e) => setIntendedUses(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>State</span>
              <input
                style={inputStyle}
                value={stateValue}
                onChange={(e) => setStateValue(e.target.value)}
              />
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={sovereignAllowed}
                onChange={(e) => setSovereignAllowed(e.target.checked)}
              />
              Sovereign federation authorized
            </label>
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              onClick={runComposition}
              disabled={loading}
              style={{
                padding: "10px 16px",
                background: "#1f4dd8",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: loading ? "default" : "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {loading ? "Composing…" : "POST to governed API"}
            </button>
            {error && (
              <span
                style={{
                  marginLeft: 12,
                  color: "#80222d",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {error}
              </span>
            )}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Summary
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            {[
              ["v2 catalogs", result.summary.v2CatalogCount],
              ["v2 entries", result.summary.v2EntryCount],
              [
                "Capital programs",
                result.summary.v2CapitalProgramEntryCount,
              ],
              ["Customer types", result.summary.v2CustomerTypeEntryCount],
              ["Capital categories", result.summary.v2CapitalCategoryEntryCount],
              [
                "Certification dims",
                result.summary.v2CertificationPostureEntryCount,
              ],
              ["Legacy catalogs", result.summary.legacyCatalogCount],
              [
                "Cross-source conflicts",
                result.summary.crossSourceConflictCount,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  ...panelStyle,
                  padding: 12,
                  background: "#f6f8fb",
                }}
              >
                <div style={{ fontSize: 12, ...mutedText }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            v2 governed catalogs
          </div>
          {result.v2Catalogs.map((catalog) => (
            <CatalogSection key={catalog.id} catalog={catalog} />
          ))}
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Legacy v1 registry summary
          </div>
          <div style={{ ...mutedText, fontSize: 13 }}>
            catalogs {result.legacyResult.catalogs.length} · modules{" "}
            {result.legacyResult.modules.length} · public surfaces{" "}
            {result.legacyResult.publicSurfaces.length} · contracts{" "}
            {result.legacyResult.eventContracts.length} · handoffs{" "}
            {result.legacyResult.handoffs.length} · total entries{" "}
            {result.legacyResult.summary.totalEntryCount}
          </div>
        </section>

        {result.crossSourceConflicts.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Cross-source conflicts ({result.crossSourceConflicts.length})
            </div>
            {result.crossSourceConflicts.map((conflict) => (
              <ConflictCard key={conflict.conflictId} conflict={conflict} />
            ))}
          </section>
        )}

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            Recommended review routes
          </div>
          <ul style={{ marginLeft: 16, ...mutedText }}>
            {result.recommendedReviewRoutes.map((route) => (
              <li key={route}>
                <Link href={route}>{route}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            Disclosures
          </div>
          <ul style={{ marginLeft: 16, ...mutedText, fontSize: 13 }}>
            {result.disclosures.map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
