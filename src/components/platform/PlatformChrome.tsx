"use client";

import { usePathname } from "next/navigation";

import { ModuleNav } from "@/components/platform/ModuleNav";
import { isInternalChromeRoute } from "@/lib/auth/protectedRoutes";

/**
 * Platform Chrome (Build 56 — SECURITY: safe-by-default isolation)
 *
 * The internal operator/governance chrome (the "Furlong Governed Platform"
 * index header + ModuleNav of internal routes) must render ONLY on genuine
 * internal routes — NEVER on a public page.
 *
 * Polarity matters: this is an INTERNAL allowlist, default = NOT internal.
 * An unknown or new public route therefore renders NO internal chrome (the
 * safe failure mode). The previous design allowlisted *public* routes and
 * leaked internal chrome onto anything it forgot to list (e.g. /compass) —
 * exposing the internal route map to the open web. Never again.
 *
 * Public pages get their header from PublicSiteLayout; this returns null for
 * them. verify:public asserts (against rendered HTML) that no internal index or
 * internal href ever appears on a public page.
 */

// The internal-route allowlist is the single source of truth in
// src/lib/auth/protectedRoutes.ts (shared with the auth middleware and the
// verify:internal-auth gate), so chrome visibility and server-side auth gating
// can never drift apart. Anything NOT matched there is public → no chrome.
const isInternalRoute = isInternalChromeRoute;

export function PlatformChrome({
  internalCount,
  translationCount,
}: {
  internalCount: number;
  translationCount: number;
}) {
  const pathname = usePathname();
  // Safe-by-default: render internal chrome ONLY on genuine internal routes.
  // Public / unknown routes get null here (PublicSiteLayout owns their header),
  // so the internal index + internal nav can never leak onto a public page.
  if (!pathname || !isInternalRoute(pathname)) {
    return null;
  }

  return (
    <>
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
              Furlong Governed Platform
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
    </>
  );
}
