import { NextRequest } from "next/server";

import { handleConstitutionalDoctrineRoute } from "@/lib/governance/constitutionalDoctrineApi";

export async function GET(req: NextRequest) {
  return handleConstitutionalDoctrineRoute(
    req,
    "incidents.status.get",
    "/api/incidents/status"
  );
}
