"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { DiscoveryFlow } from "@/lib/discovery/discoveryFlow";

/**
 * Place-first discovery card — the correct PRIMARY journey for place/property
 * facts (place-facts · opportunity-zone · property-discovery). Location comes
 * FIRST (address / parcel / county / state); persona/customer-type is only a
 * later, secondary step. Never renders the generic persona intake as step one.
 *
 * Anonymous ≠ skip place facts: no account or name is required, but the place
 * facts are the point. Honest by construction (same standard as the place-fact
 * badges): live per-address resolution is gated behind operator activation
 * (Module 22/23, liveFetchAllowed=false), so this surface NEVER fabricates a
 * result — it collects the location, states exactly which verified facts we
 * cover with their source + confidence + advisory disclaimers, and routes to the
 * verified inventory where those facts are already attached to each listing.
 *
 * Governance basis: Master Volume VI — Property Discovery & Canonical Property
 * Governance, separated from general customer/revenue intelligence.
 */

const HEAD: Record<DiscoveryFlow, { eyebrow: string; title: string; lede: string }> = {
  "opportunity-zone": {
    eyebrow: "Opportunity Zone place-fact",
    title: "Look up a location's Opportunity Zone status",
    lede: "Enter a location to check whether its census tract is a designated Qualified Opportunity Zone — a published government fact about the place, not about you.",
  },
  "place-facts": {
    eyebrow: "Place-facts — public government reference",
    title: "Check a location's verified place-facts",
    lede: "Start with the place. We report published government designations for a location — Opportunity Zone, rural eligibility, flood, historic, NMTC — with their source and date.",
  },
  "property-discovery": {
    eyebrow: "Property discovery",
    title: "Start with a property or place",
    lede: "Tell us the location you're looking at. We attach verified place-facts to every property in the inventory so you can see them before anything else.",
  },
  "possibilities-persona": { eyebrow: "", title: "", lede: "" },
};

const COVERAGE: { label: string; source: string; confidence: string; disclaimer: string }[] = [
  { label: "Opportunity Zone", source: "HUD GIS / Treasury (IRC §1400Z-1) + U.S. Census geocoder · public domain", confidence: "Verified government snapshot (dated)", disclaimer: "States whether the place's tract is designated — not eligibility, qualification, or a guaranteed benefit for any person." },
  { label: "Rural eligibility (USDA)", source: "USDA Rural Development area layer · public domain", confidence: "Verified government snapshot (dated)", disclaimer: "Describes the area's published rural designation — program eligibility for a person is a separate, licensed determination." },
  { label: "Flood (FEMA)", source: "FEMA National Flood Hazard Layer · public domain", confidence: "Verified government snapshot (dated)", disclaimer: "Reports the published Special Flood Hazard Area status of the place — verify current status with FEMA." },
  { label: "Historic (NPS)", source: "National Register of Historic Places (NPS) · public domain", confidence: "Verified government snapshot (dated)", disclaimer: "Reports the published historic listing of the place — not a person's eligibility for any credit." },
  { label: "NMTC low-income community", source: "CDFI Fund NMTC-eligible tracts · public domain", confidence: "Verified government snapshot (dated)", disclaimer: "States whether the tract is NMTC-qualified — a place-fact, not a person-side determination." },
];

type PlaceFactsResponse = {
  ok: boolean;
  error?: string;
  verifiedPrograms?: Array<{
    program_id: string;
    name: string;
    verifiedStatement: string;
    basis: string;
    administering_body: string;
    asOf: string;
  }>;
  placeFacts?: {
    opportunityZone?: { tractId: string; rural: boolean; asOf: string } | null;
    hubzone?: {
      hubzoneType: string;
      geoid: string;
      effective: string;
      expiration: string | null;
      isCurrent: boolean;
      asOf: string;
    } | null;
    flood?: { floodZone: string; asOf: string } | null;
    historic?: { historicName: string | null; asOf: string } | null;
    nmtc?: { tractId: string; asOf: string } | null;
  };
  verification?: {
    status: "verified" | "partial" | "blocked" | "unverifiable";
    normalizedAddress: string | null;
    parsedAddress?: {
      street: string;
      city: string;
      state: string;
      zip: string;
    } | null;
    restrictions: string[];
    warnings: string[];
    lookupOutcomes?: {
      opportunityZone: "matched" | "no-match" | "error" | "not-run" | "gated";
      nmtc: "matched" | "no-match" | "error" | "not-run" | "gated";
      hubzone: "matched" | "no-match" | "error" | "not-run" | "gated";
      flood: "matched" | "no-match" | "error" | "not-run" | "gated";
      historic: "matched" | "no-match" | "error" | "not-run" | "gated";
    };
  };
};

export function PlaceFirstDiscovery({
  flow,
  embedded = false,
}: {
  flow: DiscoveryFlow;
  embedded?: boolean;
}) {
  const head = HEAD[flow] ?? HEAD["place-facts"];
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [parcel, setParcel] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlaceFactsResponse | null>(null);
  const [jumpCue, setJumpCue] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const fullAddress = [streetAddress.trim(), city.trim(), stateCode.trim()]
    .filter(Boolean)
    .join(", ");
  const located = [
    fullAddress,
    county.trim() && stateCode.trim() ? `${county.trim()} County, ${stateCode.trim()}` : county.trim(),
    parcel.trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  async function checkPlaceFacts() {
    setChecked(true);
    setBusy(true);
    setError(null);
    setJumpCue("Preparing your location results below.");

    const exactAddress = fullAddress;
    const location = [
      city.trim(),
      county.trim() ? `${county.trim()} County` : "",
      stateCode.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    if (!streetAddress.trim() || !city.trim() || !stateCode.trim()) {
      setResult(null);
      setError("Enter the street address, city, and state so Furlong can verify the full location against public sources.");
      setBusy(false);
      setJumpCue("Add the full address first, then we will jump you to the result section.");
      return;
    }

    try {
      const res = await fetch("/api/public/property-facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exactAddress,
          location: location || null,
          stateCode: stateCode.trim() || null,
          rawInput: [streetAddress.trim(), city.trim(), county.trim(), stateCode.trim(), parcel.trim()]
            .filter(Boolean)
            .join(" · "),
          notes: parcel.trim() ? `Parcel reference: ${parcel.trim()}` : null,
        }),
      });

      const data = (await res.json()) as PlaceFactsResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "The location place-facts lookup could not be completed.");
      }

      setResult(data);
    } catch (lookupError) {
      setResult(null);
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "The location place-facts lookup could not be completed."
      );
    } finally {
      setBusy(false);
    }
  }

  const verification = result?.verification;
  const verifiedPrograms = result?.verifiedPrograms ?? [];
  const liveFacts = result?.placeFacts;
  const sourceOutcomeCards = verification?.lookupOutcomes
    ? [
        {
          id: "opportunity-zone",
          label: "Opportunity Zone",
          outcome: verification.lookupOutcomes.opportunityZone,
        },
        {
          id: "nmtc",
          label: "NMTC",
          outcome: verification.lookupOutcomes.nmtc,
        },
        {
          id: "hubzone",
          label: "HUBZone",
          outcome: verification.lookupOutcomes.hubzone,
        },
        {
          id: "flood",
          label: "FEMA flood",
          outcome: verification.lookupOutcomes.flood,
        },
        {
          id: "historic",
          label: "Historic / NPS",
          outcome: verification.lookupOutcomes.historic,
        },
      ]
    : [];
  const checkedSourceCount = sourceOutcomeCards.filter(
    (item) => item.outcome === "matched" || item.outcome === "no-match"
  ).length;
  const additionalPositiveMatchCount =
    sourceOutcomeCards.filter((item) => item.outcome === "matched").length;
  const additionalSourceBottomLine =
    sourceOutcomeCards.length === 0
      ? null
      : checkedSourceCount === 0
        ? "Furlong could not complete the currently enabled source checks for this address at this time, so it cannot responsibly state that no other place-fact or program-support matches exist."
        : additionalPositiveMatchCount === 0
          ? "Furlong checked the currently enabled public sources and did not confirm any additional positive place-fact or program-support matches for this address."
          : additionalPositiveMatchCount === 1
            ? "Furlong confirmed one positive place-fact or program-support match above. No other checked sources returned an additional positive match."
            : `Furlong confirmed ${additionalPositiveMatchCount} positive place-fact or program-support matches above. No other checked sources returned an additional positive match.`;
  const analysisHref = (() => {
    if (!verification || verification.status === "blocked" || verification.status === "unverifiable") {
      return null;
    }

    const parsed = verification.parsedAddress;
    const titleBase = verification.normalizedAddress || fullAddress || located || "Imported property";
    const title = parsed?.street
      ? `${parsed.street} analysis`
      : `${titleBase} analysis`;
    const locationLabel = parsed
      ? [parsed.city, parsed.state].filter(Boolean).join(", ")
      : [city.trim(), stateCode.trim()].filter(Boolean).join(", ") || located || titleBase;

    const positiveSignals = [
      liveFacts?.opportunityZone ? `Opportunity Zone tract ${liveFacts.opportunityZone.tractId}` : null,
      liveFacts?.nmtc ? `NMTC tract ${liveFacts.nmtc.tractId}` : null,
      liveFacts?.hubzone ? `HUBZone ${liveFacts.hubzone.hubzoneType}` : null,
      liveFacts?.flood ? `FEMA flood zone ${liveFacts.flood.floodZone}` : null,
      liveFacts?.historic
        ? liveFacts.historic.historicName
          ? `Historic area ${liveFacts.historic.historicName}`
          : "National Register historic area"
        : null,
    ].filter(Boolean);

    const params = new URLSearchParams();
    params.set("mode", "possibilities");
    params.set("entry", "property-brief");
    params.set("propertyId", "imported:place-facts");
    params.set("propertyType", "place-led property");
    params.set("location", locationLabel || "Verified location");
    params.set("title", title);
    params.set("priceLabel", "Price not yet verified");
    params.set("sourceLabel", "Furlong verified address check");
    params.set("sourceVerificationStatus", "verified-address-only");
    params.set("currentLabel", "Imported from Furlong place-facts");
    if (verification.normalizedAddress) params.set("exactAddress", verification.normalizedAddress);
    if (parsed?.city) params.set("town", parsed.city);
    if (county.trim()) params.set("county", county.trim());
    if (parsed?.state || stateCode.trim()) params.set("state", parsed?.state ?? stateCode.trim());
    if (verifiedPrograms.length > 0) {
      params.set("pathways", verifiedPrograms.map((program) => program.name).join(", "));
    }
    const descriptionParts = [
      "Imported from the Furlong place-facts screen.",
      positiveSignals.length > 0
        ? `Verified place-fact signals: ${positiveSignals.join("; ")}.`
        : "No positive place-fact matches were confirmed during the initial verification pass.",
      additionalSourceBottomLine,
    ].filter(Boolean);
    params.set("description", descriptionParts.join(" "));
    return `/discover?${params.toString()}`;
  })();

  useEffect(() => {
    if (!checked || busy) return;
    if (!error && !result) return;

    resultRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setJumpCue("Jumped to your location results.");
  }, [busy, checked, error, result]);

  return (
    <section data-testid="place-first-discovery" data-flow={flow} aria-label="Place-first discovery"
      style={{
        display: "grid",
        gap: embedded ? 18 : 22,
        maxWidth: embedded ? "none" : 760,
        border: embedded ? "none" : "1px solid #d7deea",
        borderRadius: embedded ? 0 : 16,
        background: embedded ? "transparent" : "#fff",
        padding: embedded ? 0 : "26px 28px",
      }}>
      {!embedded && (
        <header style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "#854F0B" }}>{head.eyebrow}</span>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.18, color: "#101a2b" }}>{head.title}</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "#5d687a", lineHeight: 1.55 }}>{head.lede}</p>
        </header>
      )}

      {/* ── Location FIRST ──────────────────────────────────────────────────── */}
      <div data-testid="place-inputs" style={{ display: "grid", gap: 12, border: "1px solid #e6ebf2", borderRadius: 12, padding: embedded ? "18px 18px" : "16px 18px", background: "#fff" }}>
        <strong style={{ fontSize: embedded ? 16 : 13.5, color: "#1f2a3d" }}>
          {embedded ? "Start with the verified address" : "Where is the location?"}
        </strong>
        {embedded && (
          <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.6, maxWidth: 820 }}>
            Results appear right below — checked facts carry into the analysis automatically.
          </span>
        )}
        <input
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          placeholder="Street address (e.g. 123 Main St)"
          style={{ fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1" }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            style={{ flex: "1 1 180px", fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1" }}
          />
          <input
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="State (e.g. WV)"
            maxLength={2}
            style={{ width: 110, fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1" }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="County (optional but helpful)"
            style={{ flex: "1 1 200px", fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1" }}
          />
          <input
            value={parcel}
            onChange={(e) => setParcel(e.target.value)}
            placeholder="Parcel / APN (optional)"
            style={{ flex: "1 1 220px", fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1", maxWidth: 360 }}
          />
        </div>
        <div style={{ display: "grid", gap: 8, justifySelf: "start" }}>
          <button
            type="button"
            data-testid="place-check"
            onClick={() => void checkPlaceFacts()}
            aria-describedby="place-facts-jump-cue"
            style={{
              justifySelf: "start",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              minHeight: 46,
              fontSize: 14,
              fontWeight: 800,
              color: "#fff",
              background: busy ? "#9a6730" : "#854F0B",
              border: "none",
              borderRadius: 999,
              padding: "10px 22px",
              cursor: busy ? "progress" : "pointer",
              boxShadow: busy ? "0 0 0 3px rgba(133,79,11,0.12)" : "0 10px 24px rgba(133,79,11,0.18)",
            }}
          >
            <span>{busy ? "Checking and jumping to results..." : "Check this location and jump to results →"}</span>
          </button>
          <span
            id="place-facts-jump-cue"
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: busy ? "#854F0B" : jumpCue ? "#0f766e" : "#7a8aa0",
              lineHeight: 1.45,
            }}
          >
            {busy
              ? "Furlong is verifying the address now and will move you straight to the answer block."
              : jumpCue ?? ""}
          </span>
        </div>
        <span style={{ fontSize: 11.5, color: "#9aa6b6" }}>
          County and parcel are optional — some public records start there.
        </span>
      </div>

      {/* ── Then: verified place-facts coverage + source confidence + disclaimers ─ */}
      <div data-testid="place-facts-coverage" style={{ display: "grid", gap: 10 }}>
        <strong style={{ fontSize: embedded ? 15 : 14, color: "#101a2b" }}>
          {checked && located ? `We check ${located} for:` : "We check any U.S. address for:"}
        </strong>
        {checked && !result && !error && (
          <p data-testid="live-gated-note" style={{ margin: 0, fontSize: 12.5, color: "#7a8aa0", lineHeight: 1.5 }}>
            Furlong is verifying the location against public place-fact sources now.
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {COVERAGE.map((c) => (
            <span
              key={c.label}
              style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", border: "1px solid #bfe4db", background: "#f2fbf8", borderRadius: 999, padding: "4px 11px" }}
            >
              {c.label}
            </span>
          ))}
        </div>
        <details>
          <summary style={{ cursor: "pointer", listStyle: "none", fontSize: 12, color: "#7a8aa0" }}>
            What each check means + sources ▸
          </summary>
          <div style={{ display: "grid", gap: 8, paddingTop: 8 }}>
            {COVERAGE.map((c) => (
              <div key={c.label} style={{ border: "1px solid #e6ebf2", borderRadius: 10, padding: "10px 14px", display: "grid", gap: 3, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 13.5, color: "#1f2a3d" }}>{c.label}</strong>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#0f766e" }}>{c.confidence}</span>
                </div>
                <span style={{ fontSize: 12.5, color: "#5d687a", lineHeight: 1.45 }}>{c.disclaimer}</span>
                <span style={{ fontSize: 11.5, color: "#9aa6b6" }}>Source: {c.source}</span>
              </div>
            ))}
          </div>
        </details>
        <p style={{ margin: 0, fontSize: 12, color: "#7a8aa0", lineHeight: 1.5 }}>
          Advisory only — place-facts describe the place, not your eligibility.
        </p>
        {(error || result) && (
          <div
            id="location-verification-result"
            ref={resultRef}
            style={{ display: "grid", gap: 10, border: "1px solid #e6ebf2", borderRadius: 12, padding: "14px 16px", background: "#fbfdff", scrollMarginTop: 24 }}
          >
            <strong style={{ fontSize: 14, color: "#101a2b" }}>Location verification result</strong>
            {error && (
              <span style={{ fontSize: 12.5, color: "#b42318", lineHeight: 1.5 }}>{error}</span>
            )}
            {result && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#0f766e", background: "#ecfdf3", border: "1px solid #a6f4c5", borderRadius: 999, padding: "6px 10px" }}>
                    {verification?.status === "verified"
                      ? "Verified address"
                      : verification?.status === "partial"
                        ? "Partially verified"
                        : verification?.status === "blocked"
                          ? "Restricted input"
                          : "Unverifiable input"}
                  </span>
                  {verification?.normalizedAddress && (
                    <span style={{ fontSize: 12.5, color: "#475467", lineHeight: 1.5 }}>
                      {verification.normalizedAddress}
                    </span>
                  )}
                </div>

                {verification?.restrictions?.length ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {verification.restrictions.map((item) => (
                      <span key={item} style={{ fontSize: 12.5, color: "#b42318", lineHeight: 1.5 }}>{item}</span>
                    ))}
                  </div>
                ) : null}

                {verification?.warnings?.length ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {verification.warnings.map((item) => (
                      <span key={item} style={{ fontSize: 12.5, color: "#8a6d3b", lineHeight: 1.5 }}>{item}</span>
                    ))}
                  </div>
                ) : null}

                {analysisHref && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    <Link
                      href={analysisHref}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 42,
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: "#fff",
                        background: "#0f766e",
                        borderRadius: 999,
                        padding: "10px 18px",
                        textDecoration: "none",
                      }}
                    >
                      Take this into analysis →
                    </Link>
                    <span style={{ fontSize: 12.5, color: "#5d687a", lineHeight: 1.5 }}>
                      Carry this verified address and what Furlong already checked straight into the property analysis workspace.
                    </span>
                  </div>
                )}

                {sourceOutcomeCards.length > 0 && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <strong style={{ fontSize: 13.5, color: "#162033" }}>What Furlong actually checked</strong>
                    <div style={{ display: "grid", gap: 8 }}>
                      {sourceOutcomeCards.map((item) => (
                        <div key={item.id} style={{ border: "1px solid #dbe4ee", borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 12.75, color: "#162033" }}>{item.label}</strong>
                          <span style={{ fontSize: 12, fontWeight: 800, color: item.outcome === "matched" ? "#0f766e" : item.outcome === "no-match" ? "#475467" : item.outcome === "gated" ? "#854F0B" : "#b42318" }}>
                            {item.outcome === "matched"
                              ? "Checked and matched"
                              : item.outcome === "no-match"
                                ? "Checked and no positive match"
                                : item.outcome === "gated"
                                  ? "Not run — governed gate"
                                  : item.outcome === "not-run"
                                    ? "Not run"
                                    : "Attempted but not completed"}
                          </span>
                        </div>
                      ))}
                    </div>
                    {additionalSourceBottomLine && (
                      <span style={{ fontSize: 12.5, color: "#475467", lineHeight: 1.55 }}>
                        {additionalSourceBottomLine}
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: "grid", gap: 8 }}>
                  {liveFacts?.opportunityZone && (
                    <div style={{ border: "1px solid #dbe4ee", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: "#162033" }}>Opportunity Zone</strong>
                      <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>
                        Tract {liveFacts.opportunityZone.tractId}{liveFacts.opportunityZone.rural ? " · rural tract" : ""}.
                      </span>
                    </div>
                  )}
                  {liveFacts?.hubzone && (
                    <div style={{ border: "1px solid #dbe4ee", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: "#162033" }}>HUBZone</strong>
                      <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>
                        {liveFacts.hubzone.hubzoneType} · GEOID {liveFacts.hubzone.geoid}
                        {liveFacts.hubzone.isCurrent ? " · currently designated" : " · not current"}.
                      </span>
                    </div>
                  )}
                  {liveFacts?.flood && (
                    <div style={{ border: "1px solid #dbe4ee", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: "#162033" }}>FEMA flood</strong>
                      <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>
                        Special Flood Hazard Area, Zone {liveFacts.flood.floodZone}.
                      </span>
                    </div>
                  )}
                  {liveFacts?.historic && (
                    <div style={{ border: "1px solid #dbe4ee", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: "#162033" }}>Historic context</strong>
                      <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>
                        National Register area{liveFacts.historic.historicName ? ` — ${liveFacts.historic.historicName}` : ""}.
                      </span>
                    </div>
                  )}
                  {liveFacts?.nmtc && (
                    <div style={{ border: "1px solid #dbe4ee", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: "#162033" }}>NMTC tract</strong>
                      <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>
                        Tract {liveFacts.nmtc.tractId} is NMTC-qualified in the current snapshot.
                      </span>
                    </div>
                  )}
                  {verifiedPrograms.map((program) => (
                    <div key={program.program_id} style={{ border: "1px solid #b9e3d4", background: "#f4fbf8", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: "#0f6e56" }}>{program.name}</strong>
                      <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}>{program.verifiedStatement}</span>
                      <span style={{ fontSize: 11.5, color: "#5d687a" }}>{program.basis}</span>
                    </div>
                  ))}
                  {!liveFacts?.opportunityZone &&
                    !liveFacts?.hubzone &&
                    !liveFacts?.flood &&
                    !liveFacts?.historic &&
                    !liveFacts?.nmtc &&
                    verifiedPrograms.length === 0 && (
                      <span style={{ fontSize: 12.5, color: "#7a8aa0", lineHeight: 1.55 }}>
                        {verification?.lookupOutcomes &&
                        [
                          verification.lookupOutcomes.opportunityZone,
                          verification.lookupOutcomes.nmtc,
                          verification.lookupOutcomes.hubzone,
                          verification.lookupOutcomes.flood,
                          verification.lookupOutcomes.historic,
                        ].every((value) => value === "matched" || value === "no-match")
                          ? "Furlong checked the currently enabled live sources for this address and did not find a positive OZ, NMTC, HUBZone, flood, or historic match."
                          : "No positive place-fact matches were confirmed yet, and one or more source checks still did not complete cleanly."}
                      </span>
                    )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Route to where the facts are already attached ───────────────────── */}
      {!embedded && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
          <Link href="/explore?lane=property-land" data-testid="browse-verified-inventory"
            style={{ fontSize: 14, fontWeight: 800, color: "#fff", background: "#0f766e", borderRadius: 999, padding: "10px 22px", textDecoration: "none" }}>
            Browse the verified inventory →
          </Link>
          <Link href="/discover?mode=possibilities" data-testid="secondary-persona-link"
            style={{ fontSize: 13, fontWeight: 700, color: "#185FA5", textDecoration: "underline" }}>
            Or explore by what you're trying to accomplish →
          </Link>
        </div>
      )}
    </section>
  );
}
