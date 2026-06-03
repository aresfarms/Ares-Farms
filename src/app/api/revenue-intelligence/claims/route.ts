import { NextRequest } from "next/server";

import { handleRevenueSourceIntelligenceRoute } from "@/lib/revenue-intelligence/revenueSourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.claims",
    "/api/revenue-intelligence/claims"
  );
}

export async function POST(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.claims",
    "/api/revenue-intelligence/claims"
  );
}
