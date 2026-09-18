/**
 * America250Banner — post-July-4 civic ribbon
 *
 * The anniversary can still be referenced, but it is no longer the main event.
 * This keeps the America 250 thread present in a lighter, reflective way while
 * returning the homepage focus to Furlong's core promise.
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
        background:
          "linear-gradient(180deg, rgba(22,32,51,0.96) 0%, rgba(22,32,51,0.9) 100%)",
        borderBottom: "1px solid rgba(201,168,76,0.32)",
        width: "100%",
      }}
      role="banner"
      aria-label="America 250 reflection ribbon"
    >
      <style>{`
        /* ── Ribbon layout ───────────────────────────────────────── */
        .a250-inner {
          max-width: 1040px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }

        /* ── Flag chips ──────────────────────────────────────────── */
        .a250-flag-col {
          flex: 0 0 auto;
          width: 58px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .a250-flag-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.62);
          text-align: center;
          white-space: nowrap;
        }

        /* ── Center copy ─────────────────────────────────────────── */
        .a250-center {
          flex: 1 1 auto;
          display: grid;
          gap: 2px;
          text-align: left;
        }
        .a250-heading {
          margin: 0;
          font-size: clamp(12px, 1.4vw, 13px);
          font-weight: 800;
          color: rgba(201,168,76,0.9);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          line-height: 1.1;
        }
        .a250-sub {
          margin: 0;
          font-size: clamp(12.5px, 1.6vw, 14px);
          color: rgba(232,239,250,0.84);
          line-height: 1.45;
          max-width: 680px;
          font-weight: 500;
        }
        .a250-accent {
          color: #c9a84c;
          font-weight: 700;
        }
        .a250-word-opportunity {
          color: #93c5fd;
          font-weight: 700;
        }

        /* ── Responsive ──────────────────────────────────────────── */
        @media (max-width: 600px) {
          .a250-inner {
            align-items: flex-start;
            justify-content: flex-start;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
          }
          .a250-center {
            text-align: center;
          }
          .a250-flag-col {
            width: 52px;
          }
          .a250-flags-mobile-row {
            display: none;
          }
        }
        @media (max-width: 460px) {
          .a250-inner {
            gap: 8px;
          }
          .a250-flag-col {
            display: none;
          }
        }
      `}</style>

      <div className="a250-inner">
        <div
          className="a250-flag-col"
          style={{ flexDirection: "column", alignItems: "center", gap: 6 }}
        >
          <BetsyRossFlag />
          <span className="a250-flag-label">1777</span>
        </div>

        <div className="a250-center">
          <h2 className="a250-heading">America 250</h2>
          <p className="a250-sub">
            The July 4 commemoration has passed, but the thread remains:
            <span className="a250-accent"> 250 years of American continuity</span>,
            land, and civic memory still shape how we think about place,
            stewardship, and <span className="a250-word-opportunity">opportunity</span>.
          </p>
        </div>

        <div
          className="a250-flag-col"
          style={{ flexDirection: "column", alignItems: "center", gap: 6 }}
        >
          <USFlag />
          <span className="a250-flag-label">2026</span>
        </div>
      </div>
    </div>
  );
}
