import { RevenueIntelligenceSurface } from "@/components/revenue/RevenueIntelligenceSurface";

export default function SponsorRevenueOpportunitiesPage() {
  return (
    <RevenueIntelligenceSurface
      audience="sponsor"
      eyebrow="Sponsor Coordination"
      title="Revenue Opportunity Context"
      routeLabel="/sponsor/revenue-opportunities"
    />
  );
}
