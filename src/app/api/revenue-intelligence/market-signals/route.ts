import { NextRequest } from "next/server";

import { handleRevenueSourceIntelligenceRoute } from "@/lib/revenue-intelligence/revenueSourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.market-signals",
    "/api/revenue-intelligence/market-signals"
  );
}

export async function POST(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.market-signals",
    "/api/revenue-intelligence/market-signals"
  );
}
