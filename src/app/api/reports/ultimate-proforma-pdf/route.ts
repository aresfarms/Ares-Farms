import { randomUUID } from "node:crypto";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "../../auth/[...nextauth]/route";
import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import {
  composeGovernedUltimateProforma,
  type GovernedUltimateProformaInput,
} from "@/lib/governance/governedUltimateProforma";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { inspectFederalLoanAuthorityBinding } from "@/lib/governance/federalLoanAuthorityMonitor";
import { generateLoanProformaPdf } from "@/lib/pdf/generateLoanProformaPdf";
import { canonicalReportAuthority } from "@/lib/platform/authorities/report";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";

export const runtime = "nodejs";

const MODULE = "api.reports.ultimate-proforma-pdf";
const ROUTE = "/api/reports/ultimate-proforma-pdf";

interface SessionUser {
  id?: string | null;
  email?: string | null;
  role?: string | null;
  tenantId?: string | null;
}

interface RequestBody {
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  proforma?: GovernedUltimateProformaInput["proforma"];
  evidence?: GovernedUltimateProformaInput["evidence"];
}

function safeFilename(value: string): string {
  const normalized = value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${normalized || "furlong-ultimate-proforma"}.pdf`;
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function POST(request: Request) {
  const traceId = `ultimate-proforma-${randomUUID()}`;
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.id && !user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized", traceId }, { status: 401 });
    }

    const actorId = user.id ?? user.email!;
    const tenantId = user.tenantId ?? null;
    const access = evaluateAccess({
      role: user.role,
      allowedRoles: ["operator", "underwriter", "admin", "governance"],
      operation: "ultimate-proforma.prepare",
      module: MODULE,
      traceId,
      actorId,
      tenantId,
    });
    if (!access.allowed) {
      return NextResponse.json({ ok: false, error: "This role cannot prepare an Ultimate Pro Forma.", traceId }, { status: 403 });
    }

    const runtimeGuard = runRuntimeGuard({
      operation: "ultimate-proforma.prepare",
      module: MODULE,
      traceId,
      schemaVersion: "ultimate-proforma-v2.1",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: ROUTE,
        internalPreparationOnly: true,
        officialUseAllowed: false,
        externalDeliveryAllowed: false,
      },
    });
    if (!runtimeGuard.allowed) {
      return NextResponse.json({ ok: false, error: "Runtime governance blocked pro forma preparation.", traceId, runtimeGuard }, { status: 403 });
    }

    const body = (await request.json()) as RequestBody;
    if (!body.applicationId || !body.proforma || !Array.isArray(body.evidence)) {
      return NextResponse.json({ ok: false, error: "applicationId, proforma, and evidence are required.", traceId }, { status: 400 });
    }

    const recordAccess = await evaluateApplicationRecordAccess({
      access,
      operation: "ultimate-proforma.prepare",
      module: MODULE,
      traceId,
      resourceType: "borrower_report",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId ?? tenantId,
      userId: actorId,
    });
    if (!recordAccess.allowed) {
      return NextResponse.json({ ok: false, error: "Application-scoped access was denied.", traceId, recordAccess }, { status: 403 });
    }

    const generatedAt = new Date().toISOString();
    const authorityBinding = inspectFederalLoanAuthorityBinding({
      reviewedAt: body.proforma.authority.reviewedAt,
      officialSourceRefs: body.proforma.authority.officialSourceRefs,
      reviewedContentHashes: body.proforma.authority.reviewedContentHashes,
    });
    if (!authorityBinding.current) {
      return NextResponse.json({
        ok: false,
        error: "Federal loan authority sources changed, failed, or do not match the reviewed content hashes.",
        traceId,
        authorityBinding,
      }, { status: 409 });
    }

    const packet = composeGovernedUltimateProforma({
      proforma: body.proforma,
      evidence: body.evidence,
      humanReviewerId: actorId,
      generatedAt,
    });
    if (packet.status !== "READY_FOR_INTERNAL_REVIEW" || !packet.document) {
      const observability = createObservabilityEvent({
        eventType: "ULTIMATE_PROFORMA_BLOCKED",
        domain: "operations",
        severity: "WARN",
        message: "Ultimate Pro Forma preparation was blocked by governed validation.",
        traceId,
        replayRef: traceId,
        actorId,
        module: MODULE,
        metadata: { blockers: packet.blockers, warningCount: packet.warnings.length },
      });
      await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: ROUTE, blocked: true, packetSha256: packet.packetSha256 },
      });
      return NextResponse.json({ ok: false, error: "Ultimate Pro Forma did not pass its governed generation gate.", traceId, packet }, { status: 422 });
    }

    const pdf = await streamToBuffer(generateLoanProformaPdf(packet.document));
    const classifiedOutput = classifyRecord(
      {
        reportType: "ULTIMATE_PROFORMA",
        applicationId: body.applicationId,
        packetSha256: packet.packetSha256,
        documentModelSha256: packet.documentModelSha256,
        evidenceManifestSha256: packet.evidenceManifestSha256,
        calculationSnapshotSha256: packet.calculationSnapshotSha256,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "borrower",
        classificationSource: "ultimate-proforma-runtime",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-underwriter", "authorized-operator", "governance"],
        sharingPermissions: ["internal-human-review"],
        aiUsagePermissions: ["classify", "explain"],
        exportRestrictions: ["no-external-delivery", "no-official-reliance", "human-review-required"],
        redactionRequirements: ["no-full-sensitive-identifiers"],
        consentRequirements: ["borrower-report-consent-before-external-delivery"],
      },
    );

    const reportRecord = await canonicalReportAuthority.persist({
      traceId,
      reportId: traceId,
      reportType: "ULTIMATE_PROFORMA",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId ?? tenantId,
      actorId,
      reportTitle: `Ultimate Pro Forma — ${body.proforma.manifest.clientLegalName}`,
      advisory: "INTERNAL PREPARATION ARTIFACT — HUMAN REVIEW REQUIRED — NOT A LENDER APPROVAL, ELIGIBILITY DETERMINATION, COMMITMENT, OR OFFICIAL SBA/USDA FORM.",
      requestPayload: {
        applicationId: body.applicationId,
        evidenceItemCount: body.evidence.length,
        lane: body.proforma.manifest.lane,
        documentId: body.proforma.manifest.documentId,
      },
      reportPayload: {
        packetSha256: packet.packetSha256,
        documentModelSha256: packet.documentModelSha256,
        evidenceManifestSha256: packet.evidenceManifestSha256,
        calculationSnapshotSha256: packet.calculationSnapshotSha256,
        pdfByteLength: pdf.length,
      },
      outputSummary: {
        status: packet.status,
        humanReviewRequired: true,
        officialUseAllowed: false,
        externalDeliveryAllowed: false,
        warningCount: packet.warnings.length,
      },
      metadata: {
        access,
        recordAccess,
        classification: classifiedOutput.classification,
        claimsPolicyVersion: packet.claimsPolicyVersion,
        federalAuthoritySnapshotSha256: authorityBinding.snapshotSha256,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "ULTIMATE_PROFORMA_PREPARED",
      domain: "operations",
      severity: "INFO",
      message: "Governed Ultimate Pro Forma prepared for internal human review.",
      traceId,
      replayRef: traceId,
      actorId,
      module: MODULE,
      metadata: {
        reportRecordId: reportRecord.id,
        packetSha256: packet.packetSha256,
        pdfByteLength: pdf.length,
        externalDeliveryAllowed: false,
      },
    });
    await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      classifications: [
        {
          resourceType: "borrower_report",
          resourceId: String(reportRecord.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: { route: ROUTE, reportType: "ULTIMATE_PROFORMA" },
        },
      ],
      metadata: {
        route: ROUTE,
        reportRecordId: reportRecord.id,
        packetSha256: packet.packetSha256,
        internalPreparationOnly: true,
      },
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${safeFilename(body.proforma.manifest.documentId)}"`,
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "x-furlong-report-id": traceId,
        "x-furlong-packet-sha256": packet.packetSha256,
        "x-furlong-external-delivery": "blocked",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown Ultimate Pro Forma error.", traceId },
      { status: 500 },
    );
  }
}
