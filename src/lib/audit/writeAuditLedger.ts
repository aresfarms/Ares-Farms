import { writeAuditEvent, type AuditEventInput } from "./writeAuditEvent";

export type AuditLedgerInput = AuditEventInput;

export type AuditLedgerRecord = Awaited<ReturnType<typeof writeAuditEvent>> & {
  auditLedgerId: string;
  table: string;
};

export async function writeAuditLedger(
  inputOrTable: AuditLedgerInput | string = {},
  maybeInput: AuditLedgerInput = {},
): Promise<AuditLedgerRecord> {
  const table =
    typeof inputOrTable === "string" ? inputOrTable : "audit_events";
  const input = typeof inputOrTable === "string" ? maybeInput : inputOrTable;
  const result = await writeAuditEvent({
    ...input,
    metadata: {
      ...(input.metadata ?? {}),
      requestedLedgerSurface: table,
    },
  });

  return {
    ...result,
    auditLedgerId: result.id,
    table: "audit_events",
  };
}
