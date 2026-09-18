/**
 * Goal Coverage Registry (BUILD FIX 2026-06-12) — the documented catalog of
 * goal classes the Navigator routes goal-first, with reality + regulatory
 * classification, availability-source classes, feasibility checks, and the
 * follow-up question each opens. This is the human-readable contract behind
 * navigatorGoalParser + the hand-written goal routes; the verifier asserts the
 * acceptance goals all resolve to a non-intake first response.
 *
 * Reality taxonomy (matches navigatorGoalParser.AssetReality):
 *   ORDINARY · UNUSUAL_BUT_REAL · REGULATED · ICONIC_PRIVATE_ASSET ·
 *   PUBLIC_DISPOSITION_ONLY · NOT_PRIVATELY_OWNABLE · IMPOSSIBLE_SCALE_ASSET ·
 *   FANTASY
 */

import type { AssetReality } from "./navigatorGoalParser";
import type { TurnIntent } from "./turnIntent";

export interface GoalRegistryEntry {
  key: string;
  reality: AssetReality;
  regulatory: "low" | "moderate" | "high" | "restricted";
  /** How such an asset can lawfully become available. */
  availabilitySources: string[];
  feasibilityChecks: string[];
  turnIntent: TurnIntent;
}

export const GOAL_COVERAGE_REGISTRY: GoalRegistryEntry[] = [
  // ── Nontraditional dwellings ───────────────────────────────────────────────
  { key: "sailboat-living", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["broker", "private sale", "marina listings"], feasibilityChecks: ["marina liveaboard rules", "slip availability", "vessel registration", "insurance", "sanitation/pump-out", "coastal regs"], turnIntent: "ROUTE_MARINE_LIVEABOARD" },
  { key: "houseboat-living", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["broker", "private sale"], feasibilityChecks: ["marina rules", "moorage", "registration", "insurance"], turnIntent: "ROUTE_MARINE_LIVEABOARD" },
  { key: "floating-home", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["MLS", "broker"], feasibilityChecks: ["moorage rights", "utilities", "financing", "insurance"], turnIntent: "ROUTE_MARINE_VESSEL_OR_LIVEABOARD" },
  { key: "rv-living", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["dealer", "private sale"], feasibilityChecks: ["local occupancy/zoning", "parking/siting limits", "utilities/septic", "HOA rules"], turnIntent: "ROUTE_NONTRADITIONAL_DWELLING" },
  { key: "van-living", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["dealer", "private sale"], feasibilityChecks: ["land use", "overnight rules", "utilities"], turnIntent: "ROUTE_NONTRADITIONAL_DWELLING" },
  { key: "tiny-home", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["builder", "MLS", "tiny-home community"], feasibilityChecks: ["tiny-home ordinances", "foundation/RVIA", "zoning", "utilities"], turnIntent: "ROUTE_NONTRADITIONAL_DWELLING" },
  { key: "shipping-container", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["builder", "supplier", "MLS"], feasibilityChecks: ["building code acceptance", "permits", "engineering", "zoning"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  { key: "airplane-home", reality: "UNUSUAL_BUT_REAL", regulatory: "high", availabilitySources: ["aircraft salvage", "specialty broker"], feasibilityChecks: ["zoning", "building code", "utility/safety", "permitting"], turnIntent: "ROUTE_VEHICLE_INSPIRED_ARCHITECTURE" },
  { key: "train-car-home", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["rail surplus", "specialty broker"], feasibilityChecks: ["transport/siting", "code", "utilities", "permits"], turnIntent: "ROUTE_VEHICLE_INSPIRED_ARCHITECTURE" },
  { key: "underground-home", reality: "UNUSUAL_BUT_REAL", regulatory: "high", availabilitySources: ["MLS", "builder", "land + build"], feasibilityChecks: ["geotech/engineering", "egress/code", "waterproofing", "permits"], turnIntent: "ROUTE_EARTH_SHELTERED_HOUSING" },
  // ── Specialty / adaptive reuse ─────────────────────────────────────────────
  { key: "missile-silo", reality: "UNUSUAL_BUT_REAL", regulatory: "high", availabilitySources: ["specialty broker", "private sale", "auction"], feasibilityChecks: ["title/survey", "environmental", "access", "utilities", "zoning", "code", "safety", "permitting", "insurance", "financing"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  { key: "bunker", reality: "UNUSUAL_BUT_REAL", regulatory: "high", availabilitySources: ["specialty broker", "surplus", "private sale"], feasibilityChecks: ["environmental", "access", "utilities", "code", "permits"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  { key: "lighthouse", reality: "PUBLIC_DISPOSITION_ONLY", regulatory: "high", availabilitySources: ["GSA surplus", "public auction", "private listing"], feasibilityChecks: ["historic-preservation covenants", "access", "environmental", "code", "insurance"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  { key: "grain-elevator", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["MLS", "private sale", "auction"], feasibilityChecks: ["structural", "environmental", "zoning", "code"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  { key: "water-tower", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["municipal surplus", "private sale"], feasibilityChecks: ["structural", "access", "zoning", "code"], turnIntent: "ROUTE_SPECIALTY_ASSET_ACQUISITION" },
  { key: "adaptive-reuse-building", reality: "UNUSUAL_BUT_REAL", regulatory: "moderate", availabilitySources: ["MLS", "broker", "auction", "redevelopment"], feasibilityChecks: ["change-of-use zoning", "code upgrades", "environmental", "financing"], turnIntent: "ROUTE_ADAPTIVE_REUSE_PROPERTY" },
  // ── Regulated business / institutional ─────────────────────────────────────
  { key: "hospital", reality: "REGULATED", regulatory: "restricted", availabilitySources: ["broker", "operator sale", "closed-facility listing"], feasibilityChecks: ["operating license", "healthcare regulatory approvals", "CON", "payer/revenue risk", "zoning", "building condition"], turnIntent: "ROUTE_HEALTHCARE_REAL_ESTATE" },
  { key: "small-airport", reality: "REGULATED", regulatory: "restricted", availabilitySources: ["broker", "private sale", "public airport sale"], feasibilityChecks: ["FAA/state aviation rules", "runway/easement", "zoning", "environmental", "insurance", "access"], turnIntent: "ROUTE_REGULATED_AIRPORT_ASSET" },
  { key: "kennel-operation", reality: "REGULATED", regulatory: "high", availabilitySources: ["broker", "private sale", "land + build"], feasibilityChecks: ["kennel zoning", "animal limits", "noise", "setbacks", "licensing"], turnIntent: "ROUTE_PET_STRUCTURE" },
  { key: "boarding-facility", reality: "REGULATED", regulatory: "high", availabilitySources: ["broker", "business sale"], feasibilityChecks: ["zoning", "animal/occupancy rules", "licensing", "insurance"], turnIntent: "ROUTE_PET_STRUCTURE" },
  { key: "specialty-agriculture", reality: "ORDINARY", regulatory: "moderate", availabilitySources: ["MLS", "land broker", "auction"], feasibilityChecks: ["zoning", "animal limits", "nutrient/manure mgmt", "water", "setbacks", "biosecurity", "financing"], turnIntent: "ROUTE_AGRICULTURAL_ACQUISITION" },
  // ── Restricted (infrastructure patch is authoritative) ─────────────────────
  { key: "prison", reality: "PUBLIC_DISPOSITION_ONLY", regulatory: "restricted", availabilitySources: ["VERIFIED public surplus/auction/redevelopment ONLY"], feasibilityChecks: ["verified public disposition first", "then high-level reuse only — no ownership/operator/active-status/access detail"], turnIntent: "HARD_SHUTDOWN_SENSITIVE_FACILITY" },
];

export const GOAL_REGISTRY_KEYS = GOAL_COVERAGE_REGISTRY.map((e) => e.key);
