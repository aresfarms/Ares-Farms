import { createHash, randomUUID } from "node:crypto";

export const COMPELLED_DISCLOSURE_CEREMONY_RULE =
  "COMPELLED-DISCLOSURE-DUAL-CONTROL-001" as const;

export type LegalProcessType = "COURT_ORDER" | "SUBPOENA" | "WARRANT" | "AGENCY_DEMAND";
export type NoticePosture = "NOTICE_REQUIRED" | "NOTICE_DELAYED" | "NOTICE_PROHIBITED" | "NOTICE_PENDING_LEGAL_REVIEW";

export type DisclosureCeremony = Readonly<{
  ceremonyId: string;
  processType: LegalProcessType;
  authorityVerificationId: string;
  issuer: string;
  jurisdiction: string;
  matterId: string;
  subjectIds: readonly string[];
  moduleIds: readonly string[];
  recordSelectors: readonly string[];
  holdStartedAt: string;
  disclosureStartsAt: string;
  disclosureEndsAt: string;
  noticePosture: NoticePosture;
  noticeReviewAt: string | null;
  legalApproverId: string;
  securityApproverId: string;
  scopeManifestSha256: string;
  status: "AUTHORIZED";
}>;

function sha(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function authorizeCompelledDisclosure(input: {
  processType: LegalProcessType;
  authorityVerificationId: string;
  authorityVerified: boolean;
  issuer: string;
  jurisdiction: string;
  matterId: string;
  subjectIds: readonly string[];
  moduleIds: readonly string[];
  recordSelectors: readonly string[];
  holdStartedAt: string;
  disclosureStartsAt: string;
  disclosureEndsAt: string;
  noticePosture: NoticePosture;
  noticeReviewAt?: string | null;
  legalApproverId: string;
  securityApproverId: string;
}): DisclosureCeremony {
  if (!input.authorityVerified || !input.authorityVerificationId) throw new Error("Independently verified legal authority is required.");
  if (!input.matterId || input.subjectIds.length === 0 || input.recordSelectors.length === 0) throw new Error("A scope-bound disclosure manifest is required.");
  if (input.legalApproverId === input.securityApproverId) throw new Error("Legal and security approval must be independent.");
  if (Date.parse(input.disclosureEndsAt) <= Date.parse(input.disclosureStartsAt)) throw new Error("Disclosure window is invalid.");
  if (Date.parse(input.holdStartedAt) > Date.parse(input.disclosureStartsAt)) throw new Error("Legal hold must begin before disclosure.");
  if ((input.noticePosture === "NOTICE_DELAYED" || input.noticePosture === "NOTICE_PROHIBITED") && !input.noticeReviewAt) {
    throw new Error("Delayed or prohibited notice requires a scheduled legal review.");
  }
  const manifest = {
    processType: input.processType,
    issuer: input.issuer,
    jurisdiction: input.jurisdiction,
    matterId: input.matterId,
    subjectIds: [...input.subjectIds].sort(),
    moduleIds: [...input.moduleIds].sort(),
    recordSelectors: [...input.recordSelectors].sort(),
    disclosureStartsAt: input.disclosureStartsAt,
    disclosureEndsAt: input.disclosureEndsAt,
  };
  return {
    ceremonyId: randomUUID(),
    processType: input.processType,
    authorityVerificationId: input.authorityVerificationId,
    issuer: input.issuer,
    jurisdiction: input.jurisdiction,
    matterId: input.matterId,
    subjectIds: input.subjectIds,
    moduleIds: input.moduleIds,
    recordSelectors: input.recordSelectors,
    holdStartedAt: input.holdStartedAt,
    disclosureStartsAt: input.disclosureStartsAt,
    disclosureEndsAt: input.disclosureEndsAt,
    noticePosture: input.noticePosture,
    noticeReviewAt: input.noticeReviewAt ?? null,
    legalApproverId: input.legalApproverId,
    securityApproverId: input.securityApproverId,
    scopeManifestSha256: sha(manifest),
    status: "AUTHORIZED",
  };
}

export function selectorPermitted(ceremony: DisclosureCeremony, selector: string, at: string): boolean {
  const time = Date.parse(at);
  return time >= Date.parse(ceremony.disclosureStartsAt) && time <= Date.parse(ceremony.disclosureEndsAt) && ceremony.recordSelectors.includes(selector);
}
