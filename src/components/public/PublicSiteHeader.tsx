import Link from "next/link";

import { FurlongLogo } from "@/components/brand/FurlongLogo";

/**
 * PublicSiteHeader (Build 56) — persistent public header / trust anchor.
 *
 * Flat 4-page navigation (the Build 56 consolidation IA):
 *   Explore (home map) · What We Do (/compass) · Trust & Your Data (/trust) · Our Story (/about)
 *
 * The legacy Stewardship dropdown was retired — stewardship folded into /compass
 * (old /stewardship URLs 308-redirect there). The header is now links only (no
 * menu), so it renders a single <nav aria-label="Furlong"> landmark.
 */

export function PublicSiteHeader() {
  return (
    <header style={{ borderBottom: "1px solid #d7deea", background: "#ffffff" }}>
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
          <Link href="/#explore" className="ps-nav-link">
            Explore
          </Link>
          <Link href="/compass" className="ps-nav-link">
            What We Do
          </Link>
          <Link href="/trust" className="ps-nav-link">
            Trust &amp; Your Data
          </Link>
          <Link href="/about" className="ps-nav-link">
            Our Story
          </Link>
          {/* Professional Access sits AFTER Our Story (founder 2026-08-06):
              the credentialed counterparty door — lender, attorney, auditor,
              sponsor. Public page; the roles themselves are registry-granted. */}
          <Link href="/professional-access" className="ps-nav-link">
            Professional Access
          </Link>
          {/* Check Status must live in the PERMANENT navigation (founder-caught
              2026-08-06). It previously appeared only on the post-submission
              confirmation screen, so a customer who closed that tab — or lost
              the confirmation email — had no route back to their own request at
              all. A customer with money in motion needs this reachable from
              every page, not from one screen they saw once. */}
          <Link href="/status" className="ps-nav-link">
            Check Status
          </Link>
        </div>
      </nav>
    </header>
  );
}
