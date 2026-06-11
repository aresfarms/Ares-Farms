/**
 * ingestJourneyPool — Living Map, Phase 3 (Pool Refresh ingestion)
 *
 * Consumes journeyPoolManifest.ts (the weekly archive-mining output), resolves
 * the largest downloadable image from each catalog page, downloads it into
 * /public/journey/, and writes americasJourneyPoolGenerated.ts (merged across
 * runs, deduped by src, sorted by true year).
 *
 * Run explicitly — NEVER part of `npm run build`:
 *     npm run ingest:journey-pool          (download + write)
 *     npm run ingest:journey-pool -- --dry  (resolve only, no download/write)
 *
 * RIGHTS DISCIPLINE: a candidate is ingested only if its `rights` reads CC0 /
 * public domain / no known restrictions. Anything else is skipped. Resolution
 * failures (e.g. structured HABS/HAER records with no JPEG) are skipped and
 * reported — never fabricated.
 *
 * Sources: Library of Congress (?fo=json) for this run. Smithsonian Open Access
 * (CC0) resolution can be added once SI_API_KEY is present (loaded from
 * .env.local); the manifest is the single entry point for new candidates.
 *
 * "The map reveals opportunities, not the visitor."
 * Public Alpha remains PENDING.
 */

import * as fs from "fs";
import * as path from "path";

import { POOL_MANIFEST, type PoolCandidate } from "../lib/public-content/journeyPoolManifest";
import { HOLIDAY_MANIFEST, type HolidayCandidate } from "../lib/public-content/holidayPoolManifest";
import { GENERATED_POOL, GENERATED_HOLIDAY_POOL } from "../lib/public-content/americasJourneyPoolGenerated";
import { IMAGES } from "../lib/public-content/americasJourneyImages";
import type { ArchivalImage } from "../lib/public-content/americasJourneyStops";

// Load .env.local so SI_API_KEY (and friends) are available when needed.
try {
  // @next/env ships with Next.js; loads .env.local for standalone scripts.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { loadEnvConfig } = require("@next/env");
  loadEnvConfig(process.cwd());
} catch {
  /* optional — env vars may already be set in the shell */
}

const DRY = process.argv.includes("--dry");
const ROOT = process.cwd();
const JOURNEY_DIR = path.join(ROOT, "public", "journey");
const GENERATED_FILE = path.join(ROOT, "src/lib/public-content/americasJourneyPoolGenerated.ts");
const INSTITUTION = "Library of Congress, Prints & Photographs Division";
const UA = "FurlongLivingMap/1.0 (archival ingestion; contact chudson@aresfarmsinc.com)";

const RIGHTS_CLEAN = /\bCC0\b|public[\s-]?domain|no known (?:copyright )?restrictions|\bPD\b/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function yearValue(year: number | string | undefined): number {
  if (typeof year === "number") return year;
  if (typeof year === "string") {
    const m = year.match(/\d{4}/);
    if (m) return Number(m[0]);
  }
  return Number.POSITIVE_INFINITY;
}

/** Stable per-candidate filename: <prefix>__<locid>.jpg (idempotent across runs). */
function fileNameFor(prefix: string, sourceUrl: string): string {
  const seg = sourceUrl.replace(/\/+$/, "").split("/").pop() ?? "img";
  const locid = seg.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${prefix}__${locid}.jpg`;
}

/** A manifest entry normalized for the shared ingestion loop. */
interface NormalizedCandidate {
  key: string;            // stopId or holidayId — the target pool key
  prefix: string;         // filename prefix
  year: number | string;
  sourceUrl: string;
  credit: string;
  rights: string;
  alt: string;
}

interface ResolvedImage { url: string; width: number; portrait: boolean; }

/** True if a LoC item's subjects/format/genre mark it a portrait of a person. */
function isPortrait(item: any): boolean {
  const blob = JSON.stringify([
    item?.subjects, item?.subject, item?.format, item?.genre, item?.title,
  ]).toLowerCase();
  return /\bportrait/.test(blob) || /portrait photographs?/.test(blob);
}

/** Resolve the largest JPEG for a LoC catalog page via its ?fo=json record. */
async function resolveLoc(sourceUrl: string): Promise<ResolvedImage | null> {
  const api = sourceUrl.replace(/\/?$/, "/") + "?fo=json";
  let json: any;
  try {
    const res = await fetch(api, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) return null;
    json = await res.json();
  } catch {
    return null;
  }

  const candidates: { url: string; width: number }[] = [];

  // Primary: item.image_url is an ascending-size list of JPEGs.
  const imgs = json?.item?.image_url;
  if (Array.isArray(imgs)) {
    for (const raw of imgs) {
      if (typeof raw !== "string") continue;
      const [base, frag] = raw.split("#");
      if (!/\.(jpe?g)$/i.test(base)) continue;
      const wm = frag ? /w=(\d+)/.exec(frag) : null;
      candidates.push({ url: base, width: wm ? Number(wm[1]) : 0 });
    }
  }

  // Fallback: dig resources[].files[][] for JPEG variants (some record types).
  if (candidates.length === 0 && Array.isArray(json?.resources)) {
    for (const r of json.resources) {
      const files = r?.files;
      if (!Array.isArray(files)) continue;
      for (const variants of files) {
        if (!Array.isArray(variants)) continue;
        for (const v of variants) {
          if (v && typeof v.url === "string" && /image\/jpeg/i.test(v.mimetype || "")) {
            candidates.push({ url: v.url.split("#")[0], width: Number(v.width) || 0 });
          }
        }
      }
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.width - a.width);
  return { ...candidates[0], portrait: isPortrait(json?.item) };
}

/** Download to disk; returns true on a valid JPEG written. */
async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    // JPEG magic bytes 0xFF 0xD8; guard against HTML error pages.
    if (buf.length < 1024 || buf[0] !== 0xff || buf[1] !== 0xd8) return false;
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

/** Process a normalized candidate list into a target pool map (mutates it). */
async function ingestInto(
  candidates: NormalizedCandidate[],
  target: Record<string, ArchivalImage[]>,
  haveSrc: Set<string>,
  skipped: string[],
): Promise<number> {
  let added = 0;
  for (const c of candidates) {
    const label = `${c.key} ← ${c.sourceUrl}`;
    if (!RIGHTS_CLEAN.test(c.rights)) {
      skipped.push(`${label} — rights not clean: "${c.rights}"`);
      continue;
    }
    const fileName = fileNameFor(c.prefix, c.sourceUrl);
    const src = `/journey/${fileName}`;
    const dest = path.join(JOURNEY_DIR, fileName);
    if (haveSrc.has(src)) continue;

    const onDisk = fs.existsSync(dest);
    if (!onDisk) {
      const resolved = await resolveLoc(c.sourceUrl);
      if (!resolved) { skipped.push(`${label} — no resolvable JPEG (skipped)`); continue; }
      if (resolved.portrait) { skipped.push(`${label} — rejected: LoC item is a PORTRAIT (no-portrait rule)`); continue; }
      if (DRY) { console.log(`  • would download ${src}  (w=${resolved.width})  ${resolved.url}`); continue; }
      const ok = await download(resolved.url, dest);
      if (!ok) { skipped.push(`${label} — download failed`); continue; }
      console.log(`  ✓ downloaded ${src}  (w=${resolved.width})`);
    } else if (DRY) {
      console.log(`  • already on disk ${src}`);
      continue;
    }

    (target[c.key] ??= []).push({
      src,
      alt: c.alt,
      description: c.alt,
      institution: INSTITUTION,
      sourceUrl: c.sourceUrl,
      credit: c.credit,
      rights: c.rights,
      year: c.year,
    });
    haveSrc.add(src);
    added++;
  }
  return added;
}

function emit(name: string, map: Record<string, ArchivalImage[]>): string {
  return `export const ${name}: Record<string, ArchivalImage[]> = ` +
    JSON.stringify(map, null, 2) + ";\n";
}

// ── Drop-folder ingestion (Furlong original photography) ─────────────────────

const DROP_DIR = path.join(ROOT, "journey-photos");
const ORIGINAL_RIGHTS = "Original photography — Furlong, owned outright (no third-party rights).";
const DROP_RE = /^([a-z0-9-]+)__(\d{4})__([a-z0-9-]+)\.jpe?g$/i;

/**
 * Strip JPEG metadata segments (APP1 EXIF/XMP, APP2–APP15) — this removes the
 * hidden GPS coordinates phone photos carry. Keeps APP0/JFIF and all image data.
 * Dependency-free JPEG marker walk.
 */
function stripJpegMetadata(buf: Buffer): Buffer {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return buf; // not JPEG
  const parts: Buffer[] = [buf.subarray(0, 2)]; // SOI
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    // SOS (0xDA) and EOI (0xD9): the rest is entropy-coded image data — copy it whole.
    if (marker === 0xda || marker === 0xd9) { parts.push(buf.subarray(i)); return Buffer.concat(parts); }
    if (i + 4 > buf.length) break;
    const len = buf.readUInt16BE(i + 2);
    const end = i + 2 + len;
    if (end > buf.length) break;
    const dropMeta = marker >= 0xe1 && marker <= 0xef; // APP1..APP15 (EXIF/XMP/IPTC/Photoshop)
    if (!dropMeta) parts.push(buf.subarray(i, end));
    i = end;
  }
  return Buffer.concat(parts);
}

/** Publish founder-dropped photos as present-day, Furlong-owned pool images. */
function ingestDrops(
  target: Record<string, ArchivalImage[]>,
  haveSrc: Set<string>,
  skipped: string[],
): number {
  if (!fs.existsSync(DROP_DIR)) return 0;
  let added = 0;
  for (const file of fs.readdirSync(DROP_DIR)) {
    if (file === "README.md" || file.startsWith(".")) continue;
    const m = DROP_RE.exec(file);
    if (!m) { skipped.push(`drop/${file} — name must be <stop-id>__<year>__<desc>.jpg`); continue; }
    const [, stopId, year, desc] = m;
    if (!IMAGES[stopId]) { skipped.push(`drop/${file} — unknown stop-id "${stopId}"`); continue; }

    const outName = `${stopId}__furlong-${year}-${desc}.jpg`;
    const src = `/journey/${outName}`;
    const dest = path.join(JOURNEY_DIR, outName);
    if (haveSrc.has(src) || fs.existsSync(dest)) { haveSrc.add(src); continue; } // already published

    let buf: Buffer;
    try { buf = fs.readFileSync(path.join(DROP_DIR, file)); }
    catch { skipped.push(`drop/${file} — unreadable`); continue; }
    if (buf.length < 1024 || buf[0] !== 0xff || buf[1] !== 0xd8) { skipped.push(`drop/${file} — not a JPEG`); continue; }
    if (DRY) { console.log(`  • would publish ${src} (EXIF-stripped) from drop/${file}`); continue; }

    const stripped = stripJpegMetadata(buf);
    fs.writeFileSync(dest, stripped);
    console.log(`  ✓ published ${src} — Furlong original, EXIF stripped (${buf.length}→${stripped.length} bytes)`);

    const readable = desc.replace(/-/g, " ");
    (target[stopId] ??= []).push({
      src,
      alt: `Present-day photograph of the ${stopId.replace(/-/g, " ")} location — ${readable}`,
      description: `Present-day Furlong photograph — ${readable}`,
      institution: "Furlong (original photography)",
      sourceUrl: "",
      credit: `Furlong original photography, ${year}.`,
      rights: ORIGINAL_RIGHTS,
      year: Number(year),
    });
    haveSrc.add(src);
    added++;
  }
  return added;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:journey-pool ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Stop candidates: ${POOL_MANIFEST.length}   Holiday candidates: ${HOLIDAY_MANIFEST.length}`);
  console.log(`  Mode: ${DRY ? "DRY RUN (resolve only)" : "download + write"}`);
  if (!fs.existsSync(JOURNEY_DIR)) fs.mkdirSync(JOURNEY_DIR, { recursive: true });

  // Start from the existing generated pools so runs accumulate.
  const pool: Record<string, ArchivalImage[]> = {};
  for (const [k, list] of Object.entries(GENERATED_POOL)) pool[k] = [...list];
  const holidayPool: Record<string, ArchivalImage[]> = {};
  for (const [k, list] of Object.entries(GENERATED_HOLIDAY_POOL)) holidayPool[k] = [...list];

  const haveSrc = new Set<string>(
    [...Object.values(pool).flat(), ...Object.values(holidayPool).flat()].map((img) => img.src ?? ""),
  );
  const skipped: string[] = [];

  const stopNorm: NormalizedCandidate[] = POOL_MANIFEST.map((c: PoolCandidate) => ({
    key: c.stopId, prefix: c.stopId, year: c.year, sourceUrl: c.sourceUrl,
    credit: c.credit, rights: c.rights, alt: c.alt,
  }));
  const holidayNorm: NormalizedCandidate[] = HOLIDAY_MANIFEST.map((c: HolidayCandidate) => ({
    key: c.holidayId, prefix: `holiday__${c.holidayId}`, year: c.year, sourceUrl: c.sourceUrl,
    credit: c.credit, rights: c.rights, alt: c.alt,
  }));

  const addedStops    = await ingestInto(stopNorm, pool, haveSrc, skipped);
  const addedHolidays = await ingestInto(holidayNorm, holidayPool, haveSrc, skipped);
  const addedDrops    = ingestDrops(pool, haveSrc, skipped);

  // Sort every pool chronologically.
  for (const list of Object.values(pool)) list.sort((a, b) => yearValue(a.year) - yearValue(b.year));
  for (const list of Object.values(holidayPool)) list.sort((a, b) => yearValue(a.year) - yearValue(b.year));

  console.log(`\n  Added this run: ${addedStops} stop image(s), ${addedHolidays} holiday image(s), ${addedDrops} dropped photo(s)`);
  if (skipped.length) {
    console.log(`  Skipped (${skipped.length}):`);
    for (const s of skipped) console.log(`    – ${s}`);
  }

  if (DRY) { console.log("\n  DRY RUN — no files written.\n"); return; }

  const header = `/**
 * americasJourneyPoolGenerated — GENERATED FILE. Do not edit by hand.
 *
 * Written by src/scripts/ingestJourneyPool.ts from journeyPoolManifest.ts and
 * holidayPoolManifest.ts: the script resolves each LoC catalog page to its
 * largest image, downloads it into /public/journey/, and records the rights-clean
 * ArchivalImage here. It merges across runs (dedup by src), so pools grow.
 *
 * Edit the manifests and re-run the ingest, never this file.
 *
 * Last run: ${new Date().toISOString()}
 */

import type { ArchivalImage } from "./americasJourneyStops";

`;

  fs.writeFileSync(
    GENERATED_FILE,
    header + emit("GENERATED_HOLIDAY_POOL", holidayPool) + "\n" + emit("GENERATED_POOL", pool),
    "utf-8",
  );

  const totalStops = Object.values(pool).reduce((n, l) => n + l.length, 0);
  const totalHol = Object.values(holidayPool).reduce((n, l) => n + l.length, 0);
  console.log(`\n  Wrote ${GENERATED_FILE}`);
  console.log(`  Stop pool: ${totalStops} image(s) across ${Object.keys(pool).length} stop(s).`);
  console.log(`  Holiday pool: ${totalHol} image(s) across ${Object.keys(holidayPool).length} holiday(s).`);
  console.log("\n  Next: npm run verify:journey-image-credits && npx tsc --noEmit && npm run build\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
