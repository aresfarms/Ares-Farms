import type { MetadataRoute } from "next";

/**
 * Robots policy. On the LOCKED PREVIEW (PREVIEW_NOINDEX=1) the whole site is
 * disallow-all — belt-and-suspenders on top of the Basic-auth wall (which already
 * returns 401 + X-Robots-Tag noindex to crawlers). Anywhere else this is inert
 * (allow-all) until a real public-launch policy is set. Public Alpha PENDING.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.PREVIEW_NOINDEX === "1") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return { rules: [{ userAgent: "*", allow: "/" }] };
}
