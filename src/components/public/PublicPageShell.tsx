/**
 * PublicPageShell — Build 53
 *
 * Shared wrapper for all public-facing pages. Provides:
 *   1. Correct stacking context for the Furlong compass watermark.
 *   2. Consistent page background, color, and font tokens.
 *   3. Compass watermarks — two instances, decorative only.
 *
 * Stacking model (back → front):
 *   z-0  Shell background (#f6f8fb or custom)
 *   z-1  Watermarks (position: absolute, z-index: 1)
 *   z-10 Content wrapper (position: relative, z-index: 10)
 *   z-10+ Cards / panels / nav (rendered in content flow)
 *
 * Usage:
 *   <PublicPageShell>
 *     <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px" }}>
 *       {page content}
 *     </div>
 *   </PublicPageShell>
 *
 * The inner container should NOT have background: "#f6f8fb" applied to
 * a full-width wrapper — doing so covers the watermarks everywhere.
 * Content cards with background: "#ffffff" naturally overlay the watermarks,
 * while the page gutters and inter-card gaps show the subtle compass.
 *
 * Accessibility:
 *   - Watermarks are aria-hidden="true", alt="", pointer-events: none.
 *   - The watermarks DO NOT interfere with keyboard or screen reader navigation.
 *   - Text and interactive elements remain fully readable at any opacity.
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

import { FurlongCompassWatermark } from "@/components/brand/FurlongCompassWatermark";

const FONT_STACK =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export function PublicPageShell({
  children,
  background = "#f6f8fb",
  color      = "#162033",
}: {
  children:   React.ReactNode;
  background?: string;
  color?:      string;
}) {
  return (
    <div
      style={{
        position:   "relative",
        background,
        color,
        fontFamily: FONT_STACK,
        minHeight:  "100vh",
        // overflow: "hidden" removed — was clipping watermarks that use inset: 0 0 auto auto
      }}
    >
      {/*
        Compass watermarks — behind all content (z-1).
        journey: top-right corner, 42 vw, opacity 0.055
        subtle:  lower-left,       50 vw, opacity 0.05
        Both are aria-hidden, alt="", pointer-events: none.
      */}
      <FurlongCompassWatermark variant="journey" />
      <FurlongCompassWatermark variant="subtle"  />

      {/*
        Content wrapper — z-index 10 renders it above the z-index 1 watermarks.
      */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
