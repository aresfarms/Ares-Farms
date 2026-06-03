import { RevenueIntelligenceSurface } from "@/components/revenue/RevenueIntelligenceSurface";

export default function CustomerRevenuePage() {
  return (
    <RevenueIntelligenceSurface
      audience="internal"
      eyebrow="Governed Revenue Intelligence"
      title="Customer Revenue Review"
      routeLabel="/customer-revenue"
    />
  );
}
