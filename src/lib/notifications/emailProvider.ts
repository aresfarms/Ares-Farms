/**
 * emailProvider — a minimal, governed email send abstraction.
 *
 * Reads configuration from environment/secrets ONLY (never hard-coded keys):
 *   EMAIL_FROM         — verified sender address (required to send)
 *   SENDGRID_API_KEY   — SendGrid v3 key (the one supported provider for now)
 *
 * If it isn't configured, send() is a safe no-op that reports mode
 * "not-configured" — it NEVER throws and never blocks the caller. This is the
 * same gated posture the platform uses for other external actions: the
 * mechanism is built now; real delivery turns on when the sender + key are set.
 *
 * Master Volume Governance:
 * - TECH-VAULT-001: credentials come from the secret environment, never code.
 * - Minimum disclosure: callers must pass PII-free content (see
 *   notificationDispatch) — this layer only transports what it's given.
 */

export type EmailSendResult =
  | { sent: true; provider: "sendgrid" }
  | { sent: false; mode: "not-configured" | "error"; reason?: string };

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.EMAIL_FROM && process.env.SENDGRID_API_KEY);
}

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const from = process.env.EMAIL_FROM;
  const key = process.env.SENDGRID_API_KEY;

  if (!from || !key) {
    return { sent: false, mode: "not-configured" };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: message.to }] }],
        from: { email: from },
        subject: message.subject,
        content: [{ type: "text/plain", value: message.text }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.status >= 200 && res.status < 300) {
      return { sent: true, provider: "sendgrid" };
    }
    return { sent: false, mode: "error", reason: `sendgrid HTTP ${res.status}` };
  } catch (error) {
    return {
      sent: false,
      mode: "error",
      reason: error instanceof Error ? error.message : "unknown send error",
    };
  }
}
