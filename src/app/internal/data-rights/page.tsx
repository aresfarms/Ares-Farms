import { PortableVerticalSurfacePage } from "@/app/portal/verticalSurfacePage";

/**
 * /internal/data-rights — Module 19: Borrower Data Rights and Portability Workspace.
 *
 * INTERNAL operator surface. Build 56: moved here off the public "/data-rights"
 * path to remove the collision with the public site (public /data-rights
 * redirects to /trust#your-data). This route is internal-only — PlatformChrome
 * renders the operator chrome on /internal/* and the public-leak gate forbids
 * any public page from linking here.
 */
export default function InternalBorrowerDataRightsPage() {
  return <PortableVerticalSurfacePage surfaceId="borrower-data-rights" />;
}
