import { ReactNode } from "react";

import { FurlongCompassWatermark } from "@/components/brand/FurlongCompassWatermark";
import { FurlongLogo } from "@/components/brand/FurlongLogo";

/**
 * ExplorationJourneyShell (Build 44-B)
 *
 * A light shell for exploration journey pages: a compact Furlong logo (the
 * North Star — visible so users know they are still inside Furlong) plus an
 * optional journey breadcrumb, the journey content, and a trust/disclosure
 * footer. The logo never dominates; user content and exploration choices remain
 * the focus.
 *
 * Breadcrumb is rendered as: Furlong → <…steps>. Example:
 *   Furlong → Property & Land → Financing & Capital → Readiness
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export function ExplorationJourneyShell({
  breadcrumb = [],
  children,
}: {
  breadcrumb?: string[];
  children: ReactNode;
}) {
  const trail = ["Furlong", ...breadcrumb];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f8fb",
        color: "#162033",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      <FurlongCompassWatermark variant="journey" />

      <header
        style={{
          borderBottom: "1px solid #d7deea",
          background: "#ffffff",
          padding: "10px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
          }}
        >
          <FurlongLogo size="compact" href="/" />
          {breadcrumb.length > 0 && (
            <nav
              aria-label="Exploration path"
              style={{ ...muted, fontSize: 13, fontWeight: 600 }}
            >
              {trail.join(" → ")}
            </nav>
          )}
        </div>
      </header>

      <main
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "24px 20px 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </main>

      <footer
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "0 20px 40px",
          ...muted,
          fontSize: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <p style={{ margin: 0 }}>
          Advisory information only — not an approval, guarantee, eligibility
          finding, or official determination. Furlong is not a lender. The
          journey and the decisions remain yours.
        </p>
        <p style={{ margin: "6px 0 0" }}>
          Your information belongs to you. You can request an accounting, export,
          or deletion of your data at any time.
        </p>
      </footer>
    </div>
  );
}
