import { NextResponse } from "next/server";

import { releaseGovernanceEvidenceIntegritySummary } from "@/lib/governance/releaseGovernanceEvidenceStore";

export async function GET() {
  const integrity = releaseGovernanceEvidenceIntegritySummary();
  return NextResponse.json({
    ok: integrity.rejectedRecords === 0,
    integrity,
    productionBlocked: true,
    disclosure: "Counts and coarse rejection reasons only; record contents and identifiers are not exposed.",
  });
}
