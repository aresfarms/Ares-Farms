"use client";

/**
 * FurlongCompassWatermark — Build 54
 *
 * Decorative compass watermark. Rendered ONCE by PublicSiteLayout via the
 * (public) route group layout — covers every public page including the
 * homepage. Do NOT render this in individual pages.
 *
 * Positioning fix (Build 54):
 *   Previously used `position: absolute` inside a `position: relative` shell,
 *   which caused the watermark to drift or disappear on tall pages because
 *   top: 50% is relative to the container height, not the viewport.
 *   Fixed: `position: fixed; inset: 0; display: grid; place-items: center`
 *   ensures the watermark is always centered in the viewport regardless of
 *   how tall the page content is.
 *
 * Opacity:
 *   journey variant default: 0.10 (homepage — more vivid)
 *   Pass opacity={0.06} from PublicSiteLayout on subpages.
 *   The `opacity` prop overrides the variant default.
 *
 * Stacking:
 *   z-index: 0 — behind header (z-10) and content (z-10).
 *
 * Variants:
 *   journey  — centered, used by PublicSiteLayout for all public pages
 *   subtle   — softer, centered (for ExplorationJourneyShell contexts)
 *   hero     — reserved for future hero-specific sizing
 *   report   — larger, for portal/report pages
 *
 * Accessibility: aria-hidden="true", alt="", pointer-events: none.
 * Image: /brand/furlong-compass-watermark.png
 *
 * Governance:
 *   "The map reveals opportunities, not the visitor."
 *   Public Alpha remains PENDING.
 */

export type FurlongCompassVariant = "hero" | "journey" | "report" | "subtle";

const VARIANT_CLASS: Record<FurlongCompassVariant, string> = {
  hero:    "furlong-compass-watermark--hero",
  journey: "furlong-compass-watermark--journey",
  report:  "furlong-compass-watermark--report",
  subtle:  "furlong-compass-watermark--subtle",
};

/** Default opacity per variant. Pass `opacity` prop to override. */
const VARIANT_OPACITY: Record<FurlongCompassVariant, number> = {
  journey: 0.10,
  subtle:  0.06,
  hero:    0.07,
  report:  0.08,
};

export function FurlongCompassWatermark({
  variant,
  opacity,
  className,
}: {
  variant:    FurlongCompassVariant;
  /** Override the variant's default opacity. */
  opacity?:   number;
  className?: string;
}) {
  const effectiveOpacity = opacity ?? VARIANT_OPACITY[variant];

  const classes = [
    "furlong-compass-watermark",
    VARIANT_CLASS[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{`
        /* ── Base — fixed, full-viewport, centered ──────────────────────────
           position: fixed + inset: 0 ensures the watermark is always centered
           in the viewport, even when page content is taller than the screen.
           (position: absolute in a relative shell drifts on tall pages.)       */
        .furlong-compass-watermark {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          user-select: none;
          z-index: 0;
        }

        .furlong-compass-watermark img {
          display: block;
          height: auto;
          transform-origin: center;
        }

        /* ── journey — homepage + all public pages ───────────────────────────
           Centered by base (no top/left needed).
           Rotation and sizing applied to the img.                              */
        .furlong-compass-watermark--journey img {
          width: min(60vw, 620px);
          transform: rotate(-8deg) scale(1.08);
          filter: blur(0.8px) saturate(0.82);
        }

        /* ── subtle — soft secondary layer ──────────────────────────────────
           Used in ExplorationJourneyShell; centered by base.                  */
        .furlong-compass-watermark--subtle img {
          width: min(46vw, 480px);
          transform: rotate(10deg) scale(1.12);
          filter: blur(2px) saturate(0.78);
        }

        /* ── hero — reserved ────────────────────────────────────────────────── */
        .furlong-compass-watermark--hero img {
          width: min(78vw, 1080px);
          transform: rotate(-11deg) scale(1.18);
          filter: blur(1.3px) saturate(0.82);
        }

        /* ── report — portal/report pages ───────────────────────────────────── */
        .furlong-compass-watermark--report img {
          width: min(55vw, 680px);
          transform: rotate(-8deg) scale(1.10);
          filter: blur(0.8px) saturate(0.86);
        }

        /* ── Mobile adjustments ──────────────────────────────────────────────── */
        @media (max-width: 780px) {
          .furlong-compass-watermark--journey img {
            width: min(80vw, 380px);
          }
          .furlong-compass-watermark--subtle img {
            width: min(70vw, 300px);
          }
        }
      `}</style>

      <span
        aria-hidden="true"
        className={classes}
        style={{ opacity: effectiveOpacity }}
      >
        { }
        <img
          src="/brand/furlong-compass-watermark.png"
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      </span>
    </>
  );
}
