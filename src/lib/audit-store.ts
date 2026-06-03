const AUDIT_LOG: any[] = [];

export function writeAudit(event: any) {
  AUDIT_LOG.push({
    timestamp: new Date().toISOString(),
    ...event,
  });
}

export function getAudit() {
  return AUDIT_LOG;
}
