/**
 * PublicWatermark — Build 54
 *
 * Simple, fixed-position compass watermark for non-(public)-layout contexts.
 * Uses position: fixed + inset: 0 + place-items: center so it is always
 * centered in the viewport regardless of its parent's positioning context.
 *
 * USAGE NOTES:
 *
 * • Do NOT add this to src/app/(public)/* pages or the (public) layout.
 *   PublicSiteLayout renders FurlongCompassWatermark (position: absolute,
 *   variant-aware) once for the entire public route group.
 *   Adding PublicWatermark there would produce a duplicate watermark.
 *
 * • Use PublicWatermark in portal pages, overlays, or any context that does
 *   not inherit PublicSiteLayout's compass watermark.
 *
 * • The fixed position means it always sits at viewport center — useful when
 *   the page does not have a single position: relative shell.
 *
 * IMAGE ASSET:
 *   Expected at /public/furlong-compass.svg.
 *   Until that file is placed, the img renders as a broken image in the
 *   browser (build will still succeed — Next.js does not validate img src
 *   paths at compile time).
 *
 *   To create the SVG: export the Furlong compass mark from Figma / Illustrator
 *   as an SVG, place it at public/furlong-compass.svg.
 *   Alternatively, symlink or copy from public/brand/furlong-compass-watermark.png
 *   and update the src below once converted.
 *
 * Accessibility: aria-hidden="true", alt="", pointer-events: none.
 *
 * Governance:
 *   "The map reveals opportunities, not the visitor."
 */

export default function PublicWatermark({ opacity = 0.1 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:         0,
        display:       "grid",
        placeItems:    "center",
        pointerEvents: "none",
        zIndex:        0,
        opacity,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/furlong-compass.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ width: "min(60vw, 520px)" }}
      />
    </div>
  );
}
