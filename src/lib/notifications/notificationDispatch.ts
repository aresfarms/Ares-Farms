import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { emailConfigured, sendEmail } from "@/lib/notifications/emailProvider";

/**
 * notificationDispatch — the shared "a human needs to respond" notifier for any
 * module. When a governed request is submitted, this alerts the right person
 * with a MINIMUM-DISCLOSURE message: what kind of request, its reference id, and
 * a link to review it in the portal — NEVER the customer's PII. The data stays
 * in the governed store; the email is only a "you have something to look at."
 *
 * It NEVER throws and NEVER blocks the submitting request: a notification
 * failure (or an unconfigured email provider) is recorded and swallowed, so a
 * customer's order/intake always succeeds regardless.
 *
 * Extensible: any new module that needs a response registers a recipient for
 * its `routedTo` spoke and calls notifyOnServiceRequest — no new plumbing.
 *
 * Master Volume Governance:
 * - Vol II (minimum disclosure / Section 1071): no PII, no demographic data, no
 *   deal details in the message — only a reference id and a portal link.
 * - Vol III-B: the dispatch records a governed observability event + evidence.
 * - Bright line: recipients + sender come from the secret environment.
 */

const RECIPIENT_ENV_BY_SPOKE: Record<string, string> = {
  "environmental-engineering-spoke": "NOTIFY_PE_EMAIL",
  "licensed-lending-spoke": "NOTIFY_LENDER_EMAIL",
};

function recipientFor(routedTo: string): string | null {
  const envKey = RECIPIENT_ENV_BY_SPOKE[routedTo];
  const email = envKey ? process.env[envKey] : undefined;
  return email && email.includes("@") ? email : null;
}

function portalUrl(): string {
  const base =
    process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "";
  return base ? `${base.replace(/\/$/, "")}/portal/fulfillment` : "/portal/fulfillment";
}

const LABEL_BY_TYPE: Record<string, string> = {
  environmental_report_order: "environmental service order",
  financing_deal_intake: "financing deal",
};

export interface NotifyOnServiceRequestInput {
  requestType: string;
  serviceRequestId: string;
  routedTo: string;
  traceId: string;
}

export type NotifyResult = {
  attempted: boolean;
  delivered: boolean;
  mode: string;
};

/**
 * Notify the routed licensed professional that a new request is waiting. Safe
 * to call from any governed intake route — it returns a result and never throws.
 */
export async function notifyOnServiceRequest(
  input: NotifyOnServiceRequestInput
): Promise<NotifyResult> {
  const label = LABEL_BY_TYPE[input.requestType] ?? "request";
  const recipient = recipientFor(input.routedTo);

  let delivered = false;
  let mode = "not-configured";

  try {
    if (recipient && emailConfigured()) {
      const result = await sendEmail({
        to: recipient,
        subject: `New ${label} to review — ${input.serviceRequestId}`,
        // MINIMUM DISCLOSURE: reference + link only. No customer PII.
        text:
          `A new ${label} (reference ${input.serviceRequestId}) has been submitted and is waiting ` +
          `for your review.\n\nOpen the fulfillment queue to see the details:\n${portalUrl()}\n\n` +
          `This message intentionally contains no customer information — the details live only in ` +
          `the governed portal.`,
      });
      delivered = result.sent;
      mode = result.sent ? "sent" : result.mode;
    } else {
      mode = recipient ? "not-configured" : "no-recipient";
    }
  } catch (error) {
    mode = "error";
    delivered = false;
    void error;
  }

  // Governed record of the notification attempt (never blocks the caller).
  try {
    const observability = createObservabilityEvent({
      eventType: "SERVICE_REQUEST_NOTIFICATION",
      domain: "operations",
      severity: delivered ? "INFO" : "WARN",
      message: `Service-request notification ${delivered ? "sent" : "not sent"} (${mode}).`,
      traceId: input.traceId,
      replayRef: input.traceId,
      module: "notifications.dispatch",
      metadata: {
        requestType: input.requestType,
        serviceRequestId: input.serviceRequestId,
        routedTo: input.routedTo,
        delivered,
        mode,
        // Never log the recipient address or any PII.
      },
    });
    await persistGovernanceEvidence({
      traceId: input.traceId,
      replayRef: input.traceId,
      observability,
      metadata: { route: "notifications.dispatch", delivered, mode },
    });
  } catch {
    // Evidence persistence must never break the submitting request.
  }

  return { attempted: true, delivered, mode };
}
