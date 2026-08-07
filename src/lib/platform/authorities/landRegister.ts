import {
  AUDIT_LEDGER_PATH,
  appendAuditEvent,
  readAuditEvents,
} from "@/lib/property/auditLedger";
import type { AuditEvent } from "@/lib/property/auditLedger";

export type LandRegisterFilter = {
  domain?: string;
  subject?: string;
};

export type LandRegisterAppendInput = Omit<AuditEvent, "ts"> & {
  ts?: string;
};

export type CanonicalLandRegisterAuthority = Readonly<{
  append: (event: LandRegisterAppendInput) => AuditEvent;
  read: (filter?: LandRegisterFilter) => AuditEvent[];
  path: string;
}>;

/** Stable public boundary for the canonical Land Register domain. */
export const canonicalLandRegisterAuthority: CanonicalLandRegisterAuthority = Object.freeze({
  append: (event) => appendAuditEvent(event),
  read: (filter) => readAuditEvents(filter),
  path: AUDIT_LEDGER_PATH,
});

export type { AuditEvent } from "@/lib/property/auditLedger";
