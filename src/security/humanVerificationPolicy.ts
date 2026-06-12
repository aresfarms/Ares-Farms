/**
 * Human Verification Policy — social-engineering controls (group D).
 *
 * Two-channel verification for high-risk requests. ANY urgent request involving
 * access, passwords/MFA, money/wire, keys, exports, permissions, or production
 * changes is SUSPICIOUS until verified out-of-band. Email cannot authorize an
 * email-originated sensitive request by itself. Every high-risk approval records
 * verifier + channel + timestamp + rationale + audit reference (a security
 * event). The build never approves anything; this gates humans.
 */

import { recordSecurityEvent } from "./securityRuntimeGuards";

export type RequestTopic = "access" | "password-mfa" | "money-wire" | "keys" | "export" | "permissions" | "production-change" | "vendor" | "other";
export type Channel = "email" | "phone" | "video" | "in-person" | "passkey-signed" | "chat";

const HIGH_RISK: Set<RequestTopic> = new Set(["access", "password-mfa", "money-wire", "keys", "export", "permissions", "production-change", "vendor"]);
/** Channels that count as an independent SECOND verification channel. */
const STRONG_CHANNELS: Set<Channel> = new Set(["phone", "video", "in-person", "passkey-signed"]);

export interface HighRiskRequest {
  topic: RequestTopic;
  urgent: boolean;
  originChannel: Channel; // how the request arrived
  verification?: {
    verifierName: string;
    channel: Channel; // the SECOND, out-of-band channel
    ts: string;
    rationale: string;
    auditRef: string;
  };
}

export interface VerificationResult {
  ok: boolean;
  highRisk: boolean;
  reasons: string[];
}

export function isHighRisk(topic: RequestTopic): boolean {
  return HIGH_RISK.has(topic);
}

/**
 * Gate a high-risk request. PASS requires a SECOND, out-of-band strong-channel
 * verification distinct from the origin channel, with a full record. Urgency is
 * treated as a RED FLAG, never as a reason to skip verification.
 */
export function verifyHighRiskRequest(req: HighRiskRequest): VerificationResult {
  const reasons: string[] = [];
  const highRisk = isHighRisk(req.topic);
  if (!highRisk) return { ok: true, highRisk, reasons: [] };

  const v = req.verification;
  if (!v) reasons.push("high-risk request requires out-of-band verification before any action");
  else {
    if (req.originChannel === "email" && v.channel === "email") reasons.push("email cannot authorize an email-originated sensitive request — use a second channel");
    if (v.channel === req.originChannel) reasons.push("verification channel must DIFFER from the origin channel (two-channel rule)");
    if (!STRONG_CHANNELS.has(v.channel)) reasons.push(`verification channel "${v.channel}" is not a strong out-of-band channel (phone/video/in-person/passkey)`);
    if (!v.verifierName?.trim() || !v.ts || !v.rationale?.trim() || !v.auditRef?.trim()) reasons.push("verification must record verifier, channel, timestamp, rationale, and audit reference");
  }
  // Urgency never lowers the bar; it RAISES suspicion.
  const ok = reasons.length === 0;
  recordSecurityEvent({
    type: ok ? "HIGHRISK_VERIFIED" : "HIGHRISK_REFUSED",
    severity: ok ? "info" : "high",
    summary: `${req.topic} via ${req.originChannel}${req.urgent ? " (URGENT — treated suspicious)" : ""}: ${ok ? "verified" : "refused"}`,
    detail: { topic: req.topic, urgent: req.urgent, originChannel: req.originChannel, verifier: v?.verifierName ?? null, channel: v?.channel ?? null, auditRef: v?.auditRef ?? null, reasons },
  });
  return { ok, highRisk, reasons };
}
