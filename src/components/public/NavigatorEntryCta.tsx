import Link from "next/link";

import { HOMEPAGE_PRIMARY_ACTIONS } from "@/lib/public-content/publicCopyRegistry";

type Props = {
  lens: string;
  compact?: boolean;
  support?: string;
};

export function navigatorHref(lens: string): string {
  return `/navigator?flow=property-discovery&lens=${encodeURIComponent(lens)}`;
}

export function NavigatorEntryCta({ lens, compact = false, support }: Props) {
  return (
    <section
      aria-label="Start with Furlong Navigator"
      style={{
        display: "grid",
        gap: compact ? 6 : 9,
        border: "1px solid #d7deea",
        borderRadius: 14,
        background: "#ffffff",
        padding: compact ? "12px 14px" : "16px 18px",
      }}
    >
      <Link
        href={navigatorHref(lens)}
        data-testid={`navigator-entry-${lens}`}
        style={{
          width: "fit-content",
          borderRadius: 999,
          padding: compact ? "9px 14px" : "11px 18px",
          background: "#9a5b00",
          color: "#ffffff",
          fontWeight: 850,
          fontSize: compact ? 12.5 : 14,
          textDecoration: "none",
          boxShadow: "0 10px 24px rgba(133,79,11,0.18)",
        }}
      >
        {HOMEPAGE_PRIMARY_ACTIONS.primaryLabel} →
      </Link>
      <span style={{ fontSize: compact ? 11.5 : 13, color: "#4d596d", lineHeight: 1.5 }}>
        {support ?? HOMEPAGE_PRIMARY_ACTIONS.primarySupport}
      </span>
    </section>
  );
}
