import { createHash } from "node:crypto";

export const INSTITUTIONAL_ABAC_DISCLOSURE_RULE =
  "INSTITUTIONAL-ABAC-FIELD-DISCLOSURE-001" as const;

export type InstitutionalLane = "attorney" | "auditor" | "government_official";
export type DataField = Readonly<{
  name: string;
  value: unknown;
  classification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  subjectId: string;
  moduleId: string;
  purposes: readonly string[];
}>;

export type AbacRequest = Readonly<{
  principalId: string;
  principalEmail: string;
  role: InstitutionalLane;
  credentialVerificationId: string;
  authorityVerificationId: string;
  matterId: string;
  tenantId: string | null;
  subjectIds: readonly string[];
  moduleIds: readonly string[];
  purpose: string;
  action: "VIEW" | "VERIFY" | "EXPORT";
  windowStart: string;
  windowEnd: string;
  now: string;
  stepUpAuthenticated: boolean;
}>;

export type AbacDecision = Readonly<{
  allowed: boolean;
  reasonCodes: readonly string[];
  disclosed: readonly DataField[];
  withheld: readonly Readonly<{ name: string; reason: string }>[];
  capabilityToken: string | null;
  expiresAt: string | null;
}>;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function capability(input: AbacRequest, fieldNames: readonly string[]): string {
  return `cap_${createHash("sha256")
    .update(stable({
      principalId: input.principalId,
      role: input.role,
      matterId: input.matterId,
      purpose: input.purpose,
      action: input.action,
      fieldNames,
      now: input.now,
    }))
    .digest("hex")}`;
}

export function evaluateInstitutionalAbac(input: {
  request: AbacRequest;
  fields: readonly DataField[];
  credentialValid: boolean;
  authorityValid: boolean;
}): AbacDecision {
  const reasons: string[] = [];
  const request = input.request;
  const now = Date.parse(request.now);
  if (!input.credentialValid) reasons.push("CREDENTIAL_NOT_VERIFIED");
  if (!input.authorityValid) reasons.push("MATTER_AUTHORITY_NOT_VERIFIED");
  if (!request.credentialVerificationId) reasons.push("CREDENTIAL_RECEIPT_MISSING");
  if (!request.authorityVerificationId) reasons.push("AUTHORITY_RECEIPT_MISSING");
  if (!request.matterId) reasons.push("MATTER_SCOPE_MISSING");
  if (now < Date.parse(request.windowStart) || now > Date.parse(request.windowEnd)) {
    reasons.push("ACCESS_WINDOW_CLOSED");
  }
  if (request.action === "EXPORT" && !request.stepUpAuthenticated) {
    reasons.push("STEP_UP_AUTH_REQUIRED");
  }
  if (reasons.length > 0) {
    return { allowed: false, reasonCodes: reasons, disclosed: [], withheld: input.fields.map((field) => ({ name: field.name, reason: reasons[0] })), capabilityToken: null, expiresAt: null };
  }

  const disclosed: DataField[] = [];
  const withheld: Array<{ name: string; reason: string }> = [];
  for (const field of input.fields) {
    if (!request.subjectIds.includes(field.subjectId)) {
      withheld.push({ name: field.name, reason: "SUBJECT_OUTSIDE_AUTHORITY" });
      continue;
    }
    if (!request.moduleIds.includes(field.moduleId)) {
      withheld.push({ name: field.name, reason: "MODULE_OUTSIDE_AUTHORITY" });
      continue;
    }
    if (!field.purposes.includes(request.purpose)) {
      withheld.push({ name: field.name, reason: "PURPOSE_NOT_PERMITTED" });
      continue;
    }
    if (request.role === "government_official" && field.classification === "RESTRICTED") {
      withheld.push({ name: field.name, reason: "MINIMUM_NECESSARY_REDACTION" });
      continue;
    }
    if (request.role === "auditor" && field.name.toLowerCase().includes("ssn")) {
      withheld.push({ name: field.name, reason: "PERSONAL_IDENTIFIER_REDACTED" });
      continue;
    }
    disclosed.push(field);
  }

  const expiresAt = new Date(Math.min(Date.parse(request.windowEnd), now + 5 * 60_000)).toISOString();
  return {
    allowed: true,
    reasonCodes: ["ABAC_SCOPE_MATCH"],
    disclosed,
    withheld,
    capabilityToken: capability(request, disclosed.map((field) => field.name)),
    expiresAt,
  };
}
