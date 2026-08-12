export type PlaidReadiness = {
  configured: boolean;
  clientIdPresent: boolean;
  secretPresent: boolean;
  environment: string;
};

export function plaidReadiness(): PlaidReadiness {
  const clientIdPresent = Boolean(process.env.PLAID_CLIENT_ID?.trim());
  const secretPresent = Boolean(process.env.PLAID_SECRET?.trim());
  const environment = process.env.PLAID_ENV?.trim() || "sandbox";
  return { configured: clientIdPresent && secretPresent, clientIdPresent, secretPresent, environment };
}

export function assertPlaidConfigured(): void {
  if (!plaidReadiness().configured) throw new Error("Plaid is not configured.");
}
