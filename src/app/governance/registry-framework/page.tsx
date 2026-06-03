"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  RegistryCatalogStatus,
  RegistryFrameworkInput,
  RegistryFrameworkResult,
  RegistryParticipantRoleSummary,
  evaluateRegistryFramework,
} from "@/lib/registry/frameworkRuntime";

/**
 * Registry Framework Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable internal registry catalogs.
 * - Vol II: blocks catalogs from becoming external promotion, public
 *   verification, regulatory reliance, lender commitment, or legal
 *   reliance.
 * - Vol III: uses deterministic backend-compatible composition.
 * - Vol III-B: displays human-review and production-block posture.
 * - Vol IV: routes reviewer next steps to evidence engine, certification
 *   engine, governance, module readiness, evidence packets, audit replay,
 *   reviews, and the controlled promotion gate.
 * - Vol V-VII: preserves disclosures, source authority, conformance, and
 *   no-live-action boundaries on internal registry output.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  frameworkResult?: RegistryFrameworkResult;
  governance?: {
    traceId?: string;
    versionRuntime?: { ok?: boolean };
    outputClassification?: { classificationLevel?: string };
  };
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
  text: string;
}) {
  const tones = {
    ready: { background: "#e7f5ed", color: "#047857" },
    review: { background: "#fff7ed", color: "#9a3412" },
    blocked: { background: "#fff1f0", color: "#b42318" },
    neutral: { background: "#eef2f7", color: "#475569" },
  } as const;
  const tone = tones[props.tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {props.text}
    </span>
  );
}

function SummaryCell(props: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid #d7deea",
        borderRadius: 6,
        padding: 10,
        background: "#f8fafc",
      }}
    >
      <strong style={{ fontSize: 22 }}>{props.value}</strong>
      <p style={{ ...mutedText, margin: "2px 0 0" }}>{props.label}</p>
    </div>
  );
}

function CatalogCard(props: { catalog: RegistryCatalogStatus }) {
  const catalog = props.catalog;

  return (
    <article
      style={{
        ...panelStyle,
        padding: 14,
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>{catalog.label}</h3>
          <p style={{ ...mutedText, margin: "2px 0 0", fontSize: 13 }}>
            {catalog.versionRef}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge tone="neutral" text={`${catalog.entryCount}`} />
          {catalog.productionBlocked ? (
            <StatusBadge tone="blocked" text="Production blocked" />
          ) : null}
        </div>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
        {catalog.notes.slice(0, 3).map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <Link
        href={catalog.reviewRoute}
        style={{
          color: "#1d4ed8",
          fontWeight: 800,
          textDecoration: "none",
          fontSize: 13,
        }}
      >
        Review at {catalog.reviewRoute}
      </Link>
    </article>
  );
}

function RoleRow(props: { role: RegistryParticipantRoleSummary }) {
  const role = props.role;

  return (
    <article
      style={{
        border: "1px solid #d7deea",
        borderRadius: 6,
        padding: 12,
        display: "grid",
        gap: 6,
        background: "#f8fafc",
      }}
    >
      <strong style={{ fontSize: 15 }}>{role.label}</strong>
      <p style={{ ...mutedText, margin: 0, fontSize: 13 }}>{role.scope}</p>
      <p style={{ ...mutedText, margin: 0, fontSize: 12 }}>
        Source: {role.authoritySource}
      </p>
      <p style={{ ...mutedText, margin: 0, fontSize: 12 }}>
        Review boundary: {role.reviewBoundary}
      </p>
    </article>
  );
}

export default function RegistryFrameworkPage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [audience, setAudience] = useState("");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<RegistryFrameworkInput>(
    () => ({
      reviewerRole: reviewerRole || null,
      scope: audience
        ? { audience: audience as "internal" | "borrower" | "lender" | "sponsor" | "public" }
        : null,
    }),
    [audience, reviewerRole]
  );

  const localResult = useMemo(
    () => evaluateRegistryFramework(input),
    [input]
  );
  const result = apiResponse?.frameworkResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/governance/registry-framework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, userId: reviewerRole }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Registry framework request failed.");
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown registry framework request error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        <section style={{ ...panelStyle, padding: 22, display: "grid", gap: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
              <span
                style={{
                  color: "#456077",
                  fontSize: 13,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                Registry Framework
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Module, Source, Surface, Promotion, and Role Registries
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Internal review-bound catalog over the canonical module
                manifest registry, event contract registry, handoff map,
                public surface gateway, source authority registry, controlled
                promotion gates, and participant role registry. Registry
                output is internal evidence only — no external promotion,
                public verification, regulatory reliance, or legal reliance is
                created. Registry output remains internal evidence unless
                separately promoted through governed controlled-promotion
                gates.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="Internal registry only" />
              <StatusBadge tone="blocked" text="No external promotion" />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}
              >
                Reviewer role
              </span>
              <input
                value={reviewerRole}
                onChange={(event) => setReviewerRole(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}
              >
                Audience filter
              </span>
              <select
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                style={inputStyle}
              >
                <option value="">All audiences</option>
                <option value="internal">Internal</option>
                <option value="borrower">Borrower</option>
                <option value="lender">Lender</option>
                <option value="sponsor">Sponsor</option>
                <option value="public">Public</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={submitForReview}
            disabled={submitting}
            style={{
              justifySelf: "start",
              minHeight: 42,
              border: 0,
              borderRadius: 6,
              padding: "0 16px",
              background: submitting ? "#94a3b8" : "#1d4ed8",
              color: "#ffffff",
              fontWeight: 800,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting
              ? "Composing for review..."
              : "Compose Registry Framework"}
          </button>

          {error ? (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fff1f0",
                color: "#991b1b",
                borderRadius: 8,
                padding: 12,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}
        </section>

        <section
          style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Framework Summary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <SummaryCell label="Catalogs" value={result.summary.catalogCount} />
            <SummaryCell
              label="Total entries"
              value={result.summary.totalEntryCount}
            />
            <SummaryCell
              label="Production-blocked entries"
              value={result.summary.productionBlockedEntryCount}
            />
            <SummaryCell
              label="Public surfaces"
              value={result.summary.publicSurfaceEntryCount}
            />
            <SummaryCell
              label="Internal-only entries"
              value={result.summary.internalOnlyEntryCount}
            />
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 10,
          }}
        >
          {result.catalogs.map((catalog) => (
            <CatalogCard key={catalog.id} catalog={catalog} />
          ))}
        </section>

        <section
          style={{ ...panelStyle, padding: 18, display: "grid", gap: 14 }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Controlled promotion gates</h2>
          {result.controlledPromotion.length === 0 ? (
            <p style={{ ...mutedText, margin: 0 }}>
              No controlled promotion gates in the current scope.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#334155" }}>
              {result.controlledPromotion.slice(0, 12).map((gate) => (
                <li key={gate.moduleId} style={{ marginBottom: 8 }}>
                  <strong>
                    {gate.title}
                    {gate.moduleNumber ? ` (Module ${gate.moduleNumber})` : ""}
                  </strong>{" "}
                  <span style={mutedText}>
                    — {gate.description} Route: {gate.route}.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          style={{ ...panelStyle, padding: 18, display: "grid", gap: 14 }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Participant role registry</h2>
          <p style={{ ...mutedText, margin: 0, maxWidth: 760 }}>
            Named, qualified review authorities sourced from the Master
            Volume series. The framework does not grant authority.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 10,
            }}
          >
            {result.participantRoles.slice(0, 12).map((role) => (
              <RoleRow key={role.roleId} role={role} />
            ))}
          </div>
        </section>

        <section
          style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Governance Evidence</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 10,
            }}
          >
            <StatusBadge tone="blocked" text="Production blocked" />
            <StatusBadge tone="review" text="Human review required" />
            <StatusBadge tone="blocked" text="Internal registry only" />
            <StatusBadge tone="blocked" text="No external promotion" />
            <StatusBadge tone="blocked" text="No public verification" />
            <StatusBadge tone="blocked" text="No regulatory reliance" />
          </div>
          {apiResponse?.governance ? (
            <p style={{ ...mutedText, margin: 0 }}>
              Trace {apiResponse.governance.traceId ?? "pending"} · version
              runtime{" "}
              {apiResponse.governance.versionRuntime?.ok ? "passed" : "pending"}{" "}
              · classification{" "}
              {apiResponse.governance.outputClassification?.classificationLevel ??
                "pending"}
            </p>
          ) : (
            <p style={{ ...mutedText, margin: 0 }}>
              Local preview is shown until the reviewer submits the framework
              for governed API review.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {result.recommendedReviewRoutes.slice(0, 10).map((route) => (
              <Link
                key={route}
                href={route}
                style={{
                  color: "#1d4ed8",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {route}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Disclosures</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
            {result.disclosures.slice(0, 12).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
