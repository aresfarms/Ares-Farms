import { RevenueIntelligenceSurface } from "@/components/revenue/RevenueIntelligenceSurface";

export default function PortalRevenueOpportunitiesPage() {
  return (
    <RevenueIntelligenceSurface
      audience="borrower"
      eyebrow="Borrower Revenue Opportunities"
      title="Revenue Opportunity Review"
      routeLabel="/portal/revenue-opportunities"
    />
  );
}
