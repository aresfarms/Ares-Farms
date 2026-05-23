import crypto from "crypto";

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function createEventHash(event: any, prevHash: string | null) {
  const normalized = JSON.stringify(
    {
      ...event,
      prevHash: prevHash ?? null,
    },
    Object.keys(event).sort()
  );

  return sha256(normalized);
}
