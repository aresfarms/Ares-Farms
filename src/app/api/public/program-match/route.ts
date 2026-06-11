/**
 * Property → program matching API — PUBLIC (no account), financing-intelligence.
 *
 * Under /api/public (anonymous-allowed). Owned by the financing-intelligence
 * unit (src/app/api/public/program-match/ is mapped there) and only touches that
 * unit's capital-graph taxonomy. Property-driven, illustrative ("may fit"),
 * cited. The property storefront reaches this by HTTP contract — never a
 * cross-unit code import.
 */

import { NextRequest, NextResponse } from "next/server";

import { type PropertyMatchInput } from "@/lib/capital-graph/programMatch";
import {
  verifyPropertyPrograms,
  type VerifiedPlaceFacts,
} from "@/lib/capital-graph/programVerification";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<PropertyMatchInput> & {
    propertyId?: string;
    hubzone?: VerifiedPlaceFacts["hubzone"];
    hubzoneAsOf?: string;
  };
  const verifiedOzTractId = body.verifiedOzTractId ? String(body.verifiedOzTractId) : null;
  const ozAsOf = body.ozAsOf ? String(body.ozAsOf) : null;

  // VERIFIED property-side program matches (registry engine; locked language;
  // positive determinations only; one audit-ledger event per run).
  const verified = verifyPropertyPrograms({
    propertyId: body.propertyId ? String(body.propertyId) : null,
    ozTractId: verifiedOzTractId,
    ozAsOf,
    hubzone: body.hubzone ?? null,
    hubzoneAsOf: body.hubzoneAsOf ? String(body.hubzoneAsOf) : null,
  });

  // VERIFIED-ONLY (Caitlin directive 2026-06-10): the illustrative "may fit"
  // matcher is fully retired from this surface. Every program line is either a
  // verified property-side fact (above) or omitted. `matches` stays an empty
  // array for response-shape compatibility.
  return NextResponse.json({ verified, matches: [] });
}
