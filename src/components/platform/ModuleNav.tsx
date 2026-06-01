import Link from "next/link";

import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Platform Module Navigation
 *
 * Master Volume Governance:
 * - Vol I: keeps governed modules visible without implying production
 *   activation.
 * - Vol III: routes navigation through registered module manifests.
 * - Vol IV: supports operator handoff and cross-module workflow review.
 * - Vol V: preserves claims posture and controlled disclosure in shell copy.
 */

const primaryRoutes = [
  "/governance",
  "/operator-queue",
  "/applications",
  "/documents",
  "/reviews",
  "/rules",
  "/decisions",
  "/notices",
  "/audit-replay",
  "/connectors",
  "/partners",
  "/billing",
  "/reports",
  "/promotion",
  "/case-command",
  "/evidence-packets",
  "/source-ingestion",
  "/environmental-compliance",
  "/live-scraper-activation",
  "/source-legal-review",
  "/source-promotion-packets",
  "/source-production-readiness",
  "/controlled-promotion-activation",
  "/production-portal-readiness",
  "/production-launch-evidence",
  "/deployment-environment-readiness",
  "/release-candidate-freeze",
  "/production-cutover-hold",
  "/production-release-board",
  "/production-operations-monitoring",
  "/production-incident-response-readiness",
  "/production-support-communications-readiness",
  "/production-final-authority",
  "/production-activation-ceremony",
  "/production-post-activation-verification",
  "/production-reliance-verification",
  "/production-regulatory-examination",
  "/production-regulatory-response",
  "/exception-remediation",
  "/data-rights",
  "/module-readiness",
  "/portal/borrower",
  "/lender/dashboard",
  "/sponsor/dashboard",
];

export function ModuleNav() {
  const items = primaryRoutes
    .map((route) => moduleManifests.find((manifest) => manifest.route === route))
    .filter(Boolean);

  return (
    <nav
      aria-label="Governed module navigation"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: "12px 20px",
        borderBottom: "1px solid #d9e2ec",
        background: "#f8fafc",
      }}
    >
      <Link
        href="/"
        style={{
          color: "#0f172a",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          padding: "6px 8px",
        }}
      >
        Home
      </Link>
      {items.map((item) => (
        <Link
          href={item.route}
          key={item.id}
          style={{
            color: "#334155",
            fontSize: 13,
            lineHeight: 1.2,
            textDecoration: "none",
            padding: "6px 8px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            background: "#ffffff",
          }}
        >
          {item.moduleNumber
            ? `${String(item.moduleNumber).padStart(2, "0")} ${item.title}`
            : item.title}
        </Link>
      ))}
    </nav>
  );
}
