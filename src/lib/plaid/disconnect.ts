import { cryptoShredPlaidSubject, readPlaidSecret } from "@/lib/plaid/secureDataStore";

function plaidBaseUrl(): string {
  const env = (process.env.PLAID_ENV || "sandbox").trim().toLowerCase();
  if (env === "production") return "https://production.plaid.com";
  if (env === "development") return "https://development.plaid.com";
  return "https://sandbox.plaid.com";
}

function plaidCredentials() {
  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const secret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !secret) throw new Error("Plaid provider credentials are not configured.");
  return { clientId, secret };
}

export async function revokePlaidAccessAndPurge(args: {
  subjectRef: string;
  accessTokenRecordId: string;
}) {
  const accessToken = await readPlaidSecret<string>(args.accessTokenRecordId, args.subjectRef);
  if (!accessToken) throw new Error("Plaid access token record is unavailable or already purged.");
  const { clientId, secret } = plaidCredentials();
  const response = await fetch(`${plaidBaseUrl()}/item/remove`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: clientId, secret, access_token: accessToken }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Plaid item removal failed with HTTP ${response.status}.`);

  const purgedRecords = await cryptoShredPlaidSubject(args.subjectRef);
  return { providerAccessRevoked: true, purgedRecords };
}
