import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  SYNTHETIC_FIXTURE_SESSION_MAX_AGE_SECONDS,
  allowedSyntheticFixtureOperators,
  createSyntheticFixtureContext,
  issueSyntheticFixtureSessionToken,
  normalizedOperatorIdentity,
  syntheticFixtureRuntimeEnabled,
} from "@/lib/testing/syntheticFixtureLineage";

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/internal/synthetic-fixtures";
  }
  return value;
}

function canonicalRedirectOrigin(req: NextRequest): string {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (url.protocol === "https:" || process.env.NODE_ENV !== "production") {
      return url.origin;
    }
  }

  const forwardedHost = req.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  if (forwardedHost) {
    const url = new URL(`${forwardedProto || "https"}://${forwardedHost}`);
    if (url.hostname !== "0.0.0.0") return url.origin;
  }

  const requestOrigin = req.nextUrl.origin;
  const requestUrl = new URL(requestOrigin);
  if (
    process.env.NODE_ENV !== "production" ||
    !["0.0.0.0", "127.0.0.1", "localhost"].includes(requestUrl.hostname)
  ) {
    return requestUrl.origin;
  }

  throw new Error("Canonical public redirect origin is unavailable.");
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
  if (
    !email ||
    !allowedSyntheticFixtureOperators().has(normalizedOperatorIdentity(email))
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const returnTo = safeReturnTo(req.nextUrl.searchParams.get("returnTo"));
  const redirectUrl = new URL(returnTo, canonicalRedirectOrigin(req));
  const response = NextResponse.redirect(redirectUrl);

  if (req.nextUrl.searchParams.get("clear") === "1") {
    response.cookies.set(SYNTHETIC_FIXTURE_COOKIE, "", {
      httpOnly: true,
      secure: redirectUrl.protocol === "https:",
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
    secure: redirectUrl.protocol === "https:",
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
