"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { DiscoveryFlow } from "@/lib/discovery/discoveryFlow";
import { CHART_TONES, type ChartTone } from "@/lib/property/chartThemes";
import { buildPropertyAnalysisHref } from "@/lib/property/propertyAnalysisHref";

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
 * Chart Table cohesion (founder 2026-07-17): tone="light" is the /discover
 * front door (stays light); tone="dark" sits the same cells on the navigator
 * stage (property hub) using CHART_TONES — shared tokens, no per-surface hexes.
 * PRESENTATION ONLY — the tone changes colors, never data or copy.
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
  { label: "Financing-program fit (SBA · USDA · FSA & more)", source: "Property type + location vs. federal program rules (SBA 504/7(a), USDA Rural Development, FSA farm loans, FHA/VA)", confidence: "Guidance from property type & location — not a government place-fact", disclaimer: "Flags which federal financing programs the property may fit — SBA 504/7(a), USDA Rural Development, FSA farm loans, FHA/VA — from its type and where it sits. A fit read, not a determination of anyone's eligibility; the lender and agency decide that." },
];

type PlaceFactsResponse = {
  ok: boolean;
  propertyId?: string | null;
  canonicalMatch?: { propertyId: string; matchedBy: "normalized-exact-address" } | null;
  error?: string;
  verifiedPrograms?: Array<{
    program_id: string;
    name: string;
    verifiedStatement: string;
    basis: string;
    whyItMatters?: string;
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
  tone = "light",
  compact = false,
}: {
  flow: DiscoveryFlow;
  embedded?: boolean;
  tone?: ChartTone;
  /** Slim variant for the /explore compass front door: framed card, chips-only
      coverage with a link to the full check, no bottom routing footer. */
  compact?: boolean;
}) {
  const head = HEAD[flow] ?? HEAD["place-facts"];
  const t = CHART_TONES[tone];
  const router = useRouter();
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

  const inputStyle = {
    fontSize: 13.5,
    padding: "9px 12px",
    borderRadius: 10,
    border: `1.5px solid ${t.inputBorder}`,
    background: t.inputBg,
    color: t.inputInk,
  } as const;
  const coverageChipStyle =
    tone === "dark"
      ? { color: t.badgeInk, border: `1px solid ${t.badgeBorder}`, background: t.badgeBg }
      : { color: "#0f766e", border: "1px solid #bfe4db", background: "#f2fbf8" };

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

    // Never let the button spin forever — abort the request after 30s and
    // surface a clear message instead of a hang (founder-caught 2026-07-18:
    // the address box would just spin when a live source was slow/unreachable).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch("/api/public/property-facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
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
      const aborted = lookupError instanceof DOMException && lookupError.name === "AbortError";
      setError(
        aborted
          ? "This is taking longer than expected — a public source may be slow right now. Please try again in a moment."
          : lookupError instanceof Error
            ? lookupError.message
            : "The location place-facts lookup could not be completed."
      );
      setJumpCue(null);
    } finally {
      clearTimeout(timeout);
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
      ].filter((item) => item.outcome === "matched" || item.outcome === "no-match" || item.outcome === "error")
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
    const title = parsed?.street ? `${parsed.street} analysis` : `${titleBase} analysis`;
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
    const descriptionParts = [
      "Imported from the Furlong place-facts screen.",
      positiveSignals.length > 0
        ? `Verified place-fact signals: ${positiveSignals.join("; ")}.`
        : "No positive place-fact matches were confirmed during the initial verification pass.",
      additionalSourceBottomLine,
    ].filter(Boolean);

    return buildPropertyAnalysisHref({
      propertyId: result?.propertyId || "imported:place-facts",
      propertyType: "place-led property",
      location: locationLabel || "Verified location",
      title,
      priceLabel: "Price not yet verified",
      vintage: "Current address verification",
      sourceLabel: result?.canonicalMatch
        ? "Furlong canonical property match"
        : "Furlong verified address check",
      pathways: verifiedPrograms.map((program) => program.name),
      exactAddress: verification.normalizedAddress,
      town: parsed?.city,
      county: county.trim() || null,
      state: parsed?.state || stateCode.trim() || null,
      description: descriptionParts.join(" "),
      sourceVerificationStatus: result?.canonicalMatch
        ? "matched-approved-source-record"
        : "verified-address-only",
      matchedSourceRecordId: result?.canonicalMatch?.propertyId ?? null,
      entryMethod: "manual-address",
      startingLens: flow,
    });
  })();

  useEffect(() => {
    if (!checked || busy) return;
    if (!error && !result) return;

    // Compact (lane) check: a successful verification goes STRAIGHT to the full
    // analysis report, not the place-facts summary (founder direction 2026-07-20).
    if ((compact || embedded) && result && analysisHref) {
      setJumpCue("Opening your full analysis report…");
      router.push(analysisHref);
      return;
    }

    resultRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setJumpCue("Jumped to your location results.");
  }, [busy, checked, error, result, compact, embedded, analysisHref, router]);

  return (
    <section data-testid="place-first-discovery" data-flow={flow} data-tone={tone} aria-label="Place-first discovery"
      style={{
        display: "grid",
        gap: embedded ? 18 : 22,
        maxWidth: embedded ? "none" : 760,
        border: embedded ? "none" : `1px solid ${t.sectionBorder}`,
        borderRadius: embedded ? 0 : 16,
        background: embedded ? "transparent" : t.sectionBg,
        padding: embedded ? 0 : "26px 28px",
      }}>
      {/* Compact mode: the host page supplies the heading, so the card skips its
          own header and renders as a bare slim strip. */}
      {!embedded && !compact && (
        <header style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: t.eyebrow }}>{head.eyebrow}</span>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.18, color: t.headingInk }}>{head.title}</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: t.bodyInk, lineHeight: 1.55 }}>{head.lede}</p>
        </header>
      )}

      {/* ── Location FIRST ──────────────────────────────────────────────────── */}
      {compact ? (
        // Slim horizontal strip (founder direction 2026-07-20): one long, skinny
        // row of fields + an inline button, so it fits the page under the map
        // instead of a tall stacked card.
        <div
          data-testid="place-inputs"
          onKeyDown={(e) => {
            // Keyboard-only operation (WCAG 2.1.1): Enter in any field runs the
            // query, so the whole lookup works on Tab + Enter with no mouse.
            if (e.key === "Enter") {
              e.preventDefault();
              void checkPlaceFacts();
            }
          }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 12,
            padding: "12px 14px",
            background: t.cardBg,
          }}
        >
          <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Street address" style={{ ...inputStyle, flex: "3 1 200px" }} />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={{ ...inputStyle, flex: "1 1 110px" }} />
          <input value={stateCode} onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))} placeholder="State" maxLength={2} style={{ ...inputStyle, flex: "0 0 74px", width: 74 }} />
          <input value={county} onChange={(e) => setCounty(e.target.value)} placeholder="County (opt.)" style={{ ...inputStyle, flex: "1 1 120px" }} />
          <input value={parcel} onChange={(e) => setParcel(e.target.value)} placeholder="Parcel (opt.)" style={{ ...inputStyle, flex: "1 1 120px" }} />
          <button
            type="button"
            data-testid="place-check"
            onClick={() => void checkPlaceFacts()}
            aria-describedby="place-facts-jump-cue"
            style={{
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              minHeight: 42,
              fontSize: 13.5,
              fontWeight: 800,
              color: "#fff",
              background: busy ? "#9a6730" : "#854F0B",
              border: "none",
              borderRadius: 999,
              padding: "9px 18px",
              cursor: busy ? "progress" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {busy ? "Checking…" : "Check this address →"}
          </button>
          <span id="place-facts-jump-cue" style={{ flexBasis: "100%", fontSize: 11.5, fontWeight: 600, color: busy ? t.warnInk : jumpCue ? t.accent : t.faintInk, lineHeight: 1.4 }}>
            {busy ? "Verifying the address now…" : jumpCue ?? "County & parcel are optional — some public records start there."}
          </span>
        </div>
      ) : (
        <div
          data-testid="place-inputs"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void checkPlaceFacts();
            }
          }}
          style={{ display: "grid", gap: 12, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: embedded ? "18px 18px" : "16px 18px", background: t.cardBg }}
        >
          <strong style={{ fontSize: embedded ? 16 : 13.5, color: t.labelInk }}>
            {embedded ? "Start with the verified address" : "Where is the location?"}
          </strong>
          {embedded && (
            <span style={{ fontSize: 13, color: t.bodyInk, lineHeight: 1.6, maxWidth: 820 }}>
              Results appear right below — checked facts carry into the analysis automatically.
            </span>
          )}
          <input
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="Street address (e.g. 123 Main St)"
            style={inputStyle} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              style={{ ...inputStyle, flex: "1 1 180px" }}
            />
            <input
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="State (e.g. WV)"
              maxLength={2}
              style={{ ...inputStyle, width: 110 }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="County (optional but helpful)"
              style={{ ...inputStyle, flex: "1 1 200px" }}
            />
            <input
              value={parcel}
              onChange={(e) => setParcel(e.target.value)}
              placeholder="Parcel / APN (optional)"
              style={{ ...inputStyle, flex: "1 1 220px", maxWidth: 360 }}
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
                color: busy ? t.warnInk : jumpCue ? t.accent : t.quietInk,
                lineHeight: 1.45,
              }}
            >
              {busy
                ? "Furlong is verifying the address now and will move you straight to the answer block."
                : jumpCue ?? ""}
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: t.faintInk }}>
            County and parcel are optional — some public records start there.
          </span>
        </div>
      )}

      {/* ── Then: verified place-facts coverage + source confidence + disclaimers ─ */}
      <div data-testid="place-facts-coverage" style={{ display: "grid", gap: 10 }}>
        <strong style={{ fontSize: embedded ? 15 : 14, color: t.headingInk }}>
          {checked && located ? `We check ${located} for:` : "We check any U.S. address for:"}
        </strong>
        {checked && !result && !error && (
          <p data-testid="live-gated-note" style={{ margin: 0, fontSize: 12.5, color: t.quietInk, lineHeight: 1.5 }}>
            Furlong is verifying the location against public place-fact sources now.
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {COVERAGE.map((c) => (
            <span
              key={c.label}
              style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "4px 11px", ...coverageChipStyle }}
            >
              {c.label}
            </span>
          ))}
        </div>
        {compact ? (
          /* Slim variant: chips above + a link to the full check (sources +
             disclaimers) rather than the inline details grid. Honesty pointer
             preserved — the full sourcing lives one click away on /discover. */
          <Link
            href="/discover?flow=place-facts"
            style={{ fontSize: 12.5, fontWeight: 700, color: t.accent, textDecoration: "underline", width: "fit-content" }}
          >
            See exactly what we check — with sources &amp; disclaimers →
          </Link>
        ) : (
          <details>
            <summary style={{ cursor: "pointer", listStyle: "none", fontSize: 12, color: t.quietInk }}>
              What each check means + sources ▸
            </summary>
            <div style={{ display: "grid", gap: 8, paddingTop: 8 }}>
              {COVERAGE.map((c) => (
                <div key={c.label} style={{ border: `1px solid ${t.cardBorder}`, borderRadius: 10, padding: "10px 14px", display: "grid", gap: 3, background: t.cellBg }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 13.5, color: t.labelInk }}>{c.label}</strong>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: t.accent }}>{c.confidence}</span>
                  </div>
                  <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.45 }}>{c.disclaimer}</span>
                  <span style={{ fontSize: 11.5, color: t.faintInk }}>Source: {c.source}</span>
                </div>
              ))}
            </div>
          </details>
        )}
        <p style={{ margin: 0, fontSize: 12, color: t.quietInk, lineHeight: 1.5 }}>
          Advisory only — place-facts describe the place, not your eligibility.
        </p>
        {(error || result) && (
          <div
            id="location-verification-result"
            ref={resultRef}
            style={{ display: "grid", gap: 10, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: "14px 16px", background: tone === "dark" ? t.cardBg : "#fbfdff", scrollMarginTop: 24 }}
          >
            <strong style={{ fontSize: 14, color: t.headingInk }}>Location verification result</strong>
            {error && (
              <span style={{ fontSize: 12.5, color: t.errorInk, lineHeight: 1.5 }}>{error}</span>
            )}
            {result && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: t.badgeInk, background: t.badgeBg, border: `1px solid ${t.badgeBorder}`, borderRadius: 999, padding: "6px 10px" }}>
                    {verification?.status === "verified"
                      ? "Verified address"
                      : verification?.status === "partial"
                        ? "Partially verified"
                        : verification?.status === "blocked"
                          ? "Restricted input"
                          : "Unverifiable input"}
                  </span>
                  {verification?.normalizedAddress && (
                    <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.5 }}>
                      {verification.normalizedAddress}
                    </span>
                  )}
                </div>

                {verification?.restrictions?.length ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {verification.restrictions.map((item) => (
                      <span key={item} style={{ fontSize: 12.5, color: t.errorInk, lineHeight: 1.5 }}>{item}</span>
                    ))}
                  </div>
                ) : null}

                {verification?.warnings?.length ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {verification.warnings.map((item) => (
                      <span key={item} style={{ fontSize: 12.5, color: t.warnInk, lineHeight: 1.5 }}>{item}</span>
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
                    <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.5 }}>
                      Carry this verified address and what Furlong already checked straight into the property analysis workspace.
                    </span>
                  </div>
                )}

                {sourceOutcomeCards.length > 0 && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <strong style={{ fontSize: 13.5, color: t.headingInk }}>What Furlong actually checked</strong>
                    <div style={{ display: "grid", gap: 8 }}>
                      {sourceOutcomeCards.map((item) => (
                        <div key={item.id} style={{ border: `1px solid ${t.cellBorder}`, background: t.cellBg, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 12.75, color: t.labelInk }}>{item.label}</strong>
                          <span style={{ fontSize: 12, fontWeight: 800, color: item.outcome === "matched" ? t.accent : item.outcome === "no-match" ? t.bodyInk : item.outcome === "gated" ? t.eyebrow : t.errorInk }}>
                            {item.outcome === "matched"
                              ? "Checked and matched"
                              : item.outcome === "no-match"
                                ? "Checked and no positive match"
                                : "Attempted but not completed"}
                          </span>
                        </div>
                      ))}
                    </div>
                    {additionalSourceBottomLine && (
                      <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.55 }}>
                        {additionalSourceBottomLine}
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: "grid", gap: 8 }}>
                  {liveFacts?.opportunityZone && (
                    <div style={{ border: `1px solid ${t.cellBorder}`, background: t.cellBg, borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: t.labelInk }}>Opportunity Zone</strong>
                      <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.5 }}>
                        Tract {liveFacts.opportunityZone.tractId}{liveFacts.opportunityZone.rural ? " · rural tract" : ""}.
                      </span>
                    </div>
                  )}
                  {liveFacts?.hubzone && (
                    <div style={{ border: `1px solid ${t.cellBorder}`, background: t.cellBg, borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: t.labelInk }}>HUBZone</strong>
                      <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.5 }}>
                        {liveFacts.hubzone.hubzoneType} · GEOID {liveFacts.hubzone.geoid}
                        {liveFacts.hubzone.isCurrent ? " · currently designated" : " · not current"}.
                      </span>
                    </div>
                  )}
                  {liveFacts?.flood && (
                    <div style={{ border: `1px solid ${t.cellBorder}`, background: t.cellBg, borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: t.labelInk }}>FEMA flood</strong>
                      <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.5 }}>
                        Special Flood Hazard Area, Zone {liveFacts.flood.floodZone}.
                      </span>
                    </div>
                  )}
                  {liveFacts?.historic && (
                    <div style={{ border: `1px solid ${t.cellBorder}`, background: t.cellBg, borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: t.labelInk }}>Historic context</strong>
                      <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.5 }}>
                        National Register area{liveFacts.historic.historicName ? ` — ${liveFacts.historic.historicName}` : ""}.
                      </span>
                    </div>
                  )}
                  {liveFacts?.nmtc && (
                    <div style={{ border: `1px solid ${t.cellBorder}`, background: t.cellBg, borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: t.labelInk }}>NMTC tract</strong>
                      <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.5 }}>
                        Tract {liveFacts.nmtc.tractId} is NMTC-qualified in the current snapshot.
                      </span>
                    </div>
                  )}
                  {verifiedPrograms.map((program) => (
                    <div key={program.program_id} style={{ border: `1px solid ${t.programBorder}`, background: t.programBg, borderRadius: 10, padding: "10px 12px", display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 13.5, color: t.accent }}>{program.name}</strong>
                      <span style={{ fontSize: 12.5, color: t.bodyInk, lineHeight: 1.5 }}>{program.verifiedStatement}</span>
                      {program.whyItMatters && (
                        <span style={{ fontSize: 12.5, color: t.accent, lineHeight: 1.5 }}>{program.whyItMatters}</span>
                      )}
                      <span style={{ fontSize: 11.5, color: t.faintInk }}>{program.basis}</span>
                    </div>
                  ))}
                  {!liveFacts?.opportunityZone &&
                    !liveFacts?.hubzone &&
                    !liveFacts?.flood &&
                    !liveFacts?.historic &&
                    !liveFacts?.nmtc &&
                    verifiedPrograms.length === 0 && (
                      <span style={{ fontSize: 12.5, color: t.quietInk, lineHeight: 1.55 }}>
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
      {!embedded && !compact && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", borderTop: `1px solid ${t.cardBorder}`, paddingTop: 16 }}>
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
