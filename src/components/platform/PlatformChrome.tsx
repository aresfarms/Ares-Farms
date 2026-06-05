"use client";

import { usePathname } from "next/navigation";

import { ModuleNav } from "@/components/platform/ModuleNav";

/**
 * Platform Chrome (Build 45)
 *
 * Renders the internal operator header + governed-module navigation — but ONLY
 * on internal routes. On public, customer-facing routes (the homepage and the
 * Public Alpha customer surfaces) it renders nothing, so those pages read as a
 * public discovery experience rather than an internal dashboard.
 */

// Customer-facing routes that must NOT show internal operator chrome.
const PUBLIC_ROUTES = new Set<string>([
  "/",
  "/about",
  "/trust",
  "/data-rights",
  "/financing-pathways",
  "/readiness",
  "/onboarding",
  "/portal/borrower",
  "/success",
]);

// Public route prefixes (e.g. the stewardship index + each steward profile).
const PUBLIC_ROUTE_PREFIXES = ["/stewardship"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function PlatformChrome({
  internalCount,
  translationCount,
}: {
  internalCount: number;
  translationCount: number;
}) {
  const pathname = usePathname();
  if (pathname && isPublicRoute(pathname)) {
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
    </>
  );
}
