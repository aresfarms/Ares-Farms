export type IdMeReadiness = {
  configured: boolean;
  issuer: string | null;
  clientIdPresent: boolean;
  clientSecretPresent: boolean;
};

export function idMeReadiness(): IdMeReadiness {
  const issuer = process.env.IDME_ISSUER?.trim() || null;
  const clientIdPresent = Boolean(process.env.IDME_CLIENT_ID?.trim());
  const clientSecretPresent = Boolean(process.env.IDME_CLIENT_SECRET?.trim());
  return {
    configured: Boolean(issuer && clientIdPresent && clientSecretPresent),
    issuer,
    clientIdPresent,
    clientSecretPresent,
  };
}

export function assertIdMeConfigured(): void {
  if (!idMeReadiness().configured) throw new Error("ID.me identity provider is not configured.");
}
