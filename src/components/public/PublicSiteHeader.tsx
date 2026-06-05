import Link from "next/link";

import { FurlongLogo } from "@/components/brand/FurlongLogo";

/**
 * PublicSiteHeader (Build 44-B) — persistent public header / trust anchor.
 *
 * Small Furlong logo top-left linking home, plus mobile-safe public navigation.
 * Rendered on public-facing routes only (via PlatformChrome). Branding supports
 * the page; it does not replace headlines, trust language, or disclosures.
 */

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/onboarding", label: "Explore" },
  { href: "/trust", label: "Trust" },
  { href: "/data-rights", label: "Data Rights" },
  { href: "/stewardship", label: "Stewardship" },
];

export function PublicSiteHeader() {
  return (
    <header
      style={{
        borderBottom: "1px solid #d7deea",
        background: "#ffffff",
      }}
    >
      <nav
        aria-label="Furlong"
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <FurlongLogo size="header" href="/" />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            alignItems: "center",
          }}
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: "#162033",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
