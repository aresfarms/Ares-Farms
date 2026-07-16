import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/property/auditLedger";
import {
  categoryForType,
  financingPathwayTags,
} from "@/lib/property/propertyCategories";
import {
  PROPERTY_SOURCE_IDS,
  recordsForReview,
} from "@/lib/property/propertyData";
import {
  buildImportedPropertyContext,
} from "@/lib/property/propertyImportIntake";
import { buildPropertyAnalysisHref } from "@/lib/property/propertyAnalysisHref";
import { verifyImportedPropertyAddress } from "@/lib/property/importedPropertyVerification";
import { assessSourceCandidate } from "@/lib/property/sourceCandidateVerification";
import { persistOperatorReviewQueueItem } from "@/lib/queues/operatorReviewQueueStore";
import { validateImageUploadBytes } from "@/lib/security/imageUploadGate";
import { scanUploadedImageForMalware } from "@/lib/security/uploadMalwareScan";
import { isSourceLiveRuntime } from "@/lib/property/sourceActivationStore";
import {
  toExploreDetail,
  type ExploreDetailProperty,
} from "@/lib/property/propertyTypes";
import { sanitizeIngestText } from "@/lib/security/ingestSanitizer";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

type ImportRequest = {
  mode?: "paste" | "image";
  rawInput?: string;
  notes?: string;
  imageDataUrl?: string;
  imageName?: string;
};

type DecodedImagePayload = {
  mediaType: string;
  data: string;
  bytes: Uint8Array;
};

function createTraceId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizedVerifiedAddress(parsed: {
  street: string;
  city: string;
  state: string;
  zip: string;
} | null): string | null {
  if (!parsed) return null;
  return `${parsed.street}, ${parsed.city}, ${parsed.state}${parsed.zip ? ` ${parsed.zip}` : ""}`;
}

function normalizedVerifiedLocation(parsed: {
  street: string;
  city: string;
  state: string;
  zip: string;
} | null): string | null {
  if (!parsed) return null;
  return `${parsed.city}, ${parsed.state}`;
}

function normalizeAddressComparable(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\b(street)\b/g, "st")
    .replace(/\b(avenue)\b/g, "ave")
    .replace(/\b(road)\b/g, "rd")
    .replace(/\b(lane)\b/g, "ln")
    .replace(/\b(drive)\b/g, "dr")
    .replace(/\b(boulevard)\b/g, "blvd")
    .replace(/\b(court)\b/g, "ct")
    .replace(/\b(place)\b/g, "pl")
    .replace(/\b(highway)\b/g, "hwy")
    .replace(/\b(unit|apt|suite|ste)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function sourceLabelFromVerifiedRecord(sourceId: string): string {
  if (sourceId === "hud") return "Verified from HUD Home Store";
  if (sourceId === "usda") return "Verified from USDA resale inventory";
  if (sourceId === "treasury") return "Verified from U.S. Treasury real property inventory";
  if (sourceId === "gsa-realestate") return "Verified from GSA real estate inventory";
  return "Verified from an approved Furlong source";
}

function propertyTypeLabelFromVerifiedRecord(propertyType: string): string {
  const normalized = propertyType.toLowerCase();
  if (normalized === "home" || normalized === "multifamily") return "Residential property";
  if (normalized === "farm" || normalized === "ranch") return "Farm or ranch property";
  if (normalized === "land") return "Land";
  if (normalized === "commercial") return "Commercial property";
  if (normalized === "hospitality") return "Hospitality property";
  if (normalized === "business") return "Business property";
  return "Property candidate";
}

function verifiedPriceLabel(record: ExploreDetailProperty): string {
  const isAuction = record.sourceId === "treasury" || record.sourceId === "gsa-realestate";
  if (record.price && record.price > 0) {
    return isAuction
      ? `Starting bid: $${record.price.toLocaleString("en-US")} · independently verified`
      : `List price: $${record.price.toLocaleString("en-US")} · independently verified`;
  }
  return isAuction ? "Auction · independently verified source" : "Price not yet independently verified";
}

function verifiedCurrentLabel(record: ExploreDetailProperty): string {
  if (record.isCurrent) {
    return record.sourceId === "hud"
      ? "Current verified government listing"
      : "Current verified source listing";
  }
  return "Verified historical source record";
}

function findVerifiedSourceRecord(parsed: {
  street: string;
  city: string;
  state: string;
  zip: string;
} | null): ExploreDetailProperty | null {
  if (!parsed) return null;

  const targetStreet = normalizeAddressComparable(parsed.street);
  const targetCity = normalizeAddressComparable(parsed.city);
  const targetState = parsed.state.toUpperCase();
  const targetZip = parsed.zip.trim();

  let best: ExploreDetailProperty | null = null;
  let bestScore = -1;

  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;

    for (const record of recordsForReview(sourceId)) {
      const detail = toExploreDetail(record);
      if (!detail.exactAddress) continue;

      const streetScore =
        normalizeAddressComparable(detail.exactAddress) === targetStreet ? 3 : 0;
      const cityScore =
        normalizeAddressComparable(detail.town) === targetCity ? 2 : 0;
      const stateScore = detail.state.toUpperCase() === targetState ? 2 : 0;
      const zipScore =
        targetZip && detail.zip && detail.zip.startsWith(targetZip) ? 1 : 0;
      const score = streetScore + cityScore + stateScore + zipScore;

      if (streetScore === 0 || cityScore === 0 || stateScore === 0) continue;

      if (score > bestScore) {
        best = detail;
        bestScore = score;
      }
    }
  }

  return best;
}

function aiEnabled(): boolean {
  return typeof process.env.ANTHROPIC_API_KEY === "string" && process.env.ANTHROPIC_API_KEY.length > 0;
}

function imageParts(dataUrl: string): DecodedImagePayload | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  try {
    const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
    return { mediaType: match[1], data: match[2], bytes };
  } catch {
    return null;
  }
}

async function queueRejectedUploadReview(input: {
  traceId: string;
  imageName?: string | null;
  mediaType?: string | null;
  bytes?: number | null;
  reason: string;
  detail: Record<string, unknown>;
}): Promise<void> {
  try {
    await persistOperatorReviewQueueItem({
      traceId: input.traceId,
      queueType: "HUMAN_REVIEW",
      sourceType: "PUBLIC_UPLOAD_SECURITY_REVIEW",
      sourceId: input.imageName ?? "public-property-upload",
      sourceTraceId: input.traceId,
      actorId: "public-anonymous",
      priority: "HIGH",
      escalationStatus: "ESCALATION_REVIEW_REQUIRED",
      reviewReason:
        "Public property upload was quarantined by the security gate and requires human review before any further handling.",
      requiredRole: "governance",
      metadata: {
        imageName: input.imageName ?? null,
        mediaType: input.mediaType ?? null,
        bytes: input.bytes ?? null,
        reason: input.reason,
        ...input.detail,
      },
    });
  } catch {
    // Best-effort queueing; audit log still preserves the event.
  }
}

async function extractFromImage(input: {
  imageDataUrl: string;
  notes: string;
}): Promise<{
  extractedTitle?: string | null;
  extractedAddress?: string | null;
  extractedLocation?: string | null;
  extractedPropertyType?: string | null;
  extractedPriceLabel?: string | null;
  extractedDescription?: string | null;
  extractedListingUrl?: string | null;
  extractedState?: string | null;
  extractedTown?: string | null;
  extractedCounty?: string | null;
  warnings?: string[];
}> {
  const img = imageParts(input.imageDataUrl);
  if (!img || !aiEnabled()) return { warnings: ["Image extraction was unavailable, so the import fell back to any notes that were provided."] };

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        extractedTitle: { type: "string" },
        extractedAddress: { type: "string" },
        extractedLocation: { type: "string" },
        extractedPropertyType: { type: "string" },
        extractedPriceLabel: { type: "string" },
        extractedDescription: { type: "string" },
        extractedListingUrl: { type: "string" },
        extractedState: { type: "string" },
        extractedTown: { type: "string" },
        extractedCounty: { type: "string" },
        warnings: { type: "array", items: { type: "string" } },
      },
      required: ["warnings"],
    };

    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1200,
      thinking: { type: "adaptive" },
      system:
        "You extract only visible listing facts from a user-supplied property screenshot or photo. " +
        "Do not invent values. If a field is not plainly visible, leave it blank and add a warning. " +
        "This is advisory intake only, not valuation, approval, or eligibility.",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Extract the visible property facts needed to open an advisory property-analysis workspace. " +
              `Use any visitor notes as weak support only: ${input.notes || "(none)"}`,
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: img.mediaType,
              data: img.data,
            },
          },
        ],
      }],
      output_config: { format: { type: "json_schema", schema } },
    } as never);

    const block = (res as { content: Array<{ type: string; text?: string }> }).content.find((entry) => entry.type === "text");
    const parsed = JSON.parse(block?.text ?? "{}") as Record<string, unknown>;
    return {
      extractedTitle: typeof parsed.extractedTitle === "string" ? parsed.extractedTitle : null,
      extractedAddress: typeof parsed.extractedAddress === "string" ? parsed.extractedAddress : null,
      extractedLocation: typeof parsed.extractedLocation === "string" ? parsed.extractedLocation : null,
      extractedPropertyType: typeof parsed.extractedPropertyType === "string" ? parsed.extractedPropertyType : null,
      extractedPriceLabel: typeof parsed.extractedPriceLabel === "string" ? parsed.extractedPriceLabel : null,
      extractedDescription: typeof parsed.extractedDescription === "string" ? parsed.extractedDescription : null,
      extractedListingUrl: typeof parsed.extractedListingUrl === "string" ? parsed.extractedListingUrl : null,
      extractedState: typeof parsed.extractedState === "string" ? parsed.extractedState : null,
      extractedTown: typeof parsed.extractedTown === "string" ? parsed.extractedTown : null,
      extractedCounty: typeof parsed.extractedCounty === "string" ? parsed.extractedCounty : null,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.filter((value): value is string => typeof value === "string") : [],
    };
  } catch {
    return { warnings: ["Image extraction failed and the import fell back to any written notes instead."] };
  }
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<ImportRequest>(req, {
    maxBytes: 18 * 1024 * 1024,
  });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const body = parsed.body;
  const mode = body.mode === "image" ? "image" : "paste";
  const rawInput = sanitizeIngestText(body.rawInput, 1000);
  const notes = sanitizeIngestText(body.notes, 1000);

  if (mode === "paste" && !rawInput && !notes) {
    return NextResponse.json({ ok: false, error: "Paste a listing link, address, or property notes first." }, { status: 400 });
  }

  if (mode === "image" && !body.imageDataUrl && !notes) {
    return NextResponse.json({ ok: false, error: "Upload a property screenshot or add notes first." }, { status: 400 });
  }

  if (mode === "image" && body.imageDataUrl) {
    const uploadTraceId = createTraceId("public-property-upload");
    const decoded = imageParts(body.imageDataUrl);
    if (!decoded) {
      appendAuditEvent({
        actorId: "public-anonymous",
        actorName: "public-anonymous",
        domain: "public-property-import",
        subject: "blocked-image-upload",
        decision: "IMAGE_UPLOAD_REJECTED",
        reason: "Uploaded property image was rejected because the payload was not a valid supported image data URL.",
        detail: {
          mode,
          reason: "invalid-image-data-url",
        },
      });
      await queueRejectedUploadReview({
        traceId: uploadTraceId,
        imageName: body.imageName ?? null,
        reason: "invalid-image-data-url",
        detail: {
          mode,
          gate: "image-data-url",
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "The uploaded file was rejected because it was not a valid supported image payload.",
        },
        { status: 422 }
      );
    }

    const imageGate = validateImageUploadBytes({
      mediaType: decoded.mediaType,
      bytes: decoded.bytes,
    });

    if (!imageGate.ok) {
      appendAuditEvent({
        actorId: "public-anonymous",
        actorName: "public-anonymous",
        domain: "public-property-import",
        subject: "blocked-image-upload",
        decision: "IMAGE_UPLOAD_REJECTED",
        reason:
          "Uploaded property image was rejected by the image safety gate before any extraction or analysis occurred.",
        detail: {
          mode,
          mediaType: imageGate.mediaType,
          bytes: imageGate.bytes,
          error: imageGate.error,
        },
      });
      await queueRejectedUploadReview({
        traceId: uploadTraceId,
        imageName: body.imageName ?? null,
        mediaType: imageGate.mediaType,
        bytes: imageGate.bytes,
        reason: imageGate.error ?? "image-gate-rejection",
        detail: {
          mode,
          gate: "binary-image-validation",
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            imageGate.error ??
            "The uploaded file was rejected by the platform safety gate.",
        },
        { status: 422 }
      );
    }

    const malwareScan = await scanUploadedImageForMalware({
      bytes: decoded.bytes,
      mediaType: decoded.mediaType,
      fileName: body.imageName ?? null,
    });

    if (
      malwareScan.status === "blocked" ||
      (malwareScan.status === "unavailable" && malwareScan.mode === "enforce")
    ) {
      const rejectionReason =
        malwareScan.status === "blocked"
          ? "Uploaded property image was rejected because the external malware scan flagged it as suspicious."
          : "Uploaded property image was rejected because required external malware scanning was unavailable.";

      appendAuditEvent({
        actorId: "public-anonymous",
        actorName: "public-anonymous",
        domain: "public-property-import",
        subject: "blocked-image-upload",
        decision: "IMAGE_UPLOAD_REJECTED",
        reason: rejectionReason,
        detail: {
          mode,
          mediaType: decoded.mediaType,
          bytes: decoded.bytes.byteLength,
          scanMode: malwareScan.mode,
          scanProvider: malwareScan.provider,
          scanStatus: malwareScan.status,
          scanDetail: malwareScan.detail,
          sha256: malwareScan.sha256,
        },
      });
      await queueRejectedUploadReview({
        traceId: uploadTraceId,
        imageName: body.imageName ?? null,
        mediaType: decoded.mediaType,
        bytes: decoded.bytes.byteLength,
        reason: rejectionReason,
        detail: {
          mode,
          gate: "external-malware-scan",
          scanMode: malwareScan.mode,
          scanProvider: malwareScan.provider,
          scanStatus: malwareScan.status,
          scanDetail: malwareScan.detail,
          sha256: malwareScan.sha256,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            malwareScan.status === "blocked"
              ? "The uploaded file was rejected because it failed the platform security scan."
              : "The uploaded file was rejected because required security scanning was unavailable.",
        },
        { status: 422 }
      );
    }
  }

  const extracted = mode === "image" && body.imageDataUrl
    ? await extractFromImage({ imageDataUrl: body.imageDataUrl, notes })
    : {};

  const importInput = {
    mode,
    rawInput,
    notes,
    source: mode === "image" ? "image-upload" : undefined,
    ...extracted,
  } as const;

  const context = buildImportedPropertyContext(importInput);
  if ("blocked" in context) {
    appendAuditEvent({
      actorId: "public-anonymous",
      actorName: "public-anonymous",
      domain: "public-property-import",
      subject: "blocked-import",
      decision: "IMPORT_BLOCKED",
      reason: "Anonymous property import was blocked by restricted-asset or intake-integrity screening.",
      detail: {
        mode,
        warnings: [...context.warnings, ...(extracted.warnings ?? [])],
        reasons: context.reasons,
        imageProvided: Boolean(body.imageDataUrl),
      },
    });
    return NextResponse.json({
      ok: false,
      error: context.error,
      warnings: [...context.warnings, ...(extracted.warnings ?? [])],
      reasons: context.reasons,
    }, { status: 422 });
  }

  const verification = await verifyImportedPropertyAddress({
    propertyId: context.propertyId,
    exactAddress: context.exactAddress,
    location: context.location,
    stateCode: context.stateCode,
    rawInput,
    notes,
  });

  if (verification.status === "blocked") {
    appendAuditEvent({
      actorId: "public-anonymous",
      actorName: "public-anonymous",
      domain: "public-property-import",
      subject: context.propertyId,
      decision: "IMPORT_BLOCKED_BY_LIVE_VERIFICATION",
      reason: "Anonymous property import was blocked by the live address-verification posture gate.",
      detail: {
        mode,
        importScreeningStatus: context.importScreeningStatus,
        importScreeningCategory: context.importScreeningCategory,
        restrictions: verification.restrictions,
        warnings: verification.warnings,
      },
    });

    return NextResponse.json({
      ok: false,
      error:
        verification.restrictions[0] ??
        "This import cannot move forward through the public property flow.",
      warnings: [...context.warnings, ...verification.warnings],
      reasons: verification.restrictions,
    }, { status: 422 });
  }

  const verifiedAddress = normalizedVerifiedAddress(verification.parsedAddress);
  const verifiedLocation = normalizedVerifiedLocation(verification.parsedAddress);
  const verifiedSourceRecord = findVerifiedSourceRecord(verification.parsedAddress);
  const sourceCandidate = assessSourceCandidate({
    rawInput,
    listingUrl: context.listingUrl,
    matchedApprovedSourceRecord: Boolean(verifiedSourceRecord),
  });
  const normalizedContext = {
    ...context,
    propertyId: verifiedSourceRecord?.id ?? context.propertyId,
    title: verifiedSourceRecord?.exactAddress ?? context.title,
    location: verifiedSourceRecord
      ? `${verifiedSourceRecord.town}, ${verifiedSourceRecord.state}`
      : verifiedLocation ?? context.location,
    propertyType: verifiedSourceRecord
      ? propertyTypeLabelFromVerifiedRecord(verifiedSourceRecord.propertyType)
      : context.propertyType,
    sourceLabel: verifiedSourceRecord
      ? sourceLabelFromVerifiedRecord(verifiedSourceRecord.sourceId)
      : context.sourceLabel,
    sourceId: verifiedSourceRecord?.sourceId ?? null,
    priceLabel: verifiedSourceRecord
      ? verifiedPriceLabel(verifiedSourceRecord)
      : "Price not yet independently verified",
    vintage: verifiedSourceRecord?.vintageStamp ?? context.vintage,
    exactAddress: verifiedSourceRecord?.exactAddress ?? verifiedAddress ?? context.exactAddress,
    description: verifiedSourceRecord?.description ?? context.description,
    listingUrl: verifiedSourceRecord?.listingUrl ?? context.listingUrl,
    currentLabel: verifiedSourceRecord
      ? verifiedCurrentLabel(verifiedSourceRecord)
      : context.currentLabel,
    pathwayList: verifiedSourceRecord
      ? financingPathwayTags(
          verifiedSourceRecord.sourceId,
          categoryForType(verifiedSourceRecord.propertyType)
        )
      : context.pathwayList,
    stateCode: verifiedSourceRecord?.state ?? verification.parsedAddress?.state ?? context.stateCode,
    county: verifiedSourceRecord?.county ?? context.county,
    town: verifiedSourceRecord?.town ?? verification.parsedAddress?.city ?? context.town,
    warnings: [...context.warnings, ...verification.warnings],
  };

  const analysisHref = buildPropertyAnalysisHref({
    propertyId: normalizedContext.propertyId,
    title: normalizedContext.title,
    location: normalizedContext.location,
    propertyType: normalizedContext.propertyType,
    priceLabel: normalizedContext.priceLabel,
    vintage: normalizedContext.vintage,
    sourceLabel: normalizedContext.sourceLabel,
    pathways: normalizedContext.pathwayList,
    town: normalizedContext.town,
    county: normalizedContext.county,
    state: normalizedContext.stateCode,
    sourceId: normalizedContext.sourceId,
    listingUrl: normalizedContext.listingUrl,
    exactAddress: normalizedContext.exactAddress,
    description: normalizedContext.description,
    currentLabel: normalizedContext.currentLabel,
    importScreeningStatus: normalizedContext.importScreeningStatus,
    importScreeningCategory: normalizedContext.importScreeningCategory,
    importScreeningSummary: normalizedContext.importScreeningSummary,
    importScreeningReasons: normalizedContext.importScreeningReasons,
    salePosture: normalizedContext.salePosture,
    manualReviewRequired: normalizedContext.manualReviewRequired,
    manualReviewSummary: normalizedContext.manualReviewSummary,
    sourceVerificationStatus: verifiedSourceRecord
      ? "matched-approved-source-record"
      : "verified-address-only",
    matchedSourceRecordId: verifiedSourceRecord?.id ?? null,
    listingSourceCandidate: verifiedSourceRecord ? null : sourceCandidate.candidateLabel,
    listingSourceCandidateStatus: verifiedSourceRecord ? null : sourceCandidate.candidateStatus,
    listingSourceGovernanceStatus: verifiedSourceRecord ? null : sourceCandidate.governanceStatus,
    listingSourceMatchStatus: verifiedSourceRecord ? null : sourceCandidate.matchStatus,
  });
  const importHash = createHash("sha256")
    .update([mode, rawInput, notes, body.imageName ?? "", normalizedContext.propertyId].join("|"))
    .digest("hex")
    .slice(0, 16);

  appendAuditEvent({
    actorId: "public-anonymous",
    actorName: "public-anonymous",
    domain: "public-property-import",
    subject: normalizedContext.propertyId,
    decision: mode === "image" ? "IMAGE_IMPORT_NORMALIZED" : "TEXT_IMPORT_NORMALIZED",
    reason: "Anonymous property import normalized into advisory workspace input.",
    detail: {
      mode,
      importHash,
      importScreeningStatus: normalizedContext.importScreeningStatus,
      importScreeningCategory: normalizedContext.importScreeningCategory,
      salePosture: normalizedContext.salePosture,
      manualReviewRequired: normalizedContext.manualReviewRequired,
      manualReviewSummary: normalizedContext.manualReviewSummary,
      listingUrlPresent: Boolean(normalizedContext.listingUrl),
      exactAddressPresent: Boolean(normalizedContext.exactAddress),
      liveVerificationStatus: verification.status,
      normalizedAddress: verification.normalizedAddress,
      matchedApprovedSourceRecord: verifiedSourceRecord?.id ?? null,
      sourceCandidate: sourceCandidate.candidateLabel,
      sourceCandidateStatus: sourceCandidate.candidateStatus,
      sourceCandidateGovernanceStatus: sourceCandidate.governanceStatus,
      sourceCandidateMatchStatus: sourceCandidate.matchStatus,
      warnings: [...normalizedContext.warnings, ...(extracted.warnings ?? [])],
      imageProvided: Boolean(body.imageDataUrl),
    },
  });

  return NextResponse.json({
    ok: true,
    analysisHref,
    context: normalizedContext,
    warnings: [...normalizedContext.warnings, ...(extracted.warnings ?? [])],
  });
}
