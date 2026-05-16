export function getTenantFromApiKey(req: Request): string {
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    throw new Error("Missing API key");
  }

  // simple deterministic mapping for now
  if (apiKey.includes("SBA")) return "SBA_BANK_001";

  return "SBA_BANK_001";
}
