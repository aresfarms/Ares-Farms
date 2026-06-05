import { ReactNode } from "react";

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
      <PlatformChrome
        internalCount={internalCount}
        translationCount={translationCount}
      />
      <main>{children}</main>
    </body>
  );
}
