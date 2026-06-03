import { getTrace } from '../audit/auditLedger';

export async function loadReplay(traceId: string) {
  const events = await getTrace(traceId);

  return {
    traceId,
    eventCount: events.length,
    timeline: events
  };
}
