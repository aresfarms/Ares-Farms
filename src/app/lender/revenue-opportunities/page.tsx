import { RevenueIntelligenceSurface } from "@/components/revenue/RevenueIntelligenceSurface";

export default function LenderRevenueOpportunitiesPage() {
  return (
    <RevenueIntelligenceSurface
      audience="lender"
      eyebrow="Lender Coordination"
      title="Revenue Opportunity Context"
      routeLabel="/lender/revenue-opportunities"
    />
  );
}
