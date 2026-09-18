import { clearOfficialEvidenceConnectorRegistry, registerOfficialEvidenceConnector, resolveApprovedOfficialEvidenceConnector } from "@/lib/property/officialEvidenceConnectorRegistry";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
clearOfficialEvidenceConnectorRegistry();
registerOfficialEvidenceConnector({ connectorId: "county-tax-v1", sourceId: "parcel-tax-authority", sourceName: "County parcel tax API", officialAuthority: "Example County Treasurer", legalBasis: "Official public tax roll published under county law", geographicScope: ["Example County, MD"], parserVersion: "1.0.0", sourceUrl: "https://example.gov/tax", registeredAt: "2026-07-24T23:00:00Z", status: "pending" }, async () => []);
assert(resolveApprovedOfficialEvidenceConnector("parcel-tax-authority") === null, "Pending connector must not execute.");
registerOfficialEvidenceConnector({ connectorId: "county-tax-v1", sourceId: "parcel-tax-authority", sourceName: "County parcel tax API", officialAuthority: "Example County Treasurer", legalBasis: "Official public tax roll published under county law", geographicScope: ["Example County, MD"], parserVersion: "1.0.0", sourceUrl: "https://example.gov/tax", registeredAt: "2026-07-24T23:00:00Z", status: "approved", reviewedBy: "reviewer-1", reviewedAt: "2026-07-24T23:15:00Z", reviewReason: "Authority and parser reviewed" }, async () => []);
const approved = resolveApprovedOfficialEvidenceConnector("parcel-tax-authority");
assert(approved?.registration.connectorId === "county-tax-v1", "Approved connector must resolve.");
let failed = false;
try { registerOfficialEvidenceConnector({ connectorId: "bad", sourceId: "well-permit-authority", sourceName: "Bad", officialAuthority: "", legalBasis: "", geographicScope: [], parserVersion: "", sourceUrl: "", registeredAt: "", status: "approved" }, async () => []); } catch { failed = true; }
assert(failed, "Incomplete approved connector registration must fail closed.");
console.log(JSON.stringify({ ok: true, rule: "OFFICIAL-EVIDENCE-CONNECTOR-REGISTRY-001", approved: approved.registration, invalidRejected: failed }, null, 2));
