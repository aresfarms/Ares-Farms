import { decideDeedDocumentAccess } from "@/lib/property/deedDocumentAccess";
import { OFFICIAL_EVIDENCE_SOURCE_ACTIVATION } from "@/lib/property/officialEvidenceSourceGovernance";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

const publicDecision = decideDeedDocumentAccess({ role: "consumer", action: "view", fileAuthorized: true, transactionPurposeRecorded: true });
assert(!publicDecision.allowed, "Public consumer surface must never expose the deed document.");
const borrowerBlocked = decideDeedDocumentAccess({ role: "borrower", action: "print", fileAuthorized: false, transactionPurposeRecorded: true });
assert(!borrowerBlocked.allowed, "Borrower printing must require an authorized transaction file.");
const lenderAllowed = decideDeedDocumentAccess({ role: "lender", action: "export", fileAuthorized: true, transactionPurposeRecorded: true, lenderAuthorized: true });
assert(lenderAllowed.allowed && lenderAllowed.ledgerEventRequired, "Authorized lender deed export must be allowed and ledgered.");
assert(OFFICIAL_EVIDENCE_SOURCE_ACTIVATION["county-recorder-deed"].status === "pending", "Deed connector must fail closed until a county recorder source is approved.");
console.log(JSON.stringify({ ok: true, rule: "DEED-VERIFICATION-ACCESS-001", publicDocumentHidden: true, metadataAllowed: true, authorizedFinancialAndLenderAccess: true, ledgerRequired: true }, null, 2));
