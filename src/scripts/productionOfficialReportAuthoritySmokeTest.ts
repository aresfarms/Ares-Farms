import { existsSync } from "node:fs";
import path from "node:path";
import { productionOfficialReportAuthorityInventory as inventory, productionOfficialReportAuthorization as authorization, productionOfficialReportAuthorityVersion as version } from "@/lib/governance/productionOfficialReportAuthorityInventory";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function main(): void {
  assert(inventory.length >= 6, "Official report inventory is incomplete.");
  assert(inventory.every((x) => x.advisoryOnlyDisclosureRequired && x.qualifiedReviewerRequired && x.legalComplianceReviewRequired), "Human/legal authority controls are incomplete.");
  assert(inventory.every((x) => x.sourceCitationRequired && x.provenanceRequired && x.dataClassificationRequired && x.redactionRequired), "Citation/provenance/privacy controls are incomplete.");
  assert(inventory.every((x) => x.deterministicRegenerationRequired && x.immutableVersionRequired && x.cryptographicSignatureRequired), "Replay/version/signature controls are incomplete.");
  assert(inventory.every((x) => x.publicationAuthorityRequired && x.claimsPolicyRequired && x.officialRelianceApprovalRequired), "Publication/reliance controls are incomplete.");
  assert(inventory.every((x) => !x.publicationApproved && !x.publicVerificationPermitted && !x.officialReliancePermitted), "Official report capability must default fail-closed.");
  assert(authorization.approvalRequired && !authorization.approvalGranted && !authorization.productionAuthorized, "Human approval boundary was not preserved.");
  assert(existsSync(path.join(process.cwd(), "src/app/api/reports/pdf/route.ts")), "Governed PDF route is missing.");
  assert(existsSync(path.join(process.cwd(), "src/lib/security/reportAttestation.ts")), "Report attestation helper is missing.");
  console.log(JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), version, reportTypes: inventory.length, officialPublicationPermitted: false, message: "Production official report authority inventory passed fail-closed." }, null, 2));
}
main();
