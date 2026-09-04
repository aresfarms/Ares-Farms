"use client";

import { useEffect, useState } from "react";

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
  acceptsBrokeredDeals: boolean;
  acceptsDirectBorrower: boolean;
  disclosure: string;
};

type MatchView = {
  matchId: string;
  score: number;
  reasons: string[];
  selected: boolean;
  provider: ProviderView;
};

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
          Capital Network
        </span>
        <strong style={{ fontSize: 16, color: "#101a2b" }}>Choose who you want to work with</strong>
        <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.55 }}>
          Furlong compares certified providers against declared geography, program, deal size, and other fit factors. This is matching, not underwriting or approval. Affiliation with Furlong never improves a provider&apos;s score.
        </span>
      </div>

      {loading ? (
        <span style={{ fontSize: 13, color: "#64748b" }}>Checking certified providers…</span>
      ) : matches.length === 0 ? (
        <div style={{ ...panel, background: "#f8fafc" }}>
          <strong style={{ color: "#334155", fontSize: 13.5 }}>No certified provider is ready for selection yet.</strong>
          <span style={{ color: "#64748b", fontSize: 12.5, lineHeight: 1.5 }}>
            Your case remains with the Furlong Capital Desk while the network is expanded. A candidate institution never receives your information merely because it appears in the network.
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
                {match.selected ? "Selected" : busyProvider === match.provider.providerId ? "Selecting…" : "Select this provider"}
              </button>
            </article>
          ))}
        </div>
      )}

      <span style={{ fontSize: 11.5, color: "#8090a0", lineHeight: 1.5 }}>
        Selecting a provider does not disclose or deliver your file. Provider access requires a frozen package, your consent to that exact provider/package/purpose/channel, verified recipient authority, and the governed delivery gates.
      </span>
      {message && <span role="status" style={{ fontSize: 12.5, color: message.includes("NOT") ? "#166534" : "#475569", lineHeight: 1.55 }}>{message}</span>}
    </section>
  );
}
