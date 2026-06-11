import { NextRequest, NextResponse } from "next/server";

/**
 * Accessibility feedback intake API — Build 56
 *
 * Boundary input: a public visitor reporting an accessibility barrier. This is
 * NOT governed institutional state (no ledger / replay substrate required) — it
 * is a contact-form submission. We validate at the boundary, then deliver the
 * report by email to the accessibility owner so the barrier can be fixed and the
 * visitor told once it is resolved.
 *
 * Delivery:
 *   - If RESEND_API_KEY is configured, the report is emailed via the Resend HTTP
 *     API to ACCESSIBILITY_FEEDBACK_TO (default chudson@aresfarmsinc.com).
 *   - If no mail provider is configured (e.g. local dev), the full structured
 *     report is written to the server log so it is never silently lost, and the
 *     visitor still receives a normal thank-you. Configure RESEND_API_KEY +
 *     ACCESSIBILITY_FEEDBACK_FROM to enable real delivery.
 *
 * Future (not built here): auto-triage the report and email Caitlin a
 * "fixed — please verify" note once the barrier is resolved.
 */

const TO_ADDRESS   = process.env.ACCESSIBILITY_FEEDBACK_TO   ?? "chudson@aresfarmsinc.com";
const FROM_ADDRESS = process.env.ACCESSIBILITY_FEEDBACK_FROM ?? "Furlong Accessibility <accessibility@aresfarmsinc.com>";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

const MAX_LEN = 5_000;

/**
 * Boundary sanitize: drop ASCII control characters (keep tab/newline), trim,
 * and cap length — guards against log/header injection. Implemented without a
 * control-character regex literal for portability.
 */
function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    const isControl = (code < 32 && code !== 9 && code !== 10) || code === 127;
    if (!isControl) out += ch;
  }
  return out.trim().slice(0, MAX_LEN);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const report = {
    page:         clean(body.page),
    problem:      clean(body.problem),
    accessMethod: clean(body.accessMethod),
    email:        clean(body.email),
    submittedAt:  new Date().toISOString(),
  };

  // The barrier description is the one required field — without it there is
  // nothing actionable to send.
  if (!report.problem) {
    return NextResponse.json(
      { ok: false, error: "Please describe what is not working so we can fix it." },
      { status: 400 },
    );
  }

  const subject = `Accessibility report${report.page ? ` — ${report.page}` : ""}`;
  const textBody = [
    "A visitor reported an accessibility barrier on the Furlong site.",
    "",
    `Page or feature: ${report.page || "(not specified)"}`,
    `What is not working: ${report.problem}`,
    `How they access the site: ${report.accessMethod || "(not specified)"}`,
    `Reply-to email: ${report.email || "(not provided)"}`,
    `Submitted: ${report.submittedAt}`,
  ].join("\n");

  let delivered = false;

  if (RESEND_API_KEY) {
    try {
      const htmlBody = `<h2>Accessibility report</h2>
<p>A visitor reported an accessibility barrier on the Furlong site.</p>
<ul>
  <li><strong>Page or feature:</strong> ${escapeHtml(report.page) || "(not specified)"}</li>
  <li><strong>What is not working:</strong> ${escapeHtml(report.problem)}</li>
  <li><strong>How they access the site:</strong> ${escapeHtml(report.accessMethod) || "(not specified)"}</li>
  <li><strong>Reply-to email:</strong> ${escapeHtml(report.email) || "(not provided)"}</li>
  <li><strong>Submitted:</strong> ${escapeHtml(report.submittedAt)}</li>
</ul>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    FROM_ADDRESS,
          to:      [TO_ADDRESS],
          subject,
          text:    textBody,
          html:    htmlBody,
          ...(report.email ? { reply_to: report.email } : {}),
        }),
      });
      delivered = res.ok;
      if (!res.ok) {
        console.error("[accessibility-feedback] mail provider error", res.status, await res.text());
      }
    } catch (err) {
      console.error("[accessibility-feedback] mail send failed", err);
    }
  }

  if (!delivered) {
    // No provider configured, or send failed: never lose the report.
    console.warn(
      `[accessibility-feedback] report NOT emailed (mail provider not configured or send failed). ` +
        `Deliver manually to ${TO_ADDRESS}:\n${textBody}`,
    );
  }

  // Always thank the visitor: their report is captured either way.
  return NextResponse.json({ ok: true });
}
