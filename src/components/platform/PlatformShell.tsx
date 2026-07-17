import { ReactNode } from "react";
import { TesterFeedbackBanner } from "@/components/public/TesterFeedbackBanner";

import { PlatformChrome } from "@/components/platform/PlatformChrome";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Platform Shell
 *
 * Master Volume Governance:
 * - Vol 0: presents one platform orientation across internal and translated
 *   surfaces.
 * - Vol I: preserves constitutional hierarchy and activation boundaries.
 * - Vol III: binds shell navigation to module manifests.
 * - Vol III-B: exposes governance status and promotion posture.
 * - Vol IV: supports operator handoff and controlled deployment sequencing.
 * - Vol V: keeps claims, replay, controlled disclosure, and production blocks
 *   visible without overclaiming public readiness.
 */

export function PlatformShell({ children }: { children: ReactNode }) {
  const internalCount = moduleManifests.filter((manifest) =>
    manifest.audience.includes("internal")
  ).length;
  const translationCount = moduleManifests.filter(
    (manifest) =>
      manifest.audience.includes("borrower") ||
      manifest.audience.includes("lender") ||
      manifest.audience.includes("sponsor")
  ).length;

  return (
    <body
      style={{
        margin: 0,
        color: "#172033",
        background: "#ffffff",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <TesterFeedbackBanner />
      {/*
        Skip-to-main link — visually hidden until focused (WCAG 2.4.1).
        Must appear BEFORE PlatformChrome so it is the first focusable element
        on the page. Keyboard users pressing Tab see it immediately.
      */}
      <style>{`
        .skip-to-main {
          position: absolute;
          top: -48px;
          left: 12px;
          z-index: 9999;
          padding: 10px 18px;
          background: #0f766e;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          border-radius: 0 0 8px 8px;
          transition: top 0.15s;
        }
        .skip-to-main:focus {
          top: 0;
          outline: 3px solid #c9a84c;
          outline-offset: 2px;
        }
      `}</style>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <PlatformChrome
        internalCount={internalCount}
        translationCount={translationCount}
      />
      <main id="main-content">{children}</main>
    </body>
  );
}
