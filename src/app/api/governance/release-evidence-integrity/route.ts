import { NextResponse } from "next/server";

import { releaseGovernanceEvidenceIntegritySummary } from "@/lib/governance/releaseGovernanceEvidenceStore";

export async function GET() {
  const integrity = releaseGovernanceEvidenceIntegritySummary();
  const integrityFindings = Object.entries(integrity.rejectedByReason)
    .filter(([, count]) => count > 0)
    .map(([reason, count]) => ({
      id: `release-evidence-integrity-${reason.toLowerCase()}`,
      eventType: reason,
      status: "REJECTED_EVIDENCE",
      classification: "CONFIDENTIAL",
      count,
    }));

  return NextResponse.json({
    ok: integrity.rejectedRecords === 0,
    count: integrity.rejectedRecords,
    integrityFindings,
    integrity,
    productionBlocked: true,
    disclosure: "Counts and coarse rejection reasons only; record contents and identifiers are not exposed.",
  });
}
