"use client";

import { useEffect, useState } from "react";

import { MAX_COMPARISON_PROVIDERS } from "@/lib/financing/managedProviderHandoff";

type ProviderView = {
  providerId: string;
  organizationName: string;
  providerRole: string;
  providerType: string;
  affiliation: string;
  website: string | null;
  states: string[];
  programs: string[];
  minDealAmount: number | null;
  maxDealAmount: number | null;
  publishedCreditBox: Record<string, unknown>;
  collateralPolicy: Record<string, unknown>;
  environmentalRequirements: Record<string, unknown>;
  typicalFirstResponseDays: number | null;
  typicalClosingDays: number | null;
  creditBoxSourceRefs: string[];
  creditBoxVerifiedAt: string | null;
  creditBoxEvidenceStatus: "SOURCE_VERIFIED" | "PROGRAM_APPETITE_ONLY";
  acceptsBrokeredDeals: boolean;
  acceptsDirectBorrower: boolean;
  disclosure: string;
};

type ExecutionReliabilityView = {
  verifiedOutcomeCount: number;
  closedFundedCount: number;
  closeRatePct: number | null;
  completedDispositionRatePct: number | null;
  medianFirstResponseDays: number | null;
  medianConsentToCloseDays: number | null;
  publicDisplayEligible: boolean;
  rankingTieBreakEligible: boolean;
  customerLabel: string;
  methodology: string;
};

type MatchView = {
  matchId: string;
  score: number;
  reasons: string[];
  selected: boolean;
  provider: ProviderView;
  executionReliability: ExecutionReliabilityView | null;
};

function publishedSummary(value: Record<string, unknown>): string | null {
  const summary = value.publishedSummary;
  return typeof summary === "string" && summary.trim() ? summary.trim() : null;
}

function formatVerifiedDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}

export function CapitalNetworkMatches({
  serviceRequestId,
  email,
}: {
  serviceRequestId: string;
  email: string;
}) {
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/capital-network/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "public-list", serviceRequestId, email }),
      });
      const data = await res.json();
      if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Provider matching is unavailable.");
      setMatches(Array.isArray(data.matches) ? data.matches : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Provider matching is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [serviceRequestId, email]);

  async function select(providerId: string) {
    setBusyProvider(providerId);
    setMessage(null);
    try {
      const res = await fetch("/api/capital-network/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select", serviceRequestId, email, providerId }),
      });
      const data = await res.json();
      if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Provider selection failed.");
      setMessage(
        "Provider selected. Your file has NOT been sent. Furlong must still freeze the exact package, obtain your package-specific consent, and verify the recipient before access or delivery.",
      );
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Provider selection failed.");
    } finally {
      setBusyProvider(null);
    }
  }

  const panel = {
    border: "1px solid #d7deea",
    borderRadius: 12,
    padding: "13px 14px",
    background: "#fff",
    display: "grid",
    gap: 7,
  } as const;

  return (
    <section style={{ borderTop: "1px solid #e6ecf3", paddingTop: 12, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#534AB7" }}>
          Private provider comparison
        </span>
        <strong style={{ fontSize: 16, color: "#101a2b" }}>Choose up to {MAX_COMPARISON_PROVIDERS} verified providers</strong>
        <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.55 }}>
          Furlong shows the strongest published credit-box fits and explains each match, including demonstrated closing performance when enough verified history exists. You may compare several providers, but your file is never sold, auctioned, or broadcast. Each provider requires your separate authorization and receives a separate expiring case room. Personal credit/income does not change a nonresidential match; neither affiliation nor compensation can improve a provider&apos;s rank.
        </span>
      </div>

      {loading ? (
        <span style={{ fontSize: 13, color: "#64748b" }}>Checking certified providers…</span>
      ) : matches.length === 0 ? (
        <div style={{ ...panel, background: "#f8fafc" }}>
          <strong style={{ color: "#334155", fontSize: 13.5 }}>No certified provider is ready for selection yet.</strong>
          <span style={{ color: "#64748b", fontSize: 12.5, lineHeight: 1.5 }}>
            Your case remains private in Furlong while the verified network is expanded. A candidate institution never receives your information merely because it appears in the network.
          </span>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 9 }}>
          {matches.map((match) => (
            <article key={match.matchId} style={panel}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <strong style={{ color: "#101a2b", fontSize: 14.5 }}>{match.provider.organizationName}</strong>
                  <span style={{ color: "#64748b", fontSize: 11.5 }}>
                    {match.provider.providerRole} · {match.provider.providerType.replaceAll("_", " ")} · Network fit {match.score}/100
                  </span>
                </div>
                {match.selected && (
                  <span style={{ alignSelf: "start", borderRadius: 999, padding: "4px 9px", background: "#e7f6ee", color: "#166534", fontSize: 11.5, fontWeight: 800 }}>SELECTED</span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.55 }}>
                {match.reasons.join(" · ")}
              </div>
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5 }}>
                {match.provider.disclosure}
              </div>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 9, padding: "9px 10px", background: "#fbfcfe", display: "grid", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ color: "#334155", fontSize: 11.8 }}>Published provider box</strong>
                  <span style={{ fontSize: 10.8, fontWeight: 800, color: match.provider.creditBoxEvidenceStatus === "SOURCE_VERIFIED" ? "#166534" : "#92400e" }}>
                    {match.provider.creditBoxEvidenceStatus === "SOURCE_VERIFIED" ? `SOURCE VERIFIED${formatVerifiedDate(match.provider.creditBoxVerifiedAt) ? ` · ${formatVerifiedDate(match.provider.creditBoxVerifiedAt)}` : ""}` : "PROGRAM APPETITE VERIFIED · BOX SOURCES PENDING"}
                  </span>
                </div>
                {publishedSummary(match.provider.publishedCreditBox) && <span style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5 }}><strong>Credit box:</strong> {publishedSummary(match.provider.publishedCreditBox)}</span>}
                {publishedSummary(match.provider.collateralPolicy) && <span style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5 }}><strong>Collateral:</strong> {publishedSummary(match.provider.collateralPolicy)}</span>}
                {publishedSummary(match.provider.environmentalRequirements) && <span style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5 }}><strong>Environmental:</strong> {publishedSummary(match.provider.environmentalRequirements)}</span>}
                {(match.provider.typicalFirstResponseDays != null || match.provider.typicalClosingDays != null) && (
                  <span style={{ fontSize: 11.5, color: "#475569" }}>
                    Provider-published expectation: {match.provider.typicalFirstResponseDays != null ? `first response ~${match.provider.typicalFirstResponseDays} days` : "response time not published"}{match.provider.typicalClosingDays != null ? ` · closing ~${match.provider.typicalClosingDays} days` : ""}.
                  </span>
                )}
                <span style={{ fontSize: 10.8, color: "#8090a0", lineHeight: 1.45 }}>
                  Published criteria help explain fit; they are not an approval. Personal credit and eligibility remain with the provider&apos;s authorized human process. Furlong-measured execution history is shown separately below when enough verified cases exist.
                </span>
              </div>
              {match.executionReliability && (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 9, padding: "8px 10px", background: "#f8fafc", display: "grid", gap: 3, fontSize: 11.5, color: "#475569" }}>
                  <strong style={{ color: "#334155" }}>Verified Furlong execution record</strong>
                  <span>{match.executionReliability.customerLabel}</span>
                  {match.executionReliability.publicDisplayEligible && (
                    <span>
                      {match.executionReliability.closeRatePct != null ? `Close/fund rate ${match.executionReliability.closeRatePct}% · ` : ""}
                      {match.executionReliability.medianFirstResponseDays != null ? `median first response ${match.executionReliability.medianFirstResponseDays} days · ` : ""}
                      {match.executionReliability.medianConsentToCloseDays != null ? `median consent-to-close ${match.executionReliability.medianConsentToCloseDays} days` : "closing-time history still developing"}
                    </span>
                  )}
                  <details><summary style={{ cursor: "pointer" }}>How this is calculated</summary><span>{match.executionReliability.methodology}</span></details>
                </div>
              )}
              {match.provider.website && (
                <a href={match.provider.website} target="_blank" rel="noopener noreferrer" style={{ color: "#534AB7", fontSize: 12.5, fontWeight: 700, width: "fit-content" }}>
                  Provider website ↗
                </a>
              )}
              <button
                type="button"
                disabled={match.selected || busyProvider !== null}
                onClick={() => void select(match.provider.providerId)}
                style={{ justifySelf: "start", border: 0, borderRadius: 9, padding: "8px 13px", background: match.selected ? "#cbd5e1" : "#534AB7", color: "#fff", fontWeight: 800, fontSize: 12.5, cursor: match.selected ? "default" : "pointer" }}
              >
                {match.selected ? "Comparison authorized" : busyProvider === match.provider.providerId ? "Adding…" : "Add to private comparison"}
              </button>
            </article>
          ))}
        </div>
      )}

      <span style={{ fontSize: 11.5, color: "#8090a0", lineHeight: 1.5 }}>
        {matches.filter((match) => match.selected).length} of {MAX_COMPARISON_PROVIDERS} comparison slots selected. Selecting a provider does not disclose or deliver your file. Each provider requires a frozen package, separate exact-recipient consent, verified recipient authority, and an expiring case room. You can revoke one provider without affecting the others.
      </span>
      {message && <span role="status" style={{ fontSize: 12.5, color: message.includes("NOT") ? "#166534" : "#475569", lineHeight: 1.55 }}>{message}</span>}
    </section>
  );
}
