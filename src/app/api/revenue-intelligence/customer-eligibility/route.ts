import { NextRequest } from "next/server";

import { handleRevenueSourceIntelligenceRoute } from "@/lib/revenue-intelligence/revenueSourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.customer-type-eligibility",
    "/api/revenue-intelligence/customer-eligibility"
  );
}

export async function POST(req: NextRequest) {
  return handleRevenueSourceIntelligenceRoute(
    req,
    "revenue.customer-type-eligibility",
    "/api/revenue-intelligence/customer-eligibility"
  );
}
