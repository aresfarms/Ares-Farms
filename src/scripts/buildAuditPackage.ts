import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { listAuditLedgerAdminRecords } from "@/lib/ledger/auditLedgerAdminStore";
function arg(name: string) {
  const p = `--${name}=`;
  return process.argv.find((v) => v.startsWith(p))?.slice(p.length) ?? null;
}
function sha(v: string) {
  return createHash("sha256").update(v).digest("hex");
}
async function main() {
  const anonymousId = arg("anonymous-id"),
    actorRef = arg("actor-ref"),
    traceId = arg("trace-id"),
    moduleId = arg("module-id");
  if (!anonymousId && !actorRef && !traceId && !moduleId)
    throw new Error(
      "Provide --anonymous-id, --actor-ref, --trace-id, or --module-id.",
    );
  const out = path.resolve(arg("output-dir") ?? "artifacts/audit");
  await mkdir(out, { recursive: true });
  const records = await listAuditLedgerAdminRecords({
    anonymousId,
    actorRef,
    traceId,
    moduleId,
    limit: 250,
    includeCanonicalLedger: true,
    includeCanonicalMeta: true,
    includeReplay: true,
    includeObservability: true,
  });
  const packageId = randomUUID(),
    generatedAt = new Date().toISOString();
  const timeline = [
    ...records.auditEvents.map((r) => ({
      store: "audit_events",
      timestamp: r.createdAt,
      record: r,
    })),
    ...records.canonicalLedgerRows.map((r) => ({
      store: "canonical_ledger",
      timestamp: r.createdAt,
      record: r,
    })),
    ...records.replayRows.map((r) => ({
      store: "replay_verification",
      timestamp: r.createdAt,
      record: r,
    })),
    ...records.observabilityRows.map((r) => ({
      store: "observability_events",
      timestamp: r.createdAt,
      record: r,
    })),
  ].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  const summary = {
    packageId,
    generatedAt,
    classification: "RESTRICTED",
    query: { anonymousId, actorRef, traceId, moduleId },
    counts: {
      auditEvents: records.auditEvents.length,
      canonical: records.canonicalLedgerRows.length,
      replay: records.replayRows.length,
      observability: records.observabilityRows.length,
      total: timeline.length,
    },
    redactionPolicy: "audit-export-v1",
    schemaVersion: "audit-package-v1",
  };
  const files: Record<string, string> = {
    "summary.json": JSON.stringify(summary, null, 2) + "\n",
    "timeline.json": JSON.stringify(timeline, null, 2) + "\n",
    "events.ndjson": timeline.map((v) => JSON.stringify(v)).join("\n") + "\n",
  };
  for (const [n, c] of Object.entries(files))
    await writeFile(path.join(out, n), c, { mode: 0o600 });
  const manifest = {
    ...summary,
    files: Object.fromEntries(
      Object.entries(files).map(([n, c]) => [
        n,
        { bytes: Buffer.byteLength(c), sha256: sha(c) },
      ]),
    ),
  };
  const manifestText = JSON.stringify(manifest, null, 2) + "\n";
  await writeFile(path.join(out, "manifest.json"), manifestText, {
    mode: 0o600,
  });
  await writeFile(
    path.join(out, "manifest.sha256"),
    `${sha(manifestText)}  manifest.json\n`,
    { mode: 0o600 },
  );
  console.log(JSON.stringify({ ok: true, out, manifest }, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
