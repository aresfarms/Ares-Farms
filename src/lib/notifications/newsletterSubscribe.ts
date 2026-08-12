/**
 * newsletterSubscribe — add an email to the Dispatch mailing list.
 *
 * To avoid a parallel PII store, the address is handed to SendGrid's Marketing
 * Contacts (the email service holds the list, like any mailing list), not a
 * Furlong table. Reads SENDGRID_API_KEY from the secret env; if it isn't set,
 * this is a safe no-op ("not-configured") — it NEVER throws.
 *
 * Master Volume Governance: minimum PII (email + consent only); the list lives
 * with the ESP; consent is captured on the form before this is called.
 */

export type SubscribeResult = {
  subscribed: boolean;
  mode: "subscribed" | "not-configured" | "error";
};

export async function subscribeToDispatch(email: string): Promise<SubscribeResult> {
  const key = process.env.SENDGRID_API_KEY;
  const clean = email.trim();
  if (!clean || !clean.includes("@")) {
    return { subscribed: false, mode: "error" };
  }
  if (!key) {
    return { subscribed: false, mode: "not-configured" };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contacts: [{ email: clean }] }),
      signal: AbortSignal.timeout(15000),
    });
    // 202 Accepted = queued for processing.
    if (res.status === 202) return { subscribed: true, mode: "subscribed" };
    return { subscribed: false, mode: "error" };
  } catch {
    return { subscribed: false, mode: "error" };
  }
}
