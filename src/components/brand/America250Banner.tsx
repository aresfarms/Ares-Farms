/**
 * America250Banner — Build 52
 *
 * Full-width commemorative panel placed between PublicSiteHeader and the
 * homepage hero. Structure (desktop row, mobile column):
 *   [Betsy Ross 13-star flag]  |  AMERICA 250 centrepiece  |  US 50-star flag
 *
 * "Then → Now" symbolism: 1777 circle of 13 stars to 2026 grid of 50.
 *
 * Accessible contrast on #162033 navy background (WCAG 2.2 AA):
 *   Furlong gold   #c9a84c  →  7.1:1  (heading, "innovation") ✓ AA
 *   Civic blue     #93c5fd  →  9.3:1  ("growth", "opportunity") ✓ AAA
 *   Civic red      #fc8181  →  7.0:1  ("stewardship") ✓ AA
 *   Light body     rgba(232,239,250,0.88)  →  ~9.5:1  ✓ AAA
 *
 * No animation. No geolocation. No visitor data.
 * Public Alpha remains PENDING.
 */

// ── Flag constants ─────────────────────────────────────────────────────────────

const FLAG_RED   = "#BF0A30";
const FLAG_BLUE  = "#002868";
const FLAG_WHITE = "#FFFFFF";

// viewBox "0 0 190 100" — flag proportions 19:10
const CANTON_W  = 76;
const CANTON_H  = 53.85;   // 7 stripe heights
const STRIPE_H  = 7.692;   // 100 / 13
const WHITE_Y   = [7.69, 23.08, 38.46, 53.85, 69.23, 84.62] as const;

// Betsy Ross 13-star circle — center (38, 26.9), radius 20 in canton coords
const BR_STARS: Array<[number, number]> = [
  [38.0,  6.9], [47.2,  9.2], [54.5, 15.6], [57.9, 24.5],
  [56.7, 34.0], [51.3, 41.9], [42.7, 46.3], [33.3, 46.3],
  [24.7, 41.9], [19.3, 34.0], [18.1, 24.5], [21.6, 15.5],
  [28.7,  9.2],
];

// US 50-star grid — alternating rows of 6 and 5 within canton
const US_ROW6 = [5.4, 16.3, 27.1, 38.0, 48.9, 59.7] as const;
const US_ROW5 = [10.9, 21.7, 32.6, 43.4, 54.3] as const;
// 9 rows: 6,5,6,5,6,5,6,5,6 → 30+20 = 50 stars
const US_ROW_Y = [2.7, 8.75, 14.8, 20.85, 26.9, 32.95, 39.0, 45.05, 51.1] as const;

// ── SVG flag primitives ────────────────────────────────────────────────────────

function FlagBase() {
  return (
    <>
      {/* 13 horizontal stripes — red base, white overlays */}
      <rect width={190} height={100} fill={FLAG_RED} />
      {WHITE_Y.map((y) => (
        <rect key={y} x={0} y={y} width={190} height={STRIPE_H} fill={FLAG_WHITE} />
      ))}
    </>
  );
}

function Canton() {
  return <rect x={0} y={0} width={CANTON_W} height={CANTON_H} fill={FLAG_BLUE} />;
}

// ── Flag components ────────────────────────────────────────────────────────────

function BetsyRossFlag() {
  return (
    <svg
      viewBox="0 0 190 100"
      role="img"
      aria-label="Betsy Ross flag — 13 stars in a circle, representing the original 13 colonies, circa 1777"
      style={{ width: "100%", height: "auto", display: "block", borderRadius: 2 }}
    >
      <FlagBase />
      <Canton />
      {BR_STARS.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={2.5} fill={FLAG_WHITE} />
      ))}
    </svg>
  );
}

function USFlag() {
  return (
    <svg
      viewBox="0 0 190 100"
      role="img"
      aria-label="United States flag — 50 stars representing 50 states, present day"
      style={{ width: "100%", height: "auto", display: "block", borderRadius: 2 }}
    >
      <FlagBase />
      <Canton />
      {(US_ROW_Y as readonly number[]).map((y, row) => {
        const xs = row % 2 === 0 ? US_ROW6 : US_ROW5;
        return (xs as readonly number[]).map((x, col) => (
          <circle key={`${row}-${col}`} cx={x} cy={y} r={1.8} fill={FLAG_WHITE} />
        ));
      })}
    </svg>
  );
}

// ── Banner ─────────────────────────────────────────────────────────────────────

export function America250Banner() {
  return (
    <div
      style={{
        background: "#162033",
        borderBottom: "2px solid #c9a84c",
        width: "100%",
      }}
      role="banner"
      aria-label="America 250 — Celebrating 250 years of American history"
    >
      <style>{`
        /* ── Banner layout ───────────────────────────────────────── */
        .a250-inner {
          max-width: 1040px;
          margin: 0 auto;
          padding: 22px 24px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        /* ── Flag column ─────────────────────────────────────────── */
        .a250-flag-col {
          flex: 0 0 auto;
          width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .a250-flag-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.75);
          text-align: center;
          white-space: nowrap;
        }

        /* ── Centre copy ─────────────────────────────────────────── */
        .a250-center {
          flex: 1 1 auto;
          text-align: center;
          display: grid;
          gap: 6px;
          justify-items: center;
        }
        .a250-heading {
          margin: 0;
          font-size: clamp(26px, 3.5vw, 42px);
          font-weight: 900;
          color: #c9a84c;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          line-height: 1.05;
        }
        .a250-sub {
          margin: 0;
          font-size: clamp(13px, 1.6vw, 16px);
          color: rgba(232,239,250,0.88);
          line-height: 1.55;
          max-width: 520px;
          font-weight: 500;
        }
        .a250-word-growth      { color: #93c5fd; font-weight: 700; }
        .a250-word-innovation  { color: #c9a84c; font-weight: 700; }
        .a250-word-stewardship { color: #fc8181; font-weight: 700; }
        .a250-word-opportunity { color: #93c5fd; font-weight: 700; }

        /* ── Responsive ──────────────────────────────────────────── */
        @media (max-width: 600px) {
          .a250-inner {
            flex-direction: column;
            align-items: center;
            gap: 14px;
            padding: 18px 20px 16px;
          }
          /* Flags side-by-side above the title on mobile */
          .a250-flags-mobile-row {
            display: flex;
            gap: 16px;
            align-items: flex-end;
            justify-content: center;
            width: 100%;
          }
          .a250-flag-col {
            width: 90px;
          }
          .a250-center {
            order: 2;
          }
          .a250-flags-desktop-left  { display: none; }
          .a250-flags-desktop-right { display: none; }
        }
        @media (min-width: 601px) {
          .a250-flags-mobile-row { display: none; }
          .a250-flags-desktop-left  { display: flex; }
          .a250-flags-desktop-right { display: flex; }
        }
      `}</style>

      <div className="a250-inner">

        {/* Desktop: left flag */}
        <div
          className="a250-flag-col a250-flags-desktop-left"
          style={{ flexDirection: "column", alignItems: "center", gap: 6 }}
        >
          <BetsyRossFlag />
          <span className="a250-flag-label">1777 · Then</span>
        </div>

        {/* Mobile: both flags side by side, above the title */}
        <div className="a250-flags-mobile-row" aria-hidden="true">
          <div className="a250-flag-col">
            <BetsyRossFlag />
            <span className="a250-flag-label">1777</span>
          </div>
          <div className="a250-flag-col">
            <USFlag />
            <span className="a250-flag-label">2026</span>
          </div>
        </div>

        {/* Centre copy */}
        <div className="a250-center">
          <h2 className="a250-heading">America 250</h2>
          <p className="a250-sub">
            Celebrating 250 years of American{" "}
            <span className="a250-word-growth">growth</span>,{" "}
            <span className="a250-word-innovation">innovation</span>,{" "}
            <span className="a250-word-stewardship">stewardship</span>,{" "}
            and{" "}
            <span className="a250-word-opportunity">opportunity</span>.
          </p>
        </div>

        {/* Desktop: right flag */}
        <div
          className="a250-flag-col a250-flags-desktop-right"
          style={{ flexDirection: "column", alignItems: "center", gap: 6 }}
        >
          <USFlag />
          <span className="a250-flag-label">2026 · Now</span>
        </div>

      </div>
    </div>
  );
}
