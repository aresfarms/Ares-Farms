import { PublicSiteLayout } from "@/components/public/PublicSiteLayout";

/**
 * Public-facing route group layout — Build 53
 *
 * Applies to every page under src/app/(public)/:
 *   /  /about  /about/furlong-story  /trust  /data-rights
 *   /stewardship  /stewardship/[domainId]  /onboarding  /accessibility
 *
 * Uses PublicSiteLayout — the single source of truth for:
 *   - Compass watermark (centered, z-1)
 *   - Site header (Furlong wordmark + nav)
 *   - Skip-to-main link (WCAG 2.4.1)
 *   - Page background and font stack
 *
 * Do NOT add FurlongCompassWatermark or a site header to individual public
 * pages — put the page in the (public) group instead.
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicSiteLayout>{children}</PublicSiteLayout>;
}
