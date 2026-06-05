import Link from "next/link";

import { FurlongLogo } from "@/components/brand/FurlongLogo";

/**
 * PublicSiteHeader (Build 48) — persistent public header / trust anchor.
 *
 * Nav order: Explore | Stewardship (hover dropdown) | Trust | Data Rights
 * Stewardship links to /stewardship overview; hover exposes the three domains.
 * On touch/mobile, tapping Stewardship navigates to /stewardship overview
 * where all domain cards are accessible.
 */

const STEWARDSHIP_ITEMS = [
  { href: "/stewardship/financing-capital", label: "Financing & Capital" },
  {
    href: "/stewardship/environmental-compliance",
    label: "Environmental & Compliance",
  },
  {
    href: "/stewardship/communications-public-trust",
    label: "Communications & Public Trust",
  },
];

export function PublicSiteHeader() {
  return (
    <header
      style={{
        borderBottom: "1px solid #d7deea",
        background: "#ffffff",
      }}
    >
      <style>{`
        .ps-nav-link {
          color: #162033;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
        }
        .ps-nav-link:hover { color: #0f766e; }
        .ps-nav-link:focus-visible {
          outline: 2px solid #0f766e;
          outline-offset: 3px;
          border-radius: 3px;
        }

        /* Stewardship hover dropdown */
        .ps-stw { position: relative; }
        .ps-stw-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #162033;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
        }
        .ps-stw-toggle:hover { color: #0f766e; }
        .ps-stw-toggle:focus-visible {
          outline: 2px solid #0f766e;
          outline-offset: 3px;
          border-radius: 3px;
        }
        .ps-stw-caret { font-size: 10px; opacity: 0.55; }
        .ps-stw-menu {
          display: none;
          position: absolute;
          top: calc(100% + 12px);
          left: -12px;
          z-index: 200;
          background: #ffffff;
          border: 1px solid #d7deea;
          border-radius: 10px;
          box-shadow: 0 6px 24px rgba(22,32,51,0.10);
          padding: 6px;
          min-width: 250px;
          gap: 2px;
        }
        .ps-stw:hover .ps-stw-menu,
        .ps-stw:focus-within .ps-stw-menu {
          display: grid;
        }
        .ps-stw-menu a {
          display: block;
          padding: 10px 14px;
          border-radius: 7px;
          color: #162033;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
        }
        .ps-stw-menu a:hover {
          background: #f0fbf9;
          color: #0f766e;
        }
        .ps-stw-menu a:focus-visible {
          outline: 2px solid #0f766e;
          outline-offset: -2px;
          border-radius: 5px;
        }
      `}</style>
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
          <Link href="/onboarding" className="ps-nav-link">
            Explore
          </Link>

          {/* Stewardship with hover dropdown */}
          <div className="ps-stw">
            <Link href="/stewardship" className="ps-stw-toggle">
              Stewardship{" "}
              <span className="ps-stw-caret" aria-hidden="true">
                ▾
              </span>
            </Link>
            <div className="ps-stw-menu" role="menu">
              {STEWARDSHIP_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} role="menuitem">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/trust" className="ps-nav-link">
            Trust
          </Link>
          <Link href="/data-rights" className="ps-nav-link">
            Data Rights
          </Link>
        </div>
      </nav>
    </header>
  );
}
