import { NextRequest, NextResponse } from "next/server";
import {
  lenderSubmissionDenied,
  lenderSubmissionError,
  lenderSubmissionRequestContext,
} from "@/lib/lender-submission/api";
import { persistRecipientVerification } from "@/lib/lender-submission/store";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  verifySyntheticFixtureSessionToken,
} from "@/lib/testing/syntheticFixtureLineage";

export async function POST(req: NextRequest) {
  const context = lenderSubmissionRequestContext(
    req,
    "lender-submission.recipient.verify",
    ["lender", "operator", "admin", "governance"],
  );
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    const body = await req.json();
    const secret = resolveNextAuthSecret();
    const email = req.headers.get("x-ares-authenticated-email");
    const rawFixture = req.cookies.get(SYNTHETIC_FIXTURE_COOKIE)?.value;
    const syntheticFixtureContext =
      rawFixture && secret && email
        ? verifySyntheticFixtureSessionToken(rawFixture, secret, email)
        : null;
    if (
      rawFixture &&
      (!syntheticFixtureContext ||
        !["lender-dispatch-sandbox", "full-lender-lifecycle"].includes(
          syntheticFixtureContext.scenarioId,
        ))
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "The active synthetic fixture is not authorized for lender recipient verification.",
        },
        { status: 403 },
      );
    }
    const recipient = await persistRecipientVerification({
      ...body,
      actorId: context.actorId,
      traceId: context.traceId,
      syntheticFixtureContext,
    });
    return NextResponse.json(
      {
        ok: true,
        recipient,
        governance: { traceId: context.traceId, rawDestinationStored: false },
      },
      { status: 201 },
    );
  } catch (error) {
    return lenderSubmissionError(error, context.traceId);
  }
}
