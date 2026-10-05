import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolvePropertyFacts } from "@/lib/property/propertyFactsService";
import { buildAutomatedPropertyReport, renderAutomatedPropertyReport } from "@/lib/reports/automatedPropertyReport";
async function main() {
  const address = process.argv.find(a => a.startsWith("--address="))?.slice(10);
  const output = process.argv.find(a => a.startsWith("--output="))?.slice(9);
  if (!address || !output) throw new Error("Supply --address=<full address> and --output=<review directory>.");
  const facts = await resolvePropertyFacts({ exactAddress: address }, { fresh: true });
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "source-evidence.json"), JSON.stringify(facts, null, 2));
  const report = buildAutomatedPropertyReport({ facts, requestedAddress: address, customerVision: "Evaluate continued agricultural use and a diversified farm plan", generatedAt: new Date() });
  await writeFile(path.join(output, "report-review.json"), JSON.stringify(report, null, 2));
  await writeFile(path.join(output, "property-report-review.pdf"), await renderAutomatedPropertyReport(report.model));
  console.log(JSON.stringify({ ok: true, output, sourceEvidenceDigest: report.evidenceDigest,
    acceptance: "PENDING_CONTENT_AND_CUSTOMER_REVIEW", paymentOpened: false }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
