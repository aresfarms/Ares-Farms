/**
 * emailProvider — a minimal, governed email send abstraction.
 *
 * Reads configuration from environment/secrets ONLY (never hard-coded keys):
 *   EMAIL_FROM            — sender address shown to the customer (required)
 *   GMAIL_DELEGATED_USER  — Workspace mailbox the portal sends AS (Gmail API
 *                           via keyless domain-wide delegation; the FREE path —
 *                           founder direction 2026-08-06: no paid SendGrid)
 *   SENDGRID_API_KEY      — SendGrid v3 key (legacy fallback; used only when
 *                           the Gmail provider is not configured)
 *
 * Gmail provider (preferred): the Cloud Run service account signs a JWT via
 * the IAM Credentials API (signJwt on ITSELF — keyless, no downloaded keys),
 * asserting the delegated Workspace user; the token exchange yields a Gmail
 * access token and the message sends as real Google Workspace mail — SPF/
 * DKIM/DMARC aligned with the domain the founders already operate. Setup on
 * the Workspace side is one Admin-console domain-wide-delegation entry.
 *
 * If nothing is configured, send() is a safe no-op that reports mode
 * "not-configured" — it NEVER throws and never blocks the caller.
 *
 * Master Volume Governance:
 * - TECH-VAULT-001: credentials come from the secret environment / IAM, never
 *   code, never downloaded key files.
 * - Minimum disclosure: callers must pass PII-free content (see
 *   notificationDispatch) — this layer only transports what it's given.
 */

export type EmailSendResult =
  | { sent: true; provider: "gmail-workspace" | "sendgrid" }
  | { sent: false; mode: "not-configured" | "error"; reason?: string };

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

const METADATA_BASE = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";

function gmailConfigured(): boolean {
  return Boolean(process.env.EMAIL_FROM && process.env.GMAIL_DELEGATED_USER);
}

function sendgridConfigured(): boolean {
  return Boolean(process.env.EMAIL_FROM && process.env.SENDGRID_API_KEY);
}

export function emailConfigured(): boolean {
  return gmailConfigured() || sendgridConfigured();
}

async function metadataFetch(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${METADATA_BASE}${path}`, {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(3_000),
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/**
 * Keyless delegated Gmail access token: metadata SA token → iamcredentials
 * signJwt (the runtime SA needs tokenCreator on itself) → oauth2 JWT-bearer
 * exchange asserting the delegated Workspace user.
 */
async function delegatedGmailToken(delegatedUser: string): Promise<string | null> {
  const saEmail = await metadataFetch("/email");
  const saTokenRaw = await metadataFetch("/token");
  if (!saEmail || !saTokenRaw) return null;
  let saToken: string;
  try {
    saToken = (JSON.parse(saTokenRaw) as { access_token?: string }).access_token ?? "";
  } catch {
    return null;
  }
  if (!saToken) return null;

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: saEmail.trim(),
    sub: delegatedUser,
    scope: GMAIL_SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  try {
    const signRes = await fetch(
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(saEmail.trim())}:signJwt`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${saToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ payload: JSON.stringify(claims) }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!signRes.ok) return null;
    const { signedJwt } = (await signRes.json()) as { signedJwt?: string };
    if (!signedJwt) return null;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signedJwt,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenRes.ok) return null;
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    return access_token ?? null;
  } catch {
    return null;
  }
}

/** RFC 2047 encoded-word: headers have no charset mechanism of their own, so
 *  any non-ASCII subject (em-dashes!) must be wrapped or it renders as
 *  mojibake (founder test 2026-08-06: "Ã¢Â€Â"" in the subject line). */
function headerValue(value: string): string {
  return /[^\x20-\x7E]/.test(value)
    ? `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
    : value;
}

function rfc822(message: EmailMessage, from: string): string {
  const raw =
    `From: ${from}\r\n` +
    `To: ${message.to}\r\n` +
    `Subject: ${headerValue(message.subject)}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n` +
    `Content-Transfer-Encoding: base64\r\n` +
    `\r\n` +
    Buffer.from(message.text, "utf8").toString("base64");
  return Buffer.from(raw).toString("base64url");
}

async function sendViaGmail(message: EmailMessage): Promise<EmailSendResult> {
  const from = process.env.EMAIL_FROM as string;
  const delegatedUser = process.env.GMAIL_DELEGATED_USER as string;
  const token = await delegatedGmailToken(delegatedUser.trim());
  if (!token) {
    return {
      sent: false,
      mode: "error",
      reason: "gmail delegation token unavailable (check domain-wide delegation + tokenCreator grant)",
    };
  }
  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: rfc822(message, from) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status >= 200 && res.status < 300) {
      return { sent: true, provider: "gmail-workspace" };
    }
    return { sent: false, mode: "error", reason: `gmail HTTP ${res.status}` };
  } catch (error) {
    return {
      sent: false,
      mode: "error",
      reason: error instanceof Error ? error.message : "unknown gmail send error",
    };
  }
}

async function sendViaSendgrid(message: EmailMessage): Promise<EmailSendResult> {
  const from = process.env.EMAIL_FROM as string;
  const key = process.env.SENDGRID_API_KEY as string;
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

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  if (gmailConfigured()) return sendViaGmail(message);
  if (sendgridConfigured()) return sendViaSendgrid(message);
  return { sent: false, mode: "not-configured" };
}
