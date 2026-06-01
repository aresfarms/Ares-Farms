import crypto from "crypto";

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function createEventHash(event: any, prevHash: string | null) {
  const eventWithChainRef = {
    ...event,
    prevHash: prevHash ?? null,
  };

  const normalized = JSON.stringify(
    eventWithChainRef,
    Object.keys(eventWithChainRef).sort()
  );

  return sha256(normalized);
}
