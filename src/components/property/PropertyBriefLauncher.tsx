"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { buildPropertyAnalysisHref } from "@/lib/property/propertyAnalysisHref";

type PropertyBrief = {
  id: string;
  title: string;
  location: string;
  town?: string | null;
  county?: string | null;
  state?: string | null;
  propertyType: string;
  priceLabel: string;
  vintageStamp: string;
  sourceLabel: string;
  sourceId?: string | null;
  listingUrl?: string | null;
  exactAddress?: string | null;
  description?: string | null;
  sourceCitation?: string | null;
  pathways: string[];
  categoryLabel?: string | null;
  currentLabel?: string | null;
};

function propertyTint(propertyType: string): { bg: string; line: string; glow: string } {
  if (/commercial|business|hospitality/i.test(propertyType)) {
    return { bg: "linear-gradient(135deg, #eef4ff, #f8fbff 55%, #e7f0ff)", line: "#185FA5", glow: "rgba(24,95,165,0.18)" };
  }
  if (/land|farm|ranch/i.test(propertyType)) {
    return { bg: "linear-gradient(135deg, #f6f4e8, #fbfaf4 55%, #f0ead3)", line: "#8a6914", glow: "rgba(138,105,20,0.18)" };
  }
  return { bg: "linear-gradient(135deg, #eef8f5, #fbfdfc 55%, #e7f6f1)", line: "#0f766e", glow: "rgba(15,118,110,0.16)" };
}

function buildAnalyzeHref(property: PropertyBrief): string {
  return buildPropertyAnalysisHref({
    propertyId: property.id,
    title: property.title,
    location: property.location,
    propertyType: property.propertyType,
    priceLabel: property.priceLabel,
    vintage: property.vintageStamp,
    sourceLabel: property.sourceLabel,
    pathways: property.pathways,
    town: property.town,
    county: property.county,
    state: property.state,
    sourceId: property.sourceId,
    listingUrl: property.listingUrl,
    exactAddress: property.exactAddress,
    description: property.description,
    categoryLabel: property.categoryLabel,
    currentLabel: property.currentLabel,
  });
}

export function PropertyBriefLauncher({ property }: { property: PropertyBrief }) {
  const [open, setOpen] = useState(false);
  const analyzeHref = useMemo(() => buildAnalyzeHref(property), [property]);
  const tint = propertyTint(property.propertyType);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "grid",
          gap: 10,
          width: "100%",
          textAlign: "left",
          padding: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div
          style={{
            minHeight: 172,
            borderRadius: 16,
            padding: "18px 18px 16px",
            background: tint.bg,
            border: `1px solid ${tint.glow}`,
            boxShadow: `0 18px 40px ${tint.glow}`,
            display: "grid",
            alignContent: "space-between",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: tint.line,
              }}
            >
              Property Brief
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 999,
                padding: "4px 9px",
                color: tint.line,
                background: "#ffffffcc",
                border: `1px solid ${tint.glow}`,
              }}
            >
              {property.currentLabel ?? property.vintageStamp}
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <strong style={{ fontSize: 22, lineHeight: 1.08, color: "#162033", letterSpacing: "-0.02em" }}>
              {property.title}
            </strong>
            <span style={{ fontSize: 13.5, color: "#4d596d", lineHeight: 1.5 }}>
              {property.location} · {property.priceLabel}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: tint.line }}>
              Open the brief → choose source listing or Furlong analysis
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${property.title} property brief`}
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(16,26,43,0.56)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(920px, 100%)",
              maxHeight: "calc(100vh - 40px)",
              overflow: "auto",
              borderRadius: 22,
              background: "#ffffff",
              border: "1px solid #d7deea",
              boxShadow: "0 28px 80px rgba(16,26,43,0.24)",
              display: "grid",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                borderBottom: "1px solid #e6ebf2",
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={{ fontSize: 18, color: "#162033" }}>Property brief</strong>
                <span style={{ fontSize: 12.5, color: "#6b778c" }}>
                  Choose whether to go straight to the source or let Furlong evaluate the property first.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close property brief"
                style={{
                  border: "none",
                  background: "none",
                  fontSize: 24,
                  lineHeight: 1,
                  cursor: "pointer",
                  color: "#6b778c",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 20, display: "grid", gap: 18 }}>
              <div
                style={{
                  borderRadius: 20,
                  padding: "24px 22px",
                  background: tint.bg,
                  border: `1px solid ${tint.glow}`,
                  display: "grid",
                  gap: 18,
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: tint.line }}>
                    {property.sourceLabel}
                  </span>
                  {property.categoryLabel && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#4d596d" }}>
                      {property.categoryLabel}
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.02, letterSpacing: "-0.03em", color: "#162033" }}>
                    {property.title}
                  </h2>
                  <p style={{ margin: 0, fontSize: 15, color: "#4d596d", lineHeight: 1.6 }}>
                    {property.location}
                    {property.exactAddress ? ` · ${property.exactAddress}` : ""}
                  </p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: tint.line }}>
                    {property.priceLabel}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <strong style={{ fontSize: 14, color: "#162033" }}>What Furlong can do here</strong>
                <div style={{ display: "grid", gap: 8, color: "#4d596d", fontSize: 14, lineHeight: 1.6 }}>
                  <span>We can trace verified property-side criteria, check the USDA / SBA context already wired into the platform, and start a guided analysis around this specific asset.</span>
                  <span>Then the Navigator can ask follow-up questions and build toward an advisory report instead of making you start from zero.</span>
                </div>
              </div>

              {property.description && (
                <div style={{ display: "grid", gap: 6 }}>
                  <strong style={{ fontSize: 13, color: "#162033" }}>Listing context</strong>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#5d687a", lineHeight: 1.6 }}>
                    {property.description}
                  </p>
                </div>
              )}

              <div style={{ display: "grid", gap: 6 }}>
                <strong style={{ fontSize: 13, color: "#162033" }}>Likely analysis lanes</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {property.pathways.map((pathway) => (
                    <span
                      key={pathway}
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        borderRadius: 999,
                        padding: "6px 10px",
                        color: "#12344d",
                        background: "#f3f6fb",
                        border: "1px solid #d7deea",
                      }}
                    >
                      {pathway}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                {property.listingUrl ? (
                  <a
                    href={property.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "grid",
                      gap: 6,
                      borderRadius: 18,
                      padding: "16px 18px",
                      textDecoration: "none",
                      border: "1px solid #d7deea",
                      background: "#fbfcfe",
                    }}
                  >
                    <strong style={{ fontSize: 15, color: "#162033" }}>Go to the source listing ↗</strong>
                    <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.55 }}>
                      Leave Furlong and view the original source page directly.
                    </span>
                  </a>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: 6,
                      borderRadius: 18,
                      padding: "16px 18px",
                      border: "1px solid #e6ebf2",
                      background: "#fbfcfe",
                    }}
                  >
                    <strong style={{ fontSize: 15, color: "#162033" }}>Source listing not linked here</strong>
                    <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.55 }}>
                      This listing is being carried through Furlong&apos;s governed inventory flow, so the external page is not exposed on this card.
                    </span>
                  </div>
                )}

                <Link
                  href={analyzeHref}
                  style={{
                    display: "grid",
                    gap: 6,
                    borderRadius: 18,
                    padding: "16px 18px",
                    textDecoration: "none",
                    background: "#0f766e",
                    color: "#ffffff",
                    boxShadow: "0 16px 36px rgba(15,118,110,0.24)",
                  }}
                >
                  <strong style={{ fontSize: 15 }}>Learn how this property could work for you →</strong>
                  <span style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.9)" }}>
                    Stay inside Furlong and open a property-specific evaluation with guided analysis.
                  </span>
                </Link>
              </div>

              {property.sourceCitation && (
                <p style={{ margin: 0, fontSize: 11.5, color: "#7a8aa0", lineHeight: 1.55 }}>
                  {property.sourceCitation} · {property.vintageStamp}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
