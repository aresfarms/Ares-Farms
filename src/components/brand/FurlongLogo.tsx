import Image from "next/image";
import Link from "next/link";

/**
 * FurlongLogo — shared interactive web identity.
 *
 * The founder-supplied lighthouse / safeguarding-coasts emblem is the visible
 * home button across the public header, exploration journeys, and portal
 * surfaces. Formal report exports keep their separate print-branding asset.
 *
 * Master Volume traceability:
 * - Vol I CONST-BRAND-001: one recognizable platform identity.
 * - Vol III TECH-UX-001: stable dimensions and keyboard-visible navigation.
 * - Vol V CANON-CLAIMS-001: the emblem is identity, not a capability claim.
 */

export type FurlongLogoSize = "hero" | "header" | "report" | "compact";

export const FURLONG_WEB_EMBLEM_SRC = "/brand/furlong-portal-emblem.jpg";

const DIMS: Record<FurlongLogoSize, number> = {
  hero: 160,
  header: 64,
  report: 112,
  compact: 52,
};

export function FurlongLogo({
  size = "header",
  withWordmark = true,
  href,
  className,
}: {
  size?: FurlongLogoSize;
  withWordmark?: boolean;
  href?: string;
  className?: string;
}) {
  const dimension = DIMS[size];
  const accessibleLabel = href
    ? href === "/"
      ? "Furlong home"
      : "Furlong"
    : withWordmark
      ? "Furlong"
      : "Furlong emblem";

  const emblem = (
    <span
      className={["furlong-web-emblem", className].filter(Boolean).join(" ")}
      style={{ width: dimension, height: dimension }}
    >
      <Image
        src={FURLONG_WEB_EMBLEM_SRC}
        alt={href ? "" : accessibleLabel}
        width={dimension}
        height={dimension}
        preload={size === "header"}
        sizes={`${dimension}px`}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </span>
  );

  return (
    <>
      <style>{`
        .furlong-web-emblem {
          display: inline-flex;
          flex: none;
          overflow: hidden;
          border: 1px solid #8a5a12;
          border-radius: 16%;
          background: #25313a;
          box-shadow: 0 3px 10px rgba(15, 23, 42, 0.22);
          line-height: 1;
        }
        a.furlong-home-button {
          display: inline-flex;
          border-radius: 14px;
          text-decoration: none;
          transition: transform 140ms ease, filter 140ms ease;
        }
        a.furlong-home-button:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }
        a.furlong-home-button:focus-visible {
          outline: 3px solid #0f766e;
          outline-offset: 4px;
        }
        a.furlong-home-button:active { transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          a.furlong-home-button { transition: none; }
        }
      `}</style>
      {href ? (
        <Link
          href={href}
          aria-label={accessibleLabel}
          title="Furlong home"
          className="furlong-home-button"
        >
          {emblem}
        </Link>
      ) : (
        emblem
      )}
    </>
  );
}
