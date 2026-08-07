import { createHmac, timingSafeEqual } from "node:crypto";

import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import type { JourneyState } from "@/lib/navigator/narrativeInterpreter";

const PURPOSE = "furlong.navigator.journey-state.v1";

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => key !== "integrity" && record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
}

function signingSecret(): string {
  const secret = resolveNextAuthSecret();
  if (!secret) throw new Error("NEXTAUTH_SECRET is required to protect Navigator state.");
  return secret;
}

function signature(journey: JourneyState): string {
  return createHmac("sha256", signingSecret())
    .update(PURPOSE)
    .update("\0")
    .update(canonical(journey))
    .digest("hex");
}

export function protectJourneyState(journey: JourneyState): JourneyState {
  return { ...journey, integrity: `v1.${signature(journey)}` };
}

export function verifyJourneyState(journey: JourneyState): boolean {
  const supplied = journey.integrity;
  if (!supplied?.startsWith("v1.")) return false;
  const expected = `v1.${signature(journey)}`;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}
