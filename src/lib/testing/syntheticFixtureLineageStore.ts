import { and, eq } from "drizzle-orm";

import { syntheticFixtureLineageRecords } from "@/db/schema";
import { db } from "@/lib/db";
import {
  bindSyntheticFixtureLineage,
  type SyntheticFixtureContext,
} from "@/lib/testing/syntheticFixtureLineage";

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "RESTRICTED";

export async function persistSyntheticFixtureLineage(input: {
  context: SyntheticFixtureContext;
  recordType: string;
  recordId: string;
  traceId: string;
  source: string;
}) {
  const lineage = bindSyntheticFixtureLineage(
    input.context,
    input.recordType,
    input.recordId,
  );
  const [row] = await db
    .insert(syntheticFixtureLineageRecords)
    .values({
      syntheticPersonaId: lineage.syntheticPersonaId,
      humanVisibleName: lineage.humanVisibleName,
      testRunId: lineage.testRunId,
      fixtureVersion: lineage.fixtureVersion,
      registryVersion: lineage.registryVersion,
      lineageVersion: lineage.lineageVersion,
      environment: lineage.environment,
      operatorIdentity: lineage.operatorIdentity,
      fixtureCreatedAt: new Date(lineage.createdAt),
      scenarioId: lineage.scenarioId,
      providerTargets: [...lineage.providerTargets],
      recordType: lineage.recordType,
      recordId: lineage.recordId,
      lineageSha256: lineage.lineageSha256,
      lineagePayload: lineage,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: input.source,
    })
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

export async function syntheticFixtureLineageForRecord(
  recordType: string,
  recordId: string,
) {
  const rows = await db
    .select()
    .from(syntheticFixtureLineageRecords)
    .where(
      and(
        eq(syntheticFixtureLineageRecords.recordType, recordType),
        eq(syntheticFixtureLineageRecords.recordId, recordId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
