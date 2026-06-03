import { NextRequest } from "next/server";

import { handleRevenueSourceIntelligenceRoute } from "@/lib/revenue-intelligence/revenueSourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.marketplace-intel",
    "/api/revenue-intelligence/marketplace"
  );
}

export async function POST(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.marketplace-intel",
    "/api/revenue-intelligence/marketplace"
  );
}
