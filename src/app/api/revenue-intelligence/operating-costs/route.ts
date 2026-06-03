import { NextRequest } from "next/server";

import { handleRevenueSourceIntelligenceRoute } from "@/lib/revenue-intelligence/revenueSourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.operating-costs",
    "/api/revenue-intelligence/operating-costs"
  );
}

export async function POST(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.operating-costs",
    "/api/revenue-intelligence/operating-costs"
  );
}
