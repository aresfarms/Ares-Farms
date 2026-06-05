/**
 * Map Asset Ingestion Runtime — Build 47
 * Volume III §Map Asset Governance · Doctrine: AUTHORITATIVE_MAP_ASSET_INGESTION_V1
 *
 * Runtime guard and hash/version utilities for the map asset ingestion system.
 * All functions in this file run at ingestion time (server/script), never in the browser.
 */

import { createHash } from "node:crypto";

export const MAP_ASSET_INGESTION_RUNTIME_VERSION = "1.0.0";
export const REPLAY_REF_PREFIX = "MAP_ASSET_INGESTION";

export type MapAssetMetadata = {
  source_name: string;
  source_url: string;
  source_authority_tier: string;
  source_version_or_year: string;
  fetched_at: string;
  content_hash: string;
  license_or_public_domain_note: string;
  simplification_level: string;
  replay_ref: string;
  generated_by: string;
  generated_at: string;
  assets: Record<string, AssetRecord>;
};

export type AssetRecord = {
  filename: string;
  content_hash: string;
  feature_count: number;
  source_name: string;
  source_url: string;
  source_authority_tier: string;
  license_or_public_domain_note: string;
  fetched_at: string;
};

export function computeContentHash(content: string | Buffer): string {
  return createHash("sha256")
    .update(typeof content === "string" ? content : content)
    .digest("hex");
}

export function buildReplayRef(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${REPLAY_REF_PREFIX}_${ts}`;
}

export function runtimeGuard(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "mapAssetIngestionRuntime must not be imported in browser context. " +
        "This module runs only at ingestion time."
    );
  }
}

export function assertGeoJSONFeatureCollection(
  data: unknown,
  context: string
): asserts data is { type: "FeatureCollection"; features: unknown[] } {
  if (
    typeof data !== "object" ||
    data === null ||
    (data as Record<string, unknown>).type !== "FeatureCollection" ||
    !Array.isArray((data as Record<string, unknown>).features)
  ) {
    throw new Error(
      `[mapAssetIngestionRuntime] Invalid GeoJSON FeatureCollection at: ${context}`
    );
  }
}

export function assertMinimumFeatureCount(
  features: unknown[],
  minimum: number,
  context: string
): void {
  if (features.length < minimum) {
    throw new Error(
      `[mapAssetIngestionRuntime] Feature count ${features.length} below minimum ${minimum} for: ${context}`
    );
  }
}

export function assertNonEmptyGeometry(
  feature: unknown,
  context: string
): void {
  const f = feature as Record<string, unknown>;
  if (
    !f.geometry ||
    typeof f.geometry !== "object" ||
    !(f.geometry as Record<string, unknown>).type
  ) {
    throw new Error(
      `[mapAssetIngestionRuntime] Feature has null or missing geometry at: ${context}`
    );
  }
}
