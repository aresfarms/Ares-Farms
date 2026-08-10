import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  SYNTHETIC_FIXTURE_SESSION_MAX_AGE_SECONDS,
  createSyntheticFixtureContext,
  issueSyntheticFixtureSessionToken,
  syntheticFixtureRuntimeEnabled,
} from "@/lib/testing/syntheticFixtureLineage";

const OWNER_EMAIL = "chudson@aresfarmsinc.com";

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/internal/synthetic-fixtures";
  }
  return value;
}

export async function GET(req: NextRequest) {
  if (!syntheticFixtureRuntimeEnabled()) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const secret = resolveNextAuthSecret();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Session signing authority unavailable." },
      { status: 503 },
    );
  }
  const token = await getToken({ req, secret });
  const email =
    typeof token?.email === "string" ? token.email.trim().toLowerCase() : "";
  if (email !== OWNER_EMAIL)
    return new NextResponse("Not Found", { status: 404 });

  const returnTo = safeReturnTo(req.nextUrl.searchParams.get("returnTo"));
  const response = NextResponse.redirect(new URL(returnTo, req.url));

  if (req.nextUrl.searchParams.get("clear") === "1") {
    response.cookies.set(SYNTHETIC_FIXTURE_COOKIE, "", {
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    await writeAuditEvent({
      userId: typeof token?.sub === "string" ? token.sub : email,
      eventType: "SYNTHETIC_FIXTURE_SESSION_CLEARED",
      entityType: "SYNTHETIC_FIXTURE_SESSION",
      entityId: email,
      source: "api.internal.synthetic-fixtures",
      moduleId: "api.internal.synthetic-fixtures",
      actorRef: `user:${email}`,
      target: { type: "synthetic-fixture-session", id: email },
      payload: {
        operatorIdentity: `user:${email}`,
        environment:
          process.env.FURLONG_DEPLOYMENT_ENVIRONMENT ?? "development",
      },
    });
    return response;
  }

  const syntheticPersonaId =
    req.nextUrl.searchParams.get("persona")?.trim() ?? "";
  const scenarioId = req.nextUrl.searchParams.get("scenario")?.trim() ?? "";
  const context = createSyntheticFixtureContext({
    syntheticPersonaId,
    scenarioId,
    operatorIdentity: email,
  });
  const signed = issueSyntheticFixtureSessionToken(context, secret);
  response.cookies.set(SYNTHETIC_FIXTURE_COOKIE, signed, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: SYNTHETIC_FIXTURE_SESSION_MAX_AGE_SECONDS,
  });

  await writeAuditEvent({
    userId: typeof token?.sub === "string" ? token.sub : email,
    eventType: "SYNTHETIC_FIXTURE_SESSION_ACTIVATED",
    entityType: "SYNTHETIC_FIXTURE_SESSION",
    entityId: context.testRunId,
    source: "api.internal.synthetic-fixtures",
    moduleId: "api.internal.synthetic-fixtures",
    actorRef: context.operatorIdentity,
    target: { type: "synthetic-test-run", id: context.testRunId },
    payload: context,
    metadata: { replayRef: context.testRunId },
    traceId: context.testRunId,
  });

  return response;
}
