/**
 * PublicSiteLayout — Build 50
 *
 * SINGLE public-facing shell for ALL pages under src/app/(public)/.
 * No public page may bypass this layout. Header appears ONCE here.
 * Watermark appears ONCE here. Footer appears ONCE here.
 *
 * Provides (in render order):
 *   1. Skip-to-main-content link (WCAG 2.4.1)
 *   2. PublicSiteHeader — Furlong wordmark + nav with Stewardship dropdown
 *   3. Centered Furlong compass watermark — behind all content
 *   4. Content region (children from each page) — z-10, above watermark
 *   5. Global utility footer — disclosure note + accessibility/legal links
 *
 * Stacking model (back → front):
 *   z-0   Shell background (#f6f8fb)
 *   z-1   Compass watermark (position: absolute, centered)
 *   z-10  Skip link + header + content region + footer
 *
 * Rules (enforced by verify:public-reset-route-isolation):
 *   - Do NOT import FurlongCompassWatermark in individual public pages.
 *   - Do NOT import PublicSiteHeader in individual public pages.
 *   - Do NOT import PublicSiteLayout or PublicPageShell in page files.
 *   - Do NOT add a nav footer in individual pages that mirrors this header.
 *   - Individual pages render their own <main> or content sections only.
 *
 * Accessibility:
 *   - Watermark: aria-hidden="true", alt="", pointer-events: none
 *   - Skip link: visually hidden until focused (WCAG 2.4.1)
 *   - Header: aria-label="Furlong" on internal <nav>
 *   - Footer: aria-label="Site footer"
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

"use client";

import { useState } from "react";

import Link        from "next/link";
import { usePathname } from "next/navigation";

import { FurlongCompassWatermark } from "@/components/brand/FurlongCompassWatermark";
import { PublicSiteHeader }        from "@/components/public/PublicSiteHeader";

const FONT_STACK =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// Global footer — utility links only. Must not mirror the header nav.
const FOOTER_UTILITY_LINKS = [
  { href: "/accessibility",   label: "Accessibility" },
  { href: "/trust#your-data", label: "Your Data Rights" },
  { href: "/trust",           label: "The Furlong Promise" },
] as const;

const FOOTER_DISCLOSURE =
  "Advisory information only — not an approval, guarantee, eligibility finding, or " +
  "official determination. Furlong is not a lender. Not a government agency. " +
  "Public Alpha remains PENDING.";

export function PublicSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [skipFocused, setSkipFocused] = useState(false);
  const pathname = usePathname();

  return (
    <div
      style={{
        position:   "relative",
        background: "#f6f8fb",
        color:      "#162033",
        fontFamily: FONT_STACK,
        minHeight:  "100vh",
        display:    "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Compass watermark — centered, z-0, behind all content ─────────
           opacity: 0.10 on homepage (more vivid), 0.06 on all subpages.     */}
      <FurlongCompassWatermark
        variant="journey"
        opacity={pathname === "/" ? 0.10 : 0.06}
      />

      {/* ── Skip-to-main link — visually hidden until focused (WCAG 2.4.1) */}
      <a
        href="#main-content"
        onFocus={() => setSkipFocused(true)}
        onBlur={()  => setSkipFocused(false)}
        style={{
          position:       "absolute",
          top:            8,
          left:           skipFocused ? 8 : -9999,
          zIndex:         200,
          padding:        "8px 16px",
          background:     "#162033",
          color:          "#ffffff",
          fontWeight:     700,
          fontSize:       14,
          borderRadius:   6,
          textDecoration: "none",
          fontFamily:     FONT_STACK,
          whiteSpace:     "nowrap",
        }}
      >
        Skip to main content
      </a>

      {/* ── Site header — ONE instance, provided by PublicSiteHeader ────── */}
      <div style={{ position: "relative", zIndex: 10, flexShrink: 0 }}>
        <PublicSiteHeader />
      </div>

      {/* ── Content region — z-10, grows to fill available height ────────── */}
      <div
        id="main-content"
        style={{
          position: "relative",
          zIndex:   10,
          flex:     "1 0 auto",
        }}
      >
        {children}
      </div>

      {/* ── Global utility footer — ONE instance, minimal, non-mirroring ── */}
      <footer
        aria-label="Site footer"
        style={{
          position:     "relative",
          zIndex:       10,
          flexShrink:   0,
          borderTop:    "1px solid #d7deea",
          background:   "#ffffff",
          padding:      "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth:       1040,
            margin:         "0 auto",
            display:        "flex",
            flexWrap:       "wrap",
            alignItems:     "center",
            gap:            "8px 20px",
          }}
        >
          {/* Brand + year */}
          <span style={{ fontSize: 13, fontWeight: 700, color: "#162033", flexShrink: 0 }}>
            © 2026 Furlong
          </span>

          <span style={{ color: "#d7deea", fontSize: 13, userSelect: "none" }} aria-hidden="true">|</span>

          {/* Utility links — accessibility / data rights / promise */}
          {FOOTER_UTILITY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize:       13,
                fontWeight:     500,
                color:          "#5d687a",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Disclosure — always visible, right-aligned on wide screens */}
          <p
            style={{
              margin:     0,
              fontSize:   12,
              color:      "#9aabb8",
              lineHeight: 1.5,
              marginLeft: "auto",
              maxWidth:   600,
              textAlign:  "right",
            }}
          >
            {FOOTER_DISCLOSURE}
          </p>
        </div>
      </footer>
    </div>
  );
}
