import {
  appendAuditEvent,
  readAuditEvents,
} from "@/lib/property/auditLedger";

/** Stable public boundary for the canonical Land Register domain. */
export const canonicalLandRegisterAuthority = Object.freeze({
  append: appendAuditEvent,
  read: readAuditEvents,
});
