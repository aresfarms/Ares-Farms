/**
 * Listing lifecycle store — SERVER-ONLY (fs). SOURCE-INTELLIGENCE unit.
 *
 * The unit-owned data store for Furlong-originated direct listings (broker +
 * bank/REO). Lister contact PII lives HERE — Furlong core never imports this
 * module. Runtime store is git-ignored (data/direct-listings.json); production
 * would back this with the unit's own database/credentials.
 *
 * Lifecycle (each stage writes an APPEND-ONLY audit event — CONST-DATA-001; the
 * JSON file holds current state, the NDJSON ledger is the immutable log):
 *   registerLister → submitListing (PENDING; FHA scan recorded; owner/FSBO
 *   rejected at the type level) → recordProvenanceCheck (broker owner-of-record;
 *   mismatch → SHELVED_PENDING_PROVENANCE) → operator decision
 *   (listingSourceActivationStore; APPROVE refused unless counsel-cleared) →
 *   renderableListings (listingRenderGate; default false).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { appendAuditEvent } from "@/lib/property/auditLedger";
import { buildLicenseVerification, licensePublicLine } from "./licenseVerification";
import { sanitizeIngestText } from "@/lib/security/ingestSanitizer";
import { fairHousingScan } from "./fairHousingGuard";
import { getListingState } from "./listingSourceActivationStore";
import { listingRenderEligibility } from "./listingRenderGate";
import {
  type ListerContactPII,
  type ListerCredential,
  type ListerType,
  type Listing,
  venueDisclaimer,
} from "./listingTypes";

const STORE_PATH = path.join(process.cwd(), "data", "direct-listings.json");
const DOMAIN = "listing-source-review";

interface StoreShape {
  listers: Record<string, { credential: ListerCredential; contact: ListerContactPII; displayName: string; registeredAt: string }>;
  listings: Record<string, Listing>;
}

function readStore(): StoreShape {
  try {
    const o = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    return { listers: o.listers ?? {}, listings: o.listings ?? {} };
  } catch {
    return { listers: {}, listings: {} };
  }
}
function writeStore(s: StoreShape): void {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2) + "\n", "utf8");
}

const VALID_TYPES: ListerType[] = ["broker", "bank-reo"];

/** Stage 1 — onboarding. Identity verification is OPERATOR-RECORDED (Module 10
 *  pattern); there is no live external license-lookup API wired (that would be a
 *  new governed source). The credential records what was verified, by whom. */
export function registerLister(input: {
  listerId: string;
  displayName: string;
  credential: ListerCredential;
  contact: ListerContactPII;
  actorId: string;
  actorName: string;
}): void {
  if (!VALID_TYPES.includes(input.credential.listerType)) {
    throw new Error(`Refused: lister type "${input.credential.listerType}" is not supported (owner/FSBO is a NO-GO).`);
  }
  const s = readStore();
  s.listers[input.listerId] = {
    credential: input.credential,
    contact: input.contact,
    displayName: input.displayName,
    registeredAt: new Date().toISOString(),
  };
  writeStore(s);
  appendAuditEvent({
    actorId: input.actorId, actorName: input.actorName, domain: DOMAIN,
    subject: `lister:${input.listerId}`, decision: "LISTER_REGISTERED",
    reason: `${input.credential.listerType} onboarding`,
    detail: { listerType: input.credential.listerType, identityVerified: input.credential.identityVerified, credentialState: input.credential.credentialState },
  });
}

/** Stage 2 — submission intake. Lands PENDING; FHA scan runs and is recorded.
 *  No buyer PII is collected anywhere in this flow. */
export function submitListing(input: {
  listingId: string;
  listerId: string;
  propertyType: string;
  state: string;
  town: string;
  priceLabelInput: number | null;
  description: string;
  photoRefs: string[];
  listingKind?: "sale" | "auction";
  auctionDate?: string | null; // required for auctions; hard-expires past this date
  actorId: string;
  actorName: string;
}): Listing {
  const s = readStore();
  const lister = s.listers[input.listerId];
  if (!lister) throw new Error(`Unknown lister "${input.listerId}" — onboarding required before submission.`);

  const fh = fairHousingScan(`${input.description} ${lister.displayName}`);
  const listing: Listing = {
    listingId: input.listingId,
    listerId: input.listerId,
    listerType: lister.credential.listerType,
    listerDisplayName: lister.displayName,
    credential: lister.credential,
    propertyType: input.propertyType,
    state: input.state.toUpperCase(),
    town: input.town,
    priceLabelInput: input.priceLabelInput,
    description: input.description,
    photoRefs: input.photoRefs,
    status: "PENDING_HUMAN_APPROVAL",
    fairHousingClear: fh.clear,
    listingKind: input.listingKind ?? "sale",
    auctionDate: input.auctionDate ?? null,
    lastConfirmedAt: new Date().toISOString(), // submission counts as confirmation
    submittedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  };
  s.listings[listing.listingId] = listing;
  writeStore(s);
  appendAuditEvent({
    actorId: input.actorId, actorName: input.actorName, domain: DOMAIN,
    subject: listing.listingId, decision: "SUBMITTED",
    reason: `direct listing submitted (${listing.listerType})`,
    detail: { state: listing.state, propertyType: listing.propertyType, fairHousingClear: fh.clear, fairHousingFindings: fh.findings.length },
  });
  return listing;
}

/** Record a license verification result onto the lister's credential (and all
 *  their listings' embedded credentials). Operator path today; a machine adapter
 *  (Module 22/23-gated "state-re-license" source) would call this too. */
export function recordLicenseVerification(input: {
  listerId: string;
  licenseStatus: import("./listingTypes").LicenseStatus;
  licenseNumber: string;
  licenseExpiration: string | null;
  verificationSource: string;
  actorId: string;
  actorName: string;
  now?: Date;
}): void {
  const s = readStore();
  const lister = s.listers[input.listerId];
  if (!lister) throw new Error(`Unknown lister "${input.listerId}".`);
  // buildLicenseVerification validates + writes the append-only ledger event.
  const fields = buildLicenseVerification({ ...input });
  lister.credential = { ...lister.credential, ...fields };
  for (const l of Object.values(s.listings)) {
    if (l.listerId === input.listerId) l.credential = { ...l.credential, ...fields };
  }
  writeStore(s);
}

/** Stage 3 — provenance / owner-of-record verification (brokers). A failed
 *  match shelves the listing PENDING-provenance — it can never render.
 *  PART 3 (human-review standard): flipping ownerOfRecordMatch to TRUE requires
 *  a recorded evidence reference (listing agreement naming the broker with the
 *  owner of record matching the property, or equivalent) — refused without it,
 *  so the anti-poaching gate cannot erode into a rubber-stamp. */
export function recordProvenanceCheck(input: {
  listingId: string;
  ownerOfRecordMatch: boolean | null; // null = not machine-verifiable (agreement + human review)
  evidence: string;
  actorId: string;
  actorName: string;
}): Listing {
  if (input.ownerOfRecordMatch === true && !input.evidence.trim()) {
    throw new Error(
      "Refused: ownerOfRecordMatch can be set TRUE only with a recorded evidence reference (listing agreement / owner-of-record documentation).",
    );
  }
  const s = readStore();
  const l = s.listings[input.listingId];
  if (!l) throw new Error(`Unknown listing "${input.listingId}".`);
  l.credential = { ...l.credential, ownerOfRecordMatch: input.ownerOfRecordMatch };
  if (l.listerType === "broker" && input.ownerOfRecordMatch === false) {
    l.status = "SHELVED_PENDING_PROVENANCE";
  }
  writeStore(s);
  appendAuditEvent({
    actorId: input.actorId, actorName: input.actorName, domain: DOMAIN,
    subject: input.listingId, decision: "PROVENANCE_CHECK",
    reason: input.evidence,
    detail: { ownerOfRecordMatch: input.ownerOfRecordMatch, statusNow: l.status },
  });
  return l;
}

export function getListing(listingId: string): Listing | null {
  const l = readStore().listings[listingId] ?? null;
  if (!l) return null;
  // Store-level TERMINAL statuses (suspension/expiry/shelving — written by the
  // freshness job or provenance check) take precedence over an earlier operator
  // APPROVE in the overlay: a suspended/expired listing stays off even if it was
  // once approved. Otherwise the operator overlay decides.
  if (l.status === "SUSPENDED" || l.status === "EXPIRED" || l.status === "SHELVED_PENDING_PROVENANCE") {
    return { ...l };
  }
  const eff = getListingState(listingId, l.status);
  return { ...l, status: (eff.status as Listing["status"]) ?? l.status, reviewedBy: eff.reviewedBy, reviewedAt: eff.reviewedAt };
}

/** Lister/operator re-confirms a listing is still active (weekly freshness input). */
export function confirmListingActive(input: { listingId: string; actorId: string; actorName: string }): void {
  const s = readStore();
  const l = s.listings[input.listingId];
  if (!l) throw new Error(`Unknown listing "${input.listingId}".`);
  l.lastConfirmedAt = new Date().toISOString();
  writeStore(s);
  appendAuditEvent({
    actorId: input.actorId, actorName: input.actorName, domain: DOMAIN,
    subject: input.listingId, decision: "RECONFIRMED", reason: "listing re-confirmed active",
    detail: { lastConfirmedAt: l.lastConfirmedAt },
  });
}

/** INTERNAL (freshness job): set a store-level terminal status with a ledger event. */
export function setListingStatusInternal(input: {
  listingId: string;
  status: "SUSPENDED" | "EXPIRED";
  reason: string;
  actorId: string;
  actorName: string;
}): void {
  const s = readStore();
  const l = s.listings[input.listingId];
  if (!l) return;
  l.status = input.status;
  writeStore(s);
  appendAuditEvent({
    actorId: input.actorId, actorName: input.actorName, domain: DOMAIN,
    subject: input.listingId, decision: input.status, reason: input.reason,
    detail: { statusNow: input.status },
  });
}

/** All registered listers (for the freshness job's license re-checks). */
export function allListers(): Array<{ listerId: string; displayName: string; credential: import("./listingTypes").ListerCredential }> {
  const s = readStore();
  return Object.entries(s.listers).map(([listerId, v]) => ({ listerId, displayName: v.displayName, credential: v.credential }));
}

export function allListings(): Listing[] {
  return Object.keys(readStore().listings).map((id) => getListing(id)!).filter(Boolean);
}

/** PUBLIC-SAFE renderable projection — what surfaces may show. PII is NEVER in
 *  this shape; photos only with display rights; gate must fully clear. */
export interface RenderableDirectListing {
  listingId: string;
  listerType: ListerType;
  listerDisplayName: string;
  propertyType: string;
  state: string;
  town: string;
  price: number | null;
  description: string;
  photoRefs: string[]; // rights-gated
  venueDisclaimer: string;
  asOf: string; // submission date — feeds the honest price label
  /** "licensed broker · license #N, verified <date>" — present ONLY after a
   *  render-valid verification (never an unverified "licensed" claim). */
  licenseLine: string | null;
  /** Public freshness notice (Caitlin's call): updated weekly + as-of. */
  freshnessNotice: string;
  /** Auction listings show their date and hard-expire past it. */
  auctionDate: string | null;
}

export function renderableListings(filter?: { state?: string | null }): RenderableDirectListing[] {
  const out: RenderableDirectListing[] = [];
  for (const l of allListings()) {
    if (filter?.state && l.state !== filter.state.toUpperCase()) continue;
    const elig = listingRenderEligibility(l);
    if (!elig.canRender) continue;
    const confirmedAsOf = (l.lastConfirmedAt ?? l.submittedAt).slice(0, 10);
    out.push({
      listingId: l.listingId,
      listerType: l.listerType,
      listerDisplayName: l.listerDisplayName,
      propertyType: l.propertyType,
      state: l.state,
      town: l.town,
      price: l.priceLabelInput,
      description: sanitizeIngestText(l.description), // control H: sanitized before render
      photoRefs: elig.renderablePhotoRefs,
      venueDisclaimer: venueDisclaimer(l.listerDisplayName, l.listerType),
      asOf: confirmedAsOf,
      licenseLine: licensePublicLine(l.credential),
      freshnessNotice: `Direct listings updated weekly · as of ${confirmedAsOf}`,
      auctionDate: l.listingKind === "auction" ? (l.auctionDate ?? null) : null,
    });
  }
  return out;
}
