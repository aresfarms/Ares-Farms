import Link from "next/link";

import { PlaceFirstDiscovery } from "@/components/discovery/PlaceFirstDiscovery";
import { Disclosures } from "@/components/public/Disclosures";
import { PlaceFactBadge } from "@/components/place-facts/PlaceFactBadge";
import { ozBadgeProps } from "@/lib/place-facts/opportunityZoneBadge";
import { hubzoneBadgeProps } from "@/lib/place-facts/hubzoneBadge";
import { designatedOzForProperty } from "@/lib/property/propertyOpportunityZones";
import { designatedHubzoneForProperty } from "@/lib/property/propertyHubzones";
import { sfhaForProperty, historicForProperty } from "@/lib/property/propertyFloodHistoric";
import { nmtcForProperty } from "@/lib/property/propertyNmtc";
import { GuidedIntake } from "@/components/property/GuidedIntake";
import { guidedIntakeFeed } from "@/lib/property/guidedIntakeFeed";
import { SavedTray } from "@/components/property/SavedTray";
import { PropertySaveControls } from "@/components/property/PropertySaveControls";
import { PropertyBriefLauncher } from "@/components/property/PropertyBriefLauncher";
import { ProgramMatches } from "@/components/property/ProgramMatches";
import {
  buildCategoryTree,
  listExploreDetail,
  propertySourceStatuses,
} from "@/lib/property/propertyData";
import {
  categoryById,
  categoryForType,
  financingPathwayTags,
  type PropertyCategoryId,
} from "@/lib/property/propertyCategories";
import { CHART_THEMES } from "@/lib/property/chartThemes";
import { renderableListings } from "@/lib/source-intelligence/listing-intake/listingStore";
import { STATE_NAMES } from "@/lib/property/stateNames";
import type { PropertySourceId } from "@/lib/property/propertyTypes";

/**
 * Property hub (Explore → property-land lane) — SERVER component, no account.
 *
 * Organized CATEGORY → STATE → listings (never a flat dump). Renders only
 * categories and states that actually have LIVE inventory, with counts at every
 * level; empty categories/states never render. Government listings come from
 * every LIVE source — current HUD (FHA) homes for sale + historical USDA
 * examples — with full detail + exact address + listing link (the ONE place
 * exact address is allowed; never on the homepage map, and NEVER coordinates).
 * Until a source's Module 22/23 are APPROVED it shows a "pending activation"
 * state, not listings.
 *
 * Framing (guardrail #1): "may fit a pathway" / illustrative — never
 * "qualified / approved / eligible / guaranteed" for the buyer. Opening a
 * property offers an advisory Property → Finance handoff (navigation only — no
 * personal data leaves Furlong; the provider's own intake handles any data).
 */

// Chart Table tokens — the hub is themed by CHART_THEMES.buyer (navigator).
const navigatorTheme = CHART_THEMES.buyer;
const muted = { color: "#b7ccd9", lineHeight: 1.6 } as const;

/**
 * Honest price label. The feed's listed/asking price — NOT Furlong's valuation,
 * NOT a final/sale price, NOT a guarantee (government REO prices get reduced and
 * many go to bid). "Price on request" only when the feed genuinely has no price.
 * Auction sources (Treasury/GSA, later) will pass a different prefix.
 */
const AUCTION_SOURCES = new Set(["treasury", "gsa-realestate"]);
function priceLabel(price: number | null, sourceId?: string): string {
  const isAuction = !!sourceId && AUCTION_SOURCES.has(sourceId);
  if (price && price > 0) {
    return isAuction
      ? `Starting bid: $${price.toLocaleString("en-US")} · subject to change`
      : `List price: $${price.toLocaleString("en-US")} · subject to change`;
  }
  if (isAuction) return "Auction · bid at the listing";
  return "Price on request";
}
function locationLine(town: string, county: string, state: string): string {
  const hasCounty = county && county !== "Unknown";
  return hasCounty ? `${town}, ${county} County, ${state}` : `${town}, ${state}`;
}
function stateName(abbr: string): string {
  return STATE_NAMES[abbr.toUpperCase()] ?? abbr;
}

export function PropertyHub({
  state,
  category,
}: {
  state?: string | null;
  type?: string | null;
  category?: string | null;
}) {
  const tree = propertyTree();
  const sources = propertySourceStatuses();

  // Resolve the selected category only if it actually has live inventory.
  const liveCategory = category
    ? tree.categories.find((c) => c.id === category) ?? null
    : null;
  const selectedAbbr = liveCategory && state
    ? liveCategory.states.find((s) => s.abbr === state.toUpperCase())?.abbr ?? null
    : null;

  return (
    <main>
      <div style={lightContainer}>
        <Header sources={sources} />

        {tree.anyLive && <SavedTray />}

        {!tree.anyLive ? (
          <PendingState sources={sources} total={tree.total} />
        ) : !liveCategory ? (
          <>
            <EntryChoiceIntro />
            <GuidedIntake feed={guidedIntakeFeed()} />
            <CategoryGrid tree={tree} />
          </>
        ) : !selectedAbbr ? (
          <StateList category={liveCategory} />
        ) : (
          <Listings categoryId={liveCategory.id} categoryLabel={liveCategory.label} abbr={selectedAbbr} />
        )}

        <Link href="/explore" style={backLink}>
          ← Back to the compass
        </Link>
        <Disclosures variant="full" tone="dark" />
      </div>
    </main>
  );
}

// Category tree = government inventory + renderable DIRECT listings merged in.
// This is what lets broker/bank listings light up categories the government
// snapshots never fill (Hospitality, Businesses, Farms): a category with only
// direct inventory still gets its grid tile, state list, and listing view.
// renderableListings is fully gated — empty until human approvals clear.
function propertyTree() {
  const tree = buildCategoryTree();
  const direct = renderableListings();
  if (direct.length === 0) return tree;
  const byCat = new Map<PropertyCategoryId, Map<string, number>>();
  for (const d of direct) {
    const cat = categoryForType(d.propertyType);
    const m = byCat.get(cat) ?? new Map<string, number>();
    m.set(d.state, (m.get(d.state) ?? 0) + 1);
    byCat.set(cat, m);
  }
  for (const [cat, states] of byCat) {
    let node = tree.categories.find((c) => c.id === cat);
    if (!node) {
      node = { id: cat, label: categoryById(cat)?.label ?? cat, count: 0, states: [] };
      tree.categories.push(node);
    }
    for (const [abbr, n] of states) {
      const s = node.states.find((x) => x.abbr === abbr);
      if (s) s.count += n;
      else node.states.push({ abbr, count: n });
      node.count += n;
      tree.liveTotal += n;
    }
    node.states.sort((a, b) => a.abbr.localeCompare(b.abbr));
  }
  return tree;
}

function EntryChoiceIntro() {
  return (
    <section
      aria-label="Start property analysis by address"
      style={{
        border: `1px solid ${navigatorTheme.waypointBorder}`,
        borderRadius: 16,
        background: navigatorTheme.waypointBg,
        padding: "22px 24px",
        display: "grid",
        gap: 18,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#d4b06a" }}>
          Start with the verified address
        </span>
        <strong style={{ fontSize: 20, color: "#eaf3f7" }}>Check a specific address</strong>
        <span style={{ fontSize: 14, color: "#b7ccd9", lineHeight: 1.5 }}>
          Results appear right below — the checked facts carry into the analysis automatically.
        </span>
      </div>
      <PlaceFirstDiscovery flow="property-discovery" embedded tone="dark" />
    </section>
  );
}

// ── Header (always rendered — carries the "may fit" + both-source framing) ────
function Header({ sources }: { sources: ReturnType<typeof propertySourceStatuses> }) {
  return (
    <header style={{ display: "grid", gap: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#7fc4b8", textTransform: "uppercase", letterSpacing: 0.4 }}>
        Property &amp; land — no account needed
      </span>
      <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.12 }}>
        Government property listings
      </h1>
      <p style={{ margin: 0, fontSize: 17, ...muted, maxWidth: 680 }}>
        Real listings from federal housing programs — current <strong>HUD (FHA) homes for sale</strong>{" "}
        and historical <strong>USDA Rural Development examples</strong>. Program criteria shown on a
        listing are <strong>verified property-side facts</strong>, never assumptions. Furlong is advisory
        only — we don&apos;t lend, approve, or determine eligibility. Pathways, not promises.
      </p>
      <p style={{ margin: 0, fontSize: 13, color: "#7ea4bb" }}>
        {sources.map((s) => `${s.sourceName}: ${s.live ? "live" : "pending review"} (${s.total.toLocaleString("en-US")})`).join(" · ")} · public-domain open data
      </p>
    </header>
  );
}

// ── Pending activation (no source live) ───────────────────────────────────────
function PendingState({
  sources, total,
}: {
  sources: ReturnType<typeof propertySourceStatuses>;
  total: number;
}) {
  return (
    <section
      aria-label="Sources pending activation"
      style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 14, padding: "24px 28px", display: "grid", gap: 12 }}
    >
      <strong style={{ fontSize: 18, color: "#9a3412" }}>Sources pending activation review</strong>
      <p style={{ margin: 0, ...muted }}>
        {total.toLocaleString("en-US")} government property records have been ingested from official open
        datasets. None are displayed yet: each source must clear Furlong&apos;s legal &amp; licensing
        review (Module 23) and live activation review (Module 22) before any listing is shown.
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
        {sources.map((s) => (
          <li key={s.sourceId} style={{ ...muted, fontSize: 14 }}>
            <strong>{s.sourceName}</strong> — {s.total.toLocaleString("en-US")} records · Module 23:{" "}
            {s.module23} · Module 22: {s.module22}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Level 1: category grid (only non-empty categories) ────────────────────────
function CategoryGrid({ tree }: { tree: ReturnType<typeof buildCategoryTree> }) {
  return (
    <section id="browse-by-category" aria-label="Browse by category" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#eaf3f7" }}>Browse by category</h2>
        <span style={{ fontSize: 14, color: "#b7ccd9" }}>
          {tree.liveTotal.toLocaleString("en-US")} listings across {tree.categories.length}{" "}
          {tree.categories.length === 1 ? "category" : "categories"}
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {tree.categories.map((c) => (
          <li key={c.id}>
            <Link href={catHref(c.id)} style={cardLink}>
              <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontSize: 17, color: "#eaf3f7" }}>{c.label}</strong>
                <span style={countPill}>{c.count.toLocaleString("en-US")}</span>
              </span>
              <span style={{ fontSize: 13, color: "#b7ccd9" }}>
                {c.states.length} {c.states.length === 1 ? "state" : "states"} with inventory →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Level 2: states within a category (only non-empty states) ─────────────────
function StateList({ category }: { category: ReturnType<typeof buildCategoryTree>["categories"][number] }) {
  return (
    <section aria-label={`${category.label} — states with inventory`} style={{ display: "grid", gap: 14 }}>
      <Breadcrumb categoryLabel={category.label} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#eaf3f7" }}>{category.label}</h2>
        <span style={{ fontSize: 14, color: "#b7ccd9" }}>
          {category.count.toLocaleString("en-US")} listings in {category.states.length}{" "}
          {category.states.length === 1 ? "state" : "states"}
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {category.states.map((s) => (
          <li key={s.abbr}>
            <Link href={stateHref(category.id, s.abbr)} style={{ ...cardLink, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 15, color: "#eaf3f7" }}>{stateName(s.abbr)}</strong>
              <span style={countPill}>{s.count.toLocaleString("en-US")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Level 3: the listings for category + state ────────────────────────────────
function Listings({
  categoryId, categoryLabel, abbr,
}: {
  categoryId: PropertyCategoryId;
  categoryLabel: string;
  abbr: string;
}) {
  const { listings } = listExploreDetail({ state: abbr, category: categoryId });
  // B10 reconciliation: the list deliberately includes HISTORICAL examples
  // (labeled per-card); the counts map counts CURRENT only. Show both numbers
  // so the list and the map visibly reconcile (current here == map cell).
  const currentCount = listings.filter((l) => l.isCurrent).length;
  // Furlong-originated DIRECT listings (broker / bank-REO) for this state +
  // category. Fully gated: renderableListings returns ONLY listings that cleared
  // operator approval + counsel-cleared state + fair-housing + identity +
  // accountable-party checks. Empty until those human gates clear.
  const direct = renderableListings({ state: abbr }).filter(
    (d) => categoryForType(d.propertyType) === categoryId,
  );
  return (
    <section aria-label={`${categoryLabel} in ${stateName(abbr)}`} style={{ display: "grid", gap: 14 }}>
      <Breadcrumb categoryLabel={categoryLabel} categoryId={categoryId} stateAbbr={abbr} />
      <p style={{ margin: 0, fontSize: 14, color: "#b7ccd9" }}>
        {(listings.length + direct.length).toLocaleString("en-US")} {listings.length + direct.length === 1 ? "property" : "properties"} ·{" "}
        {categoryLabel} in {stateName(abbr)} —{" "}
        <strong>{(currentCount + direct.length).toLocaleString("en-US")} current</strong>
        {listings.length - currentCount > 0
          ? ` · ${(listings.length - currentCount).toLocaleString("en-US")} historical examples`
          : ""}{" "}
        (the inventory map counts current only).
      </p>

      {direct.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
          {direct.map((d) => (
            <li key={d.listingId} style={{ border: "1px solid #c7b3e6", borderRadius: 12, background: "#fdfcff", padding: "18px 20px", display: "grid", gap: 8 }}>
              <PropertyBriefLauncher
                property={{
                  id: d.listingId,
                  title: `${d.town}, ${stateName(d.state)}`,
                  location: `${d.town}, ${stateName(d.state)}`,
                  town: d.town,
                  state: d.state,
                  propertyType: d.propertyType,
                  priceLabel: d.price && d.price > 0 ? `List price: $${d.price.toLocaleString("en-US")} · as of ${d.asOf}` : "Price on request",
                  vintageStamp: d.freshnessNotice,
                  sourceLabel: d.listerType === "broker" ? "Direct broker listing" : "Direct institutional / REO listing",
                  description: d.description,
                  pathways: categoryId === "businesses" ? ["SBA"] : ["Conventional"],
                  categoryLabel,
                  currentLabel: "Current direct listing",
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between" }}>
                <strong style={{ fontSize: 17, color: "#eaf3f7" }}>{d.town}, {stateName(d.state)}</strong>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#b7ccd9" }}>
                  {d.price && d.price > 0 ? `List price: $${d.price.toLocaleString("en-US")} · as of ${d.asOf} · subject to change` : "Price on request"}
                </span>
              </div>
              <span style={{ alignSelf: "start", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 8px", color: "#6d28d9", background: "#f3eefc", border: "1px solid #c7b3e6" }}>
                {/* "licensed" appears ONLY via the verified licenseLine — never as an
                    unverified claim. Bank/REO shows institutional framing. */}
                Listed by {d.listerDisplayName}
                {d.licenseLine ? ` · ${d.licenseLine}` : d.listerType === "bank-reo" ? " · bank / lender (REO)" : ""}
              </span>
              {d.auctionDate && (
                <span style={{ alignSelf: "start", fontSize: 11, fontWeight: 700, color: "#9a3412" }}>
                  Auction: {d.auctionDate} · bid at the listing — no list price
                </span>
              )}
              <p style={{ margin: 0, fontSize: 14, ...muted }}>{d.description}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#7ea4bb" }}>{d.venueDisclaimer}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#7ea4bb" }}>{d.freshnessNotice}</p>
              <DirectFinanceBridge categoryId={categoryId} />
            </li>
          ))}
        </ul>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
        {listings.map((p) => (
          <li key={p.id} style={{ border: `1px solid ${navigatorTheme.waypointBorder}`, borderRadius: 12, background: navigatorTheme.cellBg, padding: "18px 20px", display: "grid", gap: 8 }}>
            <PropertyBriefLauncher
              property={{
                id: p.id,
                title: locationLine(p.town, p.county, p.state),
                location: locationLine(p.town, p.county, p.state),
                town: p.town,
                county: p.county,
                state: p.state,
                propertyType: p.propertyType,
                priceLabel: priceLabel(p.price, p.sourceId),
                vintageStamp: p.vintageStamp,
                sourceLabel:
                  p.sourceId === "hud"
                    ? "HUD Home Store"
                    : p.sourceId === "treasury"
                      ? "U.S. Treasury auctions"
                    : p.sourceId === "gsa-realestate"
                        ? "GSA realestatesales.gov"
                        : "USDA resales portal",
                sourceId: p.sourceId,
                listingUrl: p.listingUrl,
                exactAddress: p.exactAddress,
                description: p.description,
                sourceCitation: p.sourceCitation,
                pathways: financingPathwayTags(p.sourceId, categoryId),
                categoryLabel,
                currentLabel: p.isCurrent ? "Current for-sale listing" : `${p.vintageStamp} · verify current availability`,
              }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 17, color: "#eaf3f7" }}>
                {locationLine(p.town, p.county, p.state)}
              </strong>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#b7ccd9" }}>
                {priceLabel(p.price, p.sourceId)}
              </span>
            </div>
            <span style={{
              alignSelf: "start", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 8px",
              ...(p.isCurrent
                ? { color: "#0f6e56", background: "#e1f5ee", border: "1px solid #5bbd9e" }
                : { color: "#9a3412", background: "#fff7ed", border: "1px solid #fdba74" }),
            }}>
              {/* Currency is computed live from the freshness anchor (listing date,
                  else snapshot date). When a snapshot ages past the window it
                  auto-flips to historical — never asserts "current" over stale data. */}
              {p.isCurrent
                ? "Current for-sale listing"
                : `${p.vintageStamp} — historical · verify current availability`}
            </span>
            {p.asOf && (
              <div style={{ fontSize: 11, color: "#7ea4bb" }}>
                as of {new Date(p.asOf).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                {p.isCurrent ? " (source snapshot)" : ""}
              </div>
            )}
            {p.exactAddress && (
              <div style={{ fontSize: 14, color: "#eaf3f7" }}>{p.exactAddress}{p.zip ? `, ${p.state} ${p.zip}` : ""}</div>
            )}

            {/* Place-fact attribute (6 / OZ): coarse tract-level government fact —
                rendered ONLY when this property's tract is a designated Opportunity
                Zone. Frozen public-domain snapshot; live fetch stays Module 22/23
                gated. Absent when not designated (no "not in an OZ" noise). */}
            <OpportunityZoneBadge propertyId={p.id} />
            <HubzoneBadge propertyId={p.id} />
            <FloodFactBadge propertyId={p.id} />
            <HistoricFactBadge propertyId={p.id} />
            <NmtcFactBadge propertyId={p.id} />

            <div style={{ fontSize: 14, ...muted }}>
              {[
                p.propertyType,
                p.bedrooms ? `${p.bedrooms} bd` : null,
                p.squareFeet ? `${p.squareFeet.toLocaleString("en-US")} sq ft` : null,
                p.yearBuilt ? `built ${p.yearBuilt}` : null,
                p.acreageText ? p.acreageText : null,
              ].filter(Boolean).join(" · ")}
            </div>
            {/* pathwayRationale removed (2026-06-10 verified-only directive):
                "FHA financing may apply to eligible buyers…" was an illustrative
                program hedge. Programs now render ONLY as verified facts via
                ProgramMatchesWithPlaceFacts below. */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", alignItems: "center" }}>
              <a href={p.listingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 700, color: "#7fc4b8", textDecoration: "underline" }}>
                {p.sourceId === "hud" ? "View on HUD Home Store ↗" : p.sourceId === "treasury" ? "View on Treasury auctions ↗" : p.sourceId === "gsa-realestate" ? "View on GSA realestatesales.gov ↗" : "View on USDA resales portal ↗"}
              </a>
              <span style={{ fontSize: 12, color: "#7ea4bb" }}>{p.sourceCitation} · {p.vintageStamp}</span>
            </div>

            {/* Save (in-session, no account, no PII) — the property's own public
                fields only; nothing about the visitor is stored. */}
            <PropertySaveControls
              property={{
                id: p.id,
                town: p.town,
                county: p.county,
                state: p.state,
                propertyType: p.propertyType,
                priceLabel: priceLabel(p.price, p.sourceId),
                exactAddress: p.exactAddress,
                zip: p.zip,
                sourceId: p.sourceId,
                sourceCitation: p.sourceCitation,
                isCurrent: p.isCurrent,
                vintageStamp: p.vintageStamp,
                listingUrl: p.listingUrl,
                pathways: financingPathwayTags(p.sourceId, categoryId),
              }}
            />

            {/* Property → program matching (4c) — property-driven, illustrative,
                cited, on the capital-graph taxonomy. Reached by HTTP contract. */}
            {/* Verified-only zone determination (2026-06-10 directive): the OZ
                program renders ONLY when the snapshot says this property's tract
                is designated; otherwise it is omitted entirely — never an
                "only if your tract qualifies" conditional. */}
            <ProgramMatchesWithPlaceFacts property={p} />

            {/* Property → Finance bridge — navigation handoff only (no personal
                data leaves Furlong). The provider's own secure intake handles
                any data. Advisory framing: "may fit" — never qualified/approved. */}
            <FinanceBridge sourceId={p.sourceId} categoryId={categoryId} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Opportunity Zone place-fact badge (6 / OZ) ────────────────────────────────
// Server helper: reads the frozen public-domain OZ snapshot for this property.
// Renders the reusable PlaceFactBadge ONLY when the tract is designated; renders
// nothing otherwise (absence is fine on a listing). Coarse tract geography only.
function OpportunityZoneBadge({ propertyId }: { propertyId: string }) {
  const oz = designatedOzForProperty(propertyId);
  if (!oz) return null;
  return <PlaceFactBadge {...ozBadgeProps(oz)} />;
}

// ── Program matches with the verified place-fact determination ────────────────
// Server helper: reads the frozen OZ snapshot ONCE and hands the verified tract
// (or null) to the client matcher call. Null → the matcher omits the OZ program
// entirely (not designated / geocode-uncertain both read as "no zone item").
function ProgramMatchesWithPlaceFacts({
  property,
}: {
  property: { id: string; propertyType: string; state: string; sourceId: PropertySourceId };
}) {
  const oz = designatedOzForProperty(property.id);
  const hz = designatedHubzoneForProperty(property.id);
  return (
    <ProgramMatches
      propertyType={property.propertyType}
      state={property.state}
      sourceId={property.sourceId}
      propertyId={property.id}
      verifiedOzTractId={oz?.tractId ?? null}
      ozAsOf={oz?.asOf ?? null}
      hubzone={
        hz
          ? { hubzoneType: hz.hubzoneType, geoid: hz.geoid, effective: hz.effective, expiration: hz.expiration, isCurrent: hz.isCurrent }
          : null
      }
      hubzoneAsOf={hz?.asOf ?? null}
    />
  );
}

// ── HUBZone place-fact badge ──────────────────────────────────────────────────
// Reuses the SAME PlaceFactBadge. Renders only when the property is in a HUBZone;
// carries effective date + "verify current designation"; an expired (time-limited)
// designation reads "historical · verify". Coarse tract/county geography only.
function HubzoneBadge({ propertyId }: { propertyId: string }) {
  const hz = designatedHubzoneForProperty(propertyId);
  if (!hz) return null;
  return (
    <PlaceFactBadge
      {...hubzoneBadgeProps({
        hubzoneType: hz.hubzoneType,
        effective: hz.effective,
        expiration: hz.expiration,
        isCurrent: hz.isCurrent,
        geoid: hz.geoid,
      })}
    />
  );
}

// ── FEMA flood place-fact (INFORMATIONAL — never a program/benefit claim) ─────
// Renders only for Special Flood Hazard Areas; minimal-hazard zones are omitted.
function FloodFactBadge({ propertyId }: { propertyId: string }) {
  const f = sfhaForProperty(propertyId);
  if (!f) return null;
  return (
    <PlaceFactBadge
      label={`FEMA Special Flood Hazard Area (Zone ${f.floodZone})`}
      asOf={f.asOf}
      tone="historical"
      disclaimer={
        "An informational place-fact from FEMA's National Flood Hazard Layer: this location falls in a " +
        "mapped Special Flood Hazard Area. Flood insurance and lender requirements are determined by your " +
        "lender and insurer — verify the current map with FEMA."
      }
      sourceCitation="Source: FEMA National Flood Hazard Layer · public domain · msc.fema.gov"
    />
  );
}

// ── National Register place-fact (rehab-credit property-side gate) ────────────
function HistoricFactBadge({ propertyId }: { propertyId: string }) {
  const h = historicForProperty(propertyId);
  if (!h) return null;
  return (
    <PlaceFactBadge
      label={`In a National Register historic area${h.historicName ? ` — ${h.historicName}` : ""}`}
      asOf={h.asOf}
      disclaimer={
        "This location falls within a National Register of Historic Places listed area (36 CFR §60) — the " +
        "property-side gate of the federal historic rehabilitation tax credit. This is a place-fact about the " +
        "location — not eligibility or a guaranteed credit for any person; credit approval runs through NPS/SHPO."
      }
      sourceCitation="Source: NPS National Register of Historic Places · public domain"
    />
  );
}

// ── NMTC low-income-community place-fact (verified tract match) ───────────────
function NmtcFactBadge({ propertyId }: { propertyId: string }) {
  const n = nmtcForProperty(propertyId);
  if (!n) return null;
  return (
    <PlaceFactBadge
      label={`In an NMTC-qualified low-income community — tract ${n.tractId}`}
      asOf={n.asOf}
      disclaimer={
        "This location's census tract qualifies as a low-income community under the New Markets Tax " +
        "Credit program (IRC §45D; CDFI Fund 2016–2020 ACS data) — the property-side gate. This is a " +
        "place-fact about the location — not eligibility or a guaranteed credit for any person or " +
        "investment; NMTC financing runs through a certified CDE with allocation."
      }
      sourceCitation="Source: CDFI Fund / U.S. Treasury NMTC eligibility (2016–2020 ACS) · public domain"
    />
  );
}

// ── Direct-listing → Finance handoff (category-driven; navigation only) ───────
// Honest pathway tags for direct listings: never source-specific claims (a
// broker listing is not HUD/FHA inventory). Businesses → SBA; else Conventional.
function DirectFinanceBridge({ categoryId }: { categoryId: PropertyCategoryId }) {
  const tags = categoryId === "businesses" ? ["SBA"] : ["Conventional"];
  const href = `/explore?lane=financing-capital&from=property&pathways=${encodeURIComponent(tags.join(","))}`;
  return (
    <div style={{ marginTop: 4, paddingTop: 12, borderTop: "1px dashed #d7deea", display: "grid", gap: 6 }}>
      <p style={{ margin: 0, fontSize: 13, ...muted }}>
        Providers can help you explore <strong>{tags.join(" / ")} financing</strong> for a property like this.
      </p>
      <Link
        href={href}
        style={{
          justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 14, fontWeight: 700, color: "#ffffff", background: "#0f766e",
          borderRadius: 999, padding: "8px 16px", textDecoration: "none",
        }}
      >
        Explore financing for a property like this →
      </Link>
    </div>
  );
}

// ── Property → Finance handoff ────────────────────────────────────────────────
function FinanceBridge({ sourceId, categoryId }: { sourceId: PropertySourceId; categoryId: PropertyCategoryId }) {
  const tags = financingPathwayTags(sourceId, categoryId);
  const href = `/explore?lane=financing-capital&from=property&pathways=${encodeURIComponent(tags.join(","))}`;
  return (
    <div style={{ marginTop: 4, paddingTop: 12, borderTop: "1px dashed #d7deea", display: "grid", gap: 6 }}>
      <p style={{ margin: 0, fontSize: 13, ...muted }}>
        Providers can help you explore <strong>{tags.join(" / ")} financing</strong> for a property like this.
      </p>
      <Link
        href={href}
        style={{
          justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 14, fontWeight: 700, color: "#ffffff", background: "#0f766e",
          borderRadius: 999, padding: "8px 16px", textDecoration: "none",
        }}
      >
        Explore financing for a property like this →
      </Link>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({
  categoryLabel, categoryId, stateAbbr,
}: {
  categoryLabel: string;
  categoryId?: PropertyCategoryId;
  stateAbbr?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 13 }}>
      <Link href={allHref()} style={crumbLink}>All categories</Link>
      <span aria-hidden="true" style={{ color: "#9db4d8" }}>›</span>
      {stateAbbr && categoryId ? (
        <>
          <Link href={catHref(categoryId)} style={crumbLink}>{categoryLabel}</Link>
          <span aria-hidden="true" style={{ color: "#9db4d8" }}>›</span>
          <span style={{ color: "#eaf3f7", fontWeight: 700 }}>{stateName(stateAbbr)}</span>
        </>
      ) : (
        <span style={{ color: "#eaf3f7", fontWeight: 700 }}>{categoryLabel}</span>
      )}
    </nav>
  );
}

// ── href + style helpers ──────────────────────────────────────────────────────
function allHref(): string {
  return `/explore?${new URLSearchParams({ lane: "property-land" }).toString()}`;
}
function catHref(categoryId: string): string {
  return `/explore?${new URLSearchParams({ lane: "property-land", category: categoryId }).toString()}`;
}
function stateHref(categoryId: string, abbr: string): string {
  return `/explore?${new URLSearchParams({ lane: "property-land", category: categoryId, state: abbr }).toString()}`;
}

const cardLink = {
  display: "flex", flexDirection: "column", gap: 6,
  border: `1px solid ${navigatorTheme.waypointBorder}`, borderRadius: 12, background: navigatorTheme.cellBg,
  padding: "16px 18px", textDecoration: "none", height: "100%",
} as const;
const countPill = {
  fontSize: 13, fontWeight: 700, color: "#7fc4b8", background: "#e1f5ee",
  border: "1px solid #b9e3d4", borderRadius: 999, padding: "1px 10px",
} as const;
const crumbLink = { color: "#7fc4b8", textDecoration: "none", fontWeight: 600 } as const;
const backLink = { fontSize: 14, fontWeight: 700, color: "#7fc4b8", textDecoration: "none", width: "fit-content" } as const;
// Chart Table cohesion rollout (founder 2026-07-17): the hub sits on the
// navigator stage — same tokens as ChartTableBrief's buyer theme.
const lightContainer = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "32px 24px 60px",
  display: "grid",
  gap: 24,
  background: navigatorTheme.stage,
  borderRadius: 20,
  color: navigatorTheme.ink,
} as const;
