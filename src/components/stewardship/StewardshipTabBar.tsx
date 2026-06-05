import Link from "next/link";

import { STEWARDSHIP_DOMAINS } from "@/lib/stewardship/stewardshipRegistry";

/**
 * Tab row shown at the top of every stewardship page.
 * Pass currentDomainId to highlight the active tab.
 * On the overview page (/stewardship) omit currentDomainId — no tab is active.
 */
export function StewardshipTabBar({
  currentDomainId,
}: {
  currentDomainId?: string;
}) {
  return (
    <nav
      aria-label="Stewardship domains"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0,
        borderBottom: "2px solid #d7deea",
        marginBottom: 32,
      }}
    >
      {STEWARDSHIP_DOMAINS.map((d) => {
        const active = d.domainId === currentDomainId;
        return (
          <Link
            key={d.domainId}
            href={d.profileRoute}
            aria-current={active ? "page" : undefined}
            style={{
              display: "inline-block",
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              color: active ? "#0f766e" : "#5d687a",
              textDecoration: "none",
              borderBottom: active
                ? "2px solid #0f766e"
                : "2px solid transparent",
              marginBottom: -2,
              whiteSpace: "nowrap",
            }}
          >
            {d.domainName}
          </Link>
        );
      })}
    </nav>
  );
}
