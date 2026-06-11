import { PublicSiteLayout } from "@/components/public/PublicSiteLayout";

/**
 * Borrower portal layout — Build 50
 *
 * Applies to /portal/borrower and all sub-routes:
 *   /portal/borrower/applications  /portal/borrower/data-rights
 *   /portal/borrower/documents     /portal/borrower/environmental-intake
 *   /portal/borrower/notices       /portal/borrower/opportunities
 *   /portal/borrower/reports
 *
 * Uses PublicSiteLayout — the single source of truth for:
 *   - Header (PublicSiteHeader — appears ONCE)
 *   - Compass watermark (appears ONCE)
 *   - Global utility footer (appears ONCE)
 *
 * Sub-routes are internal PENDING pages and also receive this layout.
 * They will be migrated to an internal-authenticated layout after Alpha.
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

export default function BorrowerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicSiteLayout>{children}</PublicSiteLayout>;
}
