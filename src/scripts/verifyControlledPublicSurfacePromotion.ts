import fs from "node:fs";

import {
  buildPublicSurfaceGatewayPayload,
  publicGatewayPayloadIsRedacted,
} from "@/lib/dto/public";
import {
  buildPublicSourceIntelligencePayload,
  publicSourceIntelligencePayloadIsRedacted,
  type PublicSourceIntelligenceKind,
} from "@/lib/dto/publicSourceIntelligence";
import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";

export const CONTROLLED_PUBLIC_SURFACE_PROMOTION_RULE =
  "CONTROLLED-PUBLIC-SURFACE-PROMOTION-001" as const;

const kinds: PublicSourceIntelligenceKind[] = [
  "grants",
  "property-discovery",
  "equipment",
  "market-context",
  "weather-risk",
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const gateway = buildPublicSurfaceGatewayPayload();
assert(publicGatewayPayloadIsRedacted(gateway), "Gateway payload must be redacted.");

const payloads = kinds.map(buildPublicSourceIntelligencePayload);
const first = JSON.stringify(payloads);
const second = JSON.stringify(kinds.map(buildPublicSourceIntelligencePayload));
assert(first === second, "Public aliases and payloads must be deterministic.");

for (const payload of payloads) {
  assert(publicSourceIntelligencePayloadIsRedacted(payload), `${payload.kind} payload failed redaction.`);
  assert(payload.controls.publicDtoOnly, `${payload.kind} must be DTO-only.`);
  assert(payload.controls.claimsGovernance, `${payload.kind} must use claims governance.`);
  assert(payload.controls.humanReviewRequired, `${payload.kind} must retain human review.`);
  assert(payload.controls.productionBlocked, `${payload.kind} must not grant public-action authority.`);
  assert(!("sourceDocuments" in payload), `${payload.kind} exposes source document names.`);

  for (const item of payload.items) {
    assert(/^item-[a-f0-9]{16}$/.test(item.id), `${payload.kind} exposes a non-public item identifier.`);
    assert(item.sourceAliases.every((alias) => /^source-[a-f0-9]{16}$/.test(alias)), `${payload.kind} exposes an internal source identifier.`);
    assert(!("sourceRefs" in item), `${payload.kind} exposes sourceRefs.`);
    assert(!("replayRefs" in item), `${payload.kind} exposes replayRefs.`);
    assert(Number.isInteger(item.provenance.sourceCount) && item.provenance.sourceCount >= 0, `${payload.kind} has invalid public provenance count.`);
  }

  const claims = evaluateContentClaims({
    text: [
      ...payload.statusMessages,
      ...payload.disclosures,
      ...payload.blockedClaims,
      ...payload.items.flatMap((item) => [item.title, item.category, item.reviewStatus, item.authorityPosture]),
    ],
    context: {
      publicVerificationGatewayOperational: false,
      canonicalHashVerificationOperational: false,
      officialDecisionAuthority: false,
    },
  });
  assert(claims.ok, `${payload.kind} failed public claims governance.`);
}

const dtoSource = fs.readFileSync("src/lib/dto/publicSourceIntelligence.ts", "utf8");
const apiSource = fs.readFileSync("src/lib/source-stack/publicSourceIntelligenceApi.ts", "utf8");
const gatewaySource = fs.readFileSync("src/app/api/public/surfaces/route.ts", "utf8");
for (const source of [apiSource, gatewaySource]) {
  assert(source.includes('classification: "PUBLIC"'), "Public governance envelope must declare PUBLIC classification.");
  assert(source.includes("productionRelianceAllowed: false"), "Public governance envelope must deny production reliance.");
}
assert(!dtoSource.includes("sourceDocuments: string[]"), "Public DTO schema exposes source-document names.");
assert(dtoSource.includes("sourceAliases: string[]"), "Public DTO schema lacks stable public source aliases.");

console.log(JSON.stringify({
  ok: true,
  rule: CONTROLLED_PUBLIC_SURFACE_PROMOTION_RULE,
  surfaceCount: gateway.surfaces.length,
  sourceSurfaceCount: payloads.length,
  deterministicAliases: true,
  internalProvenanceIdentifiersWithheld: true,
  internalRuntimeEvidenceWithheld: true,
  claimsGovernancePassed: true,
  liveActionAuthorityGranted: false,
}, null, 2));
