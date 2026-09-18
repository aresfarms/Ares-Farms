import { randomUUID } from "node:crypto";
import { SIGNATURE_EXECUTION_DOCTRINE } from "../doctrine";
import type { SignatureBlockerCode } from "../blockers";
import { signatureCanonicalJson, signatureSha256 } from "../canonical";
import type { SignaturePdfAnalysis } from "./analyzer";

export type SignatureZone = { zoneId: string; signerRole: string; pageIndex: number; x: number; y: number; width: number; height: number; pageRotation: number };
type CertifiedTemplate = { templateId: string; templateVersion: string; certificationRef: string; zones: SignatureZone[] };

export const CERTIFIED_SIGNATURE_TEMPLATES: readonly CertifiedTemplate[] = [
  { templateId: "furlong-generic-instrument", templateVersion: "v1", certificationRef: "template-cert://furlong-generic-instrument/v1", zones: [
    { zoneId: "customer-signature-primary", signerRole: "customer", pageIndex: 0, x: 72, y: 72, width: 250, height: 78, pageRotation: 0 },
  ] },
] as const;

export type SignaturePlacementPlan = {
  id: string; documentSha256: string; profile: "FURLONG_AUTHORED" | "THIRD_PARTY";
  templateId: string | null; templateVersion: string | null; zone: SignatureZone | null;
  marginMarker: { applied: false; reason: string }; appendExecutionPage: boolean;
  collisionFree: boolean; blockerCodes: SignatureBlockerCode[]; collisionReportHash: string; planSha256: string;
  appendedPageTemplateVersion: string | null;
};

export function planSignaturePlacement(input: { analysis: SignaturePdfAnalysis; profile: SignaturePlacementPlan["profile"]; templateId?: string; templateVersion?: string; signerRole: string }): SignaturePlacementPlan {
  const blockers = [...input.analysis.blockerCodes];
  let zone: SignatureZone | null = null;
  let templateId: string | null = null; let templateVersion: string | null = null;
  if (input.profile === "FURLONG_AUTHORED") {
    const template = CERTIFIED_SIGNATURE_TEMPLATES.find((entry) => entry.templateId === input.templateId && entry.templateVersion === input.templateVersion);
    if (!template) blockers.push("SIG_ZONE_MISSING");
    else {
      templateId = template.templateId; templateVersion = template.templateVersion;
      const matches = template.zones.filter((candidate) => candidate.signerRole === input.signerRole);
      if (matches.length === 0) blockers.push("SIG_ZONE_MISSING");
      else if (matches.length > 1) blockers.push("SIG_ZONE_AMBIGUOUS");
      else {
        zone = matches[0]; const page = input.analysis.pages[zone.pageIndex];
        if (!page || page.rotation !== zone.pageRotation || zone.x < 0 || zone.y < 0 || zone.x + zone.width > page.width || zone.y + zone.height > page.height || zone.width < 180 || zone.height < 60) blockers.push("SIG_PLACEMENT_COLLISION");
      }
    }
  }
  const unique = [...new Set(blockers)];
  const stable = { documentSha256: input.analysis.sourceSha256, profile: input.profile, templateId, templateVersion, zone, marginMarker: { applied: false as const, reason: input.profile === "THIRD_PARTY" ? "Safe unused margin cannot be proven from structure alone; omit rather than obscure." : "Authored signature zone is used." }, appendExecutionPage: input.profile === "THIRD_PARTY", collisionFree: unique.length === 0, blockerCodes: unique, appendedPageTemplateVersion: input.profile === "THIRD_PARTY" ? SIGNATURE_EXECUTION_DOCTRINE.appendedPageTemplateVersion : null };
  const collisionReportHash = signatureSha256(signatureCanonicalJson({ zone, pages: input.analysis.pages, blockers: unique }));
  return { id: randomUUID(), ...stable, collisionReportHash, planSha256: signatureSha256(signatureCanonicalJson({ ...stable, collisionReportHash })) };
}
