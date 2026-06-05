import Link from "next/link";

/**
 * FurlongLogo (Build 44-B) — the journey's North Star / trust anchor.
 *
 * PNG-first logo component using the official Furlong mark at
 * /brand/furlong-logo.png. The SVG can remain as a secondary/vector follow-up,
 * but the canonical in-product asset is now the PNG provided for Build 44-B.
 *
 * The logo supports the journey; it never becomes the journey. It is not a
 * sales banner and never replaces trust language or disclosures.
 */

export type FurlongLogoSize = "hero" | "header" | "report" | "compact";

const LOGO_SRC = "/brand/furlong-logo.png";

const DIMS: Record<FurlongLogoSize, { width: number }> = {
  hero: { width: 220 },
  header: { width: 138 },
  report: { width: 188 },
  compact: { width: 96 },
};

const LOGO_ASPECT_RATIO = 2346 / 1792;

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
  const dims = DIMS[size];
  const height = Math.round(dims.width / LOGO_ASPECT_RATIO);
  const accessibleLabel = href
    ? undefined
    : withWordmark
      ? "Furlong"
      : "Furlong logo";

  const content = (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", lineHeight: 1 }}
    >
      <img
        src={LOGO_SRC}
        alt={accessibleLabel ?? ""}
        width={dims.width}
        height={height}
        style={{ display: "block", width: dims.width, height: "auto" }}
      />
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={href === "/" ? "Furlong home" : "Furlong"}
        style={{ textDecoration: "none", display: "inline-flex" }}
      >
        {content}
      </Link>
    );
  }

  return content;
}
