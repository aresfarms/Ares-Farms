import type { ReplacementCredential } from "@/lib/security/secretRotationWorkflow";
import type { SecretRotationPolicyEntry } from "@/lib/security/secretRotationPolicy";

type ProviderAdapterResponse = Readonly<{
  credentialValue?: unknown;
  credentialId?: unknown;
  previousCredentialId?: unknown;
  providerEventReference?: unknown;
}>;

export type ProviderAdapterTokenSource = (audience: string) => Promise<string>;

function adapterUrl(baseUrl: string, operation: "create" | "retire"): string {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:") throw new Error("Provider rotation adapter must use HTTPS.");
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Provider rotation adapter URL must not contain credentials, query data, or fragments.");
  }
  parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/v1/credentials/${operation}`;
  return parsed.toString();
}

async function request(
  url: string,
  tokenSource: ProviderAdapterTokenSource,
  body: Readonly<Record<string, unknown>>
): Promise<ProviderAdapterResponse> {
  const token = await tokenSource(new URL(url).origin);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Provider rotation adapter returned HTTP ${response.status}.`);
  return await response.json() as ProviderAdapterResponse;
}

export async function createProviderReplacement(
  entry: SecretRotationPolicyEntry,
  rotationId: string,
  baseUrl: string,
  tokenSource: ProviderAdapterTokenSource
): Promise<ReplacementCredential> {
  const result = await request(adapterUrl(baseUrl, "create"), tokenSource, {
    rotationId,
    secretName: entry.name,
    provider: entry.provider,
    overlapHours: entry.overlapHours,
    requestedScope: "CREATE_REPLACEMENT_ONLY",
  });
  if (
    typeof result.credentialValue !== "string" || !result.credentialValue ||
    typeof result.credentialId !== "string" || !result.credentialId ||
    typeof result.providerEventReference !== "string" || !result.providerEventReference
  ) {
    throw new Error("Provider rotation adapter response is incomplete.");
  }
  return {
    value: result.credentialValue,
    providerCredentialId: result.credentialId,
    previousProviderCredentialId:
      typeof result.previousCredentialId === "string" && result.previousCredentialId
        ? result.previousCredentialId
        : null,
    providerEventReference: result.providerEventReference,
  };
}

export async function retireProviderCredential(
  entry: SecretRotationPolicyEntry,
  rotationId: string,
  credentialId: string,
  baseUrl: string,
  tokenSource: ProviderAdapterTokenSource
): Promise<void> {
  await request(adapterUrl(baseUrl, "retire"), tokenSource, {
    rotationId,
    secretName: entry.name,
    provider: entry.provider,
    credentialId,
    requestedScope: "RETIRE_SUPERSEDED_ONLY",
  });
}
