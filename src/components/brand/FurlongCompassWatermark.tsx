const VARIANT_CLASS: Record<FurlongCompassVariant, string> = {
  hero: "furlong-compass-watermark--hero",
  journey: "furlong-compass-watermark--journey",
  report: "furlong-compass-watermark--report",
  subtle: "furlong-compass-watermark--subtle",
};

export type FurlongCompassVariant = "hero" | "journey" | "report" | "subtle";

export function FurlongCompassWatermark({
  variant,
  className,
}: {
  variant: FurlongCompassVariant;
  className?: string;
}) {
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
        .furlong-compass-watermark {
          position: absolute;
          display: block;
          pointer-events: none;
          user-select: none;
          z-index: 0;
          overflow: visible;
        }

        .furlong-compass-watermark img {
          display: block;
          width: 100%;
          height: auto;
          opacity: inherit;
          filter: inherit;
          transform-origin: center;
        }

        .furlong-compass-watermark--hero {
          inset: -36px -36px auto auto;
          width: min(78vw, 1080px);
          opacity: 0.068;
          filter: blur(1.3px) saturate(0.82);
          transform: rotate(-11deg);
        }

        .furlong-compass-watermark--hero img {
          transform: scale(1.18);
        }

        .furlong-compass-watermark--subtle {
          inset: 320px auto auto -120px;
          width: min(50vw, 720px);
          opacity: 0.036;
          filter: blur(2px) saturate(0.78);
          transform: rotate(10deg);
        }

        .furlong-compass-watermark--subtle img {
          transform: scale(1.12);
        }

        .furlong-compass-watermark--journey {
          inset: 22px -64px auto auto;
          width: min(42vw, 440px);
          opacity: 0.04;
          filter: blur(1px) saturate(0.84);
          transform: rotate(-10deg);
        }

        .furlong-compass-watermark--journey img {
          transform: scale(1.14);
        }

        .furlong-compass-watermark--report {
          inset: -10% -8% auto auto;
          width: min(55vw, 680px);
          opacity: 0.12;
          filter: blur(0.8px) saturate(0.86);
          transform: rotate(-8deg);
        }

        .furlong-compass-watermark--report img {
          transform: scale(1.1);
        }

        @media (max-width: 780px) {
          .furlong-compass-watermark--hero {
            inset: 52px -56px auto auto;
            width: min(94vw, 520px);
            opacity: 0.042;
            filter: blur(1px) saturate(0.78);
            transform: rotate(-8deg);
          }

          .furlong-compass-watermark--subtle {
            inset: 420px auto auto -110px;
            width: min(74vw, 360px);
            opacity: 0.02;
          }

          .furlong-compass-watermark--journey {
            inset: 40px -72px auto auto;
            width: min(72vw, 320px);
            opacity: 0.026;
            filter: blur(0.8px) saturate(0.78);
          }
        }
      `}</style>

      <span
        aria-hidden="true"
        className={classes}
      >
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
