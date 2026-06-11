"use client";

import { useState } from "react";
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

export function PlaceFirstDiscovery({ flow }: { flow: DiscoveryFlow }) {
  const head = HEAD[flow] ?? HEAD["place-facts"];
  const [address, setAddress] = useState("");
  const [county, setCounty] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [parcel, setParcel] = useState("");
  const [checked, setChecked] = useState(false);

  const located = [address, county && stateCode ? `${county}, ${stateCode}` : "", parcel].filter(Boolean).join(" · ");

  return (
    <section data-testid="place-first-discovery" data-flow={flow} aria-label="Place-first discovery"
      style={{ display: "grid", gap: 22, maxWidth: 760, border: "1px solid #d7deea", borderRadius: 16, background: "#fff", padding: "26px 28px" }}>
      <header style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "#854F0B" }}>{head.eyebrow}</span>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.18, color: "#101a2b" }}>{head.title}</h1>
        <p style={{ margin: 0, fontSize: 13.5, color: "#5d687a", lineHeight: 1.55 }}>{head.lede}</p>
      </header>

      {/* ── Location FIRST ──────────────────────────────────────────────────── */}
      <div data-testid="place-inputs" style={{ display: "grid", gap: 12, border: "1px solid #e6ebf2", borderRadius: 12, padding: "16px 18px" }}>
        <strong style={{ fontSize: 13.5, color: "#1f2a3d" }}>Where is the location?</strong>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address (e.g. 123 Main St, Beckley WV)"
          style={{ fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1" }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={county} onChange={(e) => setCounty(e.target.value)} placeholder="County" style={{ flex: "1 1 180px", fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1" }} />
          <input value={stateCode} onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))} placeholder="State (e.g. WV)" maxLength={2} style={{ width: 110, fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1" }} />
        </div>
        <input value={parcel} onChange={(e) => setParcel(e.target.value)} placeholder="Parcel / APN (optional)"
          style={{ fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1", maxWidth: 360 }} />
        <button type="button" data-testid="place-check" onClick={() => setChecked(true)}
          style={{ justifySelf: "start", fontSize: 14, fontWeight: 800, color: "#fff", background: "#854F0B", border: "none", borderRadius: 999, padding: "10px 22px", cursor: "pointer" }}>
          Check this location's place-facts →
        </button>
        <span style={{ fontSize: 11.5, color: "#9aa6b6" }}>Anonymous — no account or name needed. We use the location only to report public place-facts.</span>
      </div>

      {/* ── Then: verified place-facts coverage + source confidence + disclaimers ─ */}
      <div data-testid="place-facts-coverage" style={{ display: "grid", gap: 10 }}>
        <strong style={{ fontSize: 14, color: "#101a2b" }}>
          {checked && located ? `Verified place-facts we report for ${located}:` : "Verified place-facts we report for any U.S. location:"}
        </strong>
        {checked && (
          <p data-testid="live-gated-note" style={{ margin: 0, fontSize: 12.5, color: "#7a8aa0", lineHeight: 1.5 }}>
            Live per-address lookup is pending operator activation (Module 22/23), so we don't compute a single-address result here yet — instead, these facts are attached to every property in the verified inventory below, and each carries its source + date.
          </p>
        )}
        <div style={{ display: "grid", gap: 8 }}>
          {COVERAGE.map((c) => (
            <div key={c.label} style={{ border: "1px solid #e6ebf2", borderRadius: 10, padding: "10px 14px", display: "grid", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ fontSize: 13.5, color: "#1f2a3d" }}>{c.label}</strong>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#0f766e" }}>{c.confidence}</span>
              </div>
              <span style={{ fontSize: 12.5, color: "#5d687a", lineHeight: 1.45 }}>{c.disclaimer}</span>
              <span style={{ fontSize: 11.5, color: "#9aa6b6" }}>Source: {c.source}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#7a8aa0", lineHeight: 1.5 }}>
          Advisory only — place-facts describe the place, not your eligibility. Whether you personally benefit is a separate question for a licensed professional or the agency.
        </p>
      </div>

      {/* ── Route to where the facts are already attached ───────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
        <Link href="/explore?lane=property-land" data-testid="browse-verified-inventory"
          style={{ fontSize: 14, fontWeight: 800, color: "#fff", background: "#0f766e", borderRadius: 999, padding: "10px 22px", textDecoration: "none" }}>
          Browse the verified inventory →
        </Link>
        {/* Persona/customer-type is a SECONDARY, later step — never the first card. */}
        <Link href="/discover?mode=possibilities" data-testid="secondary-persona-link"
          style={{ fontSize: 13, fontWeight: 700, color: "#185FA5", textDecoration: "underline" }}>
          Or explore by what you're trying to accomplish →
        </Link>
      </div>
    </section>
  );
}
