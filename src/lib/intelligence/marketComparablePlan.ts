import type { PropertyProfileId } from "@/lib/property/propertyProfile";

export interface MarketComparableInput {
  title: string;
  priceLabel: string;
  comparison: "lower" | "similar" | "higher" | null;
  distanceMiles: number | null;
  signals?: string[];
  vintage: string;
  isCurrent: boolean;
  sourceLabel: string;
}

export interface MarketComparablePlan {
  status: "thin" | "preliminary" | "supported";
  acquisitionComparables: MarketComparableInput[];
  alternativePropertyCount: number;
  marketModel: string;
  competitionQuestions: string[];
  decisionRules: string[];
}

function marketModelFor(profileId: PropertyProfileId): string {
  if (profileId === "farm") return "Model commodity basis and logistics separately from direct-market, equestrian, agritourism, or specialty competition.";
  if (profileId === "commercial" || profileId === "hospitality") return "Model trade area, occupancy, pricing, capacity, permit pipeline, and customer capture rather than raw competitor count.";
  if (profileId === "mobile-home-park") return "Model occupancy, lot rents, utilities, deferred infrastructure, licensing, nearby supply, and resident demand.";
  if (profileId === "land") return "Model nearby sale support, access, utilities, entitlement risk, productive capacity, and whether a superior parcel is available.";
  return "Model recent closed sales, condition, location, taxes, insurance, and nearby alternatives before treating list price as value.";
}

export function buildMarketComparablePlan(args: {
  profileId: PropertyProfileId;
  comparables: MarketComparableInput[];
}): MarketComparablePlan {
  const usable = args.comparables.filter((item) => item.title && item.priceLabel);
  return {
    status: usable.length >= 3 ? "supported" : usable.length ? "preliminary" : "thin",
    acquisitionComparables: usable.slice(0, 5),
    alternativePropertyCount: usable.filter((item) => item.comparison === "lower" || item.comparison === "similar").length,
    marketModel: marketModelFor(args.profileId),
    competitionQuestions: [
      "How much real customer demand exists inside the practical travel or service radius?",
      "What capacity, pricing, vacancy, contracts, or throughput already exists nearby?",
      "Does this property offer a defensible advantage, or merely add another undifferentiated operator?",
    ],
    decisionRules: [
      "A physically suitable use can still be rejected when market demand or customer capture is weak.",
      "Nearby properties may be better acquisition choices, not merely valuation references.",
      "Raw competitor count never substitutes for supply, demand, capacity, pricing, and differentiation analysis.",
    ],
  };
}
