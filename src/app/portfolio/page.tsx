import { redirect } from "next/navigation";

/**
 * Legacy demo portfolio route retained only as a compatibility alias.
 * Customers now continue through the owner-scoped My Furlong relationship.
 */
export default function PortfolioPage() {
  redirect("/portal/borrower");
}
