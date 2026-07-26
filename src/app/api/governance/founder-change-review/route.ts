import { NextRequest, NextResponse } from "next/server";

import {
  founderChangeReviewSnapshot,
  founderPrincipalForEmail,
  freezeFounderChangeReport,
  recordFounderLaunchAuthority,
  recordFounderOwnerAttestation,
  recordFounderReview,
} from "@/lib/governance/founderChangeReviewStore";
import type { InternalChangeVerificationInput, OwnerAttestation, ReviewerApproval } from "@/lib/governance/internalChangeVerification";
import type { FounderAuthorityRecord } from "@/lib/governance/threeFounderReleaseAuthority";

function authenticated(req: NextRequest) {
  const email = req.headers.get("x-ares-authenticated-email")?.trim().toLowerCase() ?? "";
  return { email, principal: email ? founderPrincipalForEmail(email) : null };
}

export async function GET(req: NextRequest) {
  const { email, principal } = authenticated(req);
  if (!email || !principal) return NextResponse.json({ ok: false, error: "Attributed founder identity required." }, { status: 403 });
  const requestId = req.nextUrl.searchParams.get("requestId")?.trim();
  if (!requestId) return NextResponse.json({ ok: false, error: "requestId is required." }, { status: 400 });
  return NextResponse.json({ ok: true, actor: { email, principal }, snapshot: founderChangeReviewSnapshot(requestId) });
}

export async function POST(req: NextRequest) {
  const { email, principal } = authenticated(req);
  if (!email || !principal) return NextResponse.json({ ok: false, error: "Attributed founder identity required." }, { status: 403 });
  const body = await req.json().catch(() => null) as null | {
    action?: "FREEZE_REPORT" | "OWNER_ATTEST" | "REVIEW" | "LAUNCH_AUTHORITY";
    requestId?: string;
    reportInput?: InternalChangeVerificationInput;
    ownerAttestation?: OwnerAttestation;
    reviewerApproval?: ReviewerApproval;
    founderAuthority?: FounderAuthorityRecord;
  };
  try {
    if (body?.action === "FREEZE_REPORT" && body.reportInput) freezeFounderChangeReport(principal, body.reportInput);
    else if (body?.action === "OWNER_ATTEST" && body.requestId && body.ownerAttestation) recordFounderOwnerAttestation(principal, body.requestId, body.ownerAttestation);
    else if (body?.action === "REVIEW" && body.requestId && body.reviewerApproval) recordFounderReview(principal, body.requestId, body.reviewerApproval);
    else if (body?.action === "LAUNCH_AUTHORITY" && body.requestId && body.founderAuthority) recordFounderLaunchAuthority(principal, body.requestId, body.founderAuthority);
    else return NextResponse.json({ ok: false, error: "A valid workspace action and payload are required." }, { status: 400 });
    const requestId = body.requestId ?? body.reportInput?.evidence.requestId ?? "";
    return NextResponse.json({ ok: true, actor: { email, principal }, snapshot: founderChangeReviewSnapshot(requestId) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Workspace action failed." }, { status: 400 });
  }
}
