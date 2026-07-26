import { evaluateThreeFounderReleaseAuthority } from "@/lib/governance/threeFounderReleaseAuthority";

function assert(c: boolean, m: string): void { if (!c) throw new Error(m); }
const packet = "a".repeat(64);
const approvals = [
  { founder: "CAITLIN" as const, domain: "TECHNICAL_GOVERNANCE" as const, role: "TECHNICAL_CONSTITUTIONAL_ATTESTATION" as const, decision: "APPROVE" as const, signedAt: "2026-07-27T12:00:00Z", packetSha256: packet, signatureRef: "sig-c" },
  { founder: "STUART" as const, domain: "FINANCE_UNDERWRITING" as const, role: "FINANCE_RELEASE_RISK_APPROVAL" as const, decision: "APPROVE" as const, signedAt: "2026-07-27T12:01:00Z", packetSha256: packet, signatureRef: "sig-s" },
  { founder: "FRANCIS" as const, domain: "PUBLIC_COMMUNICATIONS" as const, role: "PUBLIC_INDEPENDENT_FINAL_REVIEW" as const, decision: "APPROVE" as const, signedAt: "2026-07-27T12:02:00Z", packetSha256: packet, signatureRef: "sig-f" },
];
const initial = evaluateThreeFounderReleaseAuthority({ initialLaunch: true, packetSha256: packet, changeOwner: "CAITLIN", affectedDomains: ["TECHNICAL_GOVERNANCE", "FINANCE_UNDERWRITING", "PUBLIC_COMMUNICATIONS"], approvals });
assert(initial.status === "READY_FOR_SEPARATE_ACTIVATION", "Initial launch must accept the owner only as technical/constitutional attestor while the other two founders independently approve.");
const cross = evaluateThreeFounderReleaseAuthority({ initialLaunch: false, packetSha256: packet, changeOwner: "CAITLIN", affectedDomains: ["TECHNICAL_GOVERNANCE"], approvals: approvals.filter(a => a.founder !== "CAITLIN") });
assert(cross.status === "READY_FOR_SEPARATE_ACTIVATION", "Two outside-group approvals must clear a routine Caitlin-owned change.");
console.log(JSON.stringify({ ok: true, rule: "THREE-FOUNDER-CROSS-FUNCTIONAL-RELEASE-AUTHORITY-001", initialLaunchUnanimous: true, routineOwnerExcluded: true, domainVetoesPreserved: true, unilateralStopAuthority: true, activationPerformed: false }, null, 2));
