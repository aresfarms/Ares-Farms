import { ReactNode } from "react";

import { ModuleNav } from "@/components/platform/ModuleNav";
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
      <header
        style={{
          borderBottom: "1px solid #d9e2ec",
          background: "#0f172a",
          color: "#ffffff",
          padding: "14px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              Ares/Furlong Governed Platform
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 3 }}>
              {internalCount} internal surfaces, {translationCount} translated
              surfaces, production-live controls still gated
            </div>
          </div>
          <div
            style={{
              border: "1px solid #64748b",
              borderRadius: 6,
              color: "#e2e8f0",
              fontSize: 12,
              padding: "6px 8px",
            }}
          >
            Master Volume runtime active
          </div>
        </div>
      </header>
      <ModuleNav />
      <main>{children}</main>
    </body>
  );
}
