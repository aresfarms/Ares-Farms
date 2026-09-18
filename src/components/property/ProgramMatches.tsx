"use client";

import { useState } from "react";

/**
 * Property → program matching (value-loop 4c). Lazily asks the public
 * financing-intelligence matcher what programs THIS property may fit, and renders
 * them illustratively + cited. No account. Reached by HTTP contract (no
 * cross-unit import). Never says approved / eligible / guaranteed.
 */

interface ProgramMatch {
  categoryId: string;
  label: string;
  matchedOn: string[];
  mayFit: string;
  condition?: string;
  citation: string;
}

interface VerifiedMatch {
  program_id: string;
  name: string;
  administering_body: string;
  verifiedStatement: string;
  basis: string;
  whyItMatters?: string;
  personSideCaveat: string;
  source_citation: string;
  asOf: string;
}

export interface HubzoneFactProp {
  hubzoneType: string;
  geoid: string;
  effective: string;
  expiration: string | null;
  isCurrent: boolean;
}

export function ProgramMatches({
  propertyType,
  state,
  sourceId,
  propertyId = null,
  verifiedOzTractId = null,
  ozAsOf = null,
  hubzone = null,
  hubzoneAsOf = null,
}: {
  propertyType: string;
  state: string;
  sourceId: string;
  /** For the verification audit ledger only — never rendered. */
  propertyId?: string | null;
  /** Verified place-facts from the server's snapshots — POSITIVE determinations
   *  only. Null (not designated, or geocode uncertain) → that program is omitted
   *  entirely; never a category-level "only if" conditional. */
  verifiedOzTractId?: string | null;
  ozAsOf?: string | null;
  hubzone?: HubzoneFactProp | null;
  hubzoneAsOf?: string | null;
}) {
  const [matches, setMatches] = useState<ProgramMatch[] | null>(null);
  const [verified, setVerified] = useState<VerifiedMatch[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const res = await fetch("/api/public/program-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyType, state, sourceId, propertyId,
          verifiedOzTractId, ozAsOf, hubzone, hubzoneAsOf,
        }),
      });
      const data = await res.json();
      setMatches(data.matches ?? []);
      setVerified(data.verified ?? []);
    } finally {
      setBusy(false);
    }
  }

  if (matches === null) {
    return (
      <button
        type="button"
        data-testid="program-match-button"
        onClick={load}
        disabled={busy}
        style={{
          justifySelf: "start", fontSize: 13, fontWeight: 700, cursor: "pointer",
          borderRadius: 999, padding: "6px 14px", border: "1px solid #cdd9ec",
          background: "#ffffff", color: "#334155",
        }}
      >
        {busy ? "Checking program criteria…" : "Check this property's program criteria →"}
      </button>
    );
  }

  // VERIFIED-ONLY (Caitlin directive 2026-06-10, "no more may-fit crap"): a
  // program renders ONLY as a verified property-side fact (rule + tract/zone id
  // + source + as-of, via the locked language). Nothing verified → render
  // NOTHING — no illustrative list, no "may fit", no disclaimer hedge.
  if (verified.length === 0) {
    return null;
  }

  return (
    <div data-testid="program-matches" style={{ display: "grid", gap: 8 }}>
      <div data-testid="verified-programs" style={{ display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 13, color: "#162033" }}>Verified property-side program criteria</strong>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {verified.map((v) => (
            <li key={v.program_id} data-testid="verified-program" style={{ border: "1px solid #b9e3d4", background: "#f4fbf8", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f6e56" }}>{v.name}</span>
              <span style={{ fontSize: 12, color: "#3b475a" }}>{v.verifiedStatement}</span>
              {v.whyItMatters && <span style={{ fontSize: 12, color: "#0f6e56" }}>{v.whyItMatters}</span>}
              <span style={{ fontSize: 11, color: "#5d687a" }}>Basis: {v.basis}</span>
              <span style={{ fontSize: 11, color: "#9a3412" }}>{v.personSideCaveat}</span>
              <span style={{ fontSize: 11, color: "#9db4d8" }}>Source: {v.source_citation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
