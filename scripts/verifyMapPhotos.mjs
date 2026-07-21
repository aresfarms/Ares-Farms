// scripts/verifyMapPhotos.mjs — Build 55
//
// Static source check: verifies that the map component is wired to the
// IMAGES / NOW_IMAGES registries and physically contains <img> tags.
// Prevents "no photos ever render" regressions without requiring a live server.
//
// Why static rather than DOM-scraping:
//   The root cause of the original bug was that the component referenced
//   place.then.src (always null in tour data) instead of IMAGES[place.id].
//   A static check on the source file catches that exact class of regression.
//
// Checks:
//   P01  Map component imports IMAGES from americasJourneyImages
//   P02  Map component imports NOW_IMAGES from americasJourneyNowImages
//   P03  Map component contains at least one <img tag (images are rendered)
//   P04  Map component references IMAGES[ (registry lookup, not tour-data field)
//   P05  Map component references NOW_IMAGES[ (registry lookup, not tour-data field)
//   P06  Map component does NOT read place.then.src (stale null field)
//   P07  Map component does NOT read place.now.src (stale null field)
//   P08  Map component does NOT render a then/now block outside the map container
//   P09  All null-src registry entries carry needsConfirmation: true
//          A stop with src: null AND no needsConfirmation: true is an unacknowledged
//          gap — nobody has explicitly decided whether to commission or skip the photo.
//          Stops explicitly marked needsConfirmation: true are acceptable holds
//          (rights pending, commission planned). All other null-src entries must be
//          acknowledged by adding needsConfirmation: true or downloading the image.
//
// "The map reveals opportunities, not the visitor."
// Public Alpha remains PENDING.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MAP_COMPONENT = join(ROOT, 'src/components/public/PublicMapExperience.tsx');

if (!existsSync(MAP_COMPONENT)) {
  console.error('FAIL: PublicMapExperience.tsx not found at expected path.');
  console.error(`      Expected: ${MAP_COMPONENT}`);
  process.exit(1);
}

const src = readFileSync(MAP_COMPONENT, 'utf-8');

const checks = [
  {
    id: 'P01',
    label: 'Map component imports IMAGES from americasJourneyImages',
    passes: src.includes('americasJourneyImages') && src.includes('IMAGES'),
    detail: 'Must import IMAGES from @/lib/public-content/americasJourneyImages',
  },
  {
    id: 'P02',
    label: 'Map component imports NOW_IMAGES from americasJourneyNowImages',
    passes: src.includes('americasJourneyNowImages') && src.includes('NOW_IMAGES'),
    detail: 'Must import NOW_IMAGES from @/lib/public-content/americasJourneyNowImages',
  },
  {
    id: 'P03',
    label: 'Map component contains <img tag (images are rendered)',
    passes: src.includes('<img'),
    detail: 'Must contain at least one <img element — component cannot render photos without it.',
  },
  {
    id: 'P04',
    label: 'Map component references IMAGES[ (registry lookup)',
    passes: src.includes('IMAGES['),
    detail: 'Must look up images via IMAGES[place.id], not via place.then.src.',
  },
  {
    id: 'P05',
    label: 'Map component references NOW_IMAGES[ (registry lookup)',
    passes: src.includes('NOW_IMAGES['),
    detail: 'Must look up now-images via NOW_IMAGES[place.id], not via place.now.src.',
  },
  {
    id: 'P06',
    label: 'Map component does NOT read place.then.src (stale null field)',
    // Allow the string inside comments (// line comments or * block-comment lines).
    // Reject any occurrence in executable code.
    passes: !src.split('\n').some((line) => {
      const t = line.trimStart();
      const isComment = t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
      return !isComment && line.includes('place.then.src');
    }),
    detail: 'place.then.src is always null in tour data. Use thenImg.src from IMAGES[place.id].',
  },
  {
    id: 'P07',
    label: 'Map component does NOT read place.now.src (stale null field)',
    passes: !src.split('\n').some((line) => {
      const t = line.trimStart();
      const isComment = t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
      return !isComment && line.includes('place.now.src');
    }),
    detail: 'place.now.src is always null in tour data. Use nowImg.src from NOW_IMAGES[place.id].',
  },
  {
    id: 'P08',
    label: 'Map component does NOT render a then/now block outside the map container',
    // The old below-map two-column layout used gridTemplateColumns: "1fr 1fr".
    // If that string is present in executable code (not a comment), panels are back below the map.
    passes: !src.split('\n').some((line) => {
      const t = line.trimStart();
      const isComment = t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
      return !isComment && line.includes('gridTemplateColumns') && line.includes('1fr 1fr');
    }),
    detail: 'Found gridTemplateColumns: "1fr 1fr" in non-comment code — this is the old below-map two-column then/now panel layout. Remove it; everything must be in the on-map popup.',
  },
];

// ── P09: No unacknowledged null-src entries in either registry ────────────────
//
// Each registry file is split into entry blocks at the `  "stop-id": {` boundary.
// For each block: if src: null is present AND needsConfirmation: true is absent,
// that stop is an unacknowledged gap — FAIL.
//
// Stops with needsConfirmation: true are explicit holds (rights pending, commission
// planned); they are acceptable at null src. All others need a decision.

const REGISTRY_FILES = [
  {
    path:  join(ROOT, 'src/lib/public-content/americasJourneyImages.ts'),
    label: 'IMAGES',
  },
  {
    path:  join(ROOT, 'src/lib/public-content/americasJourneyNowImages.ts'),
    label: 'NOW_IMAGES',
  },
];

const nullSrcGaps = [];

for (const rf of REGISTRY_FILES) {
  if (!existsSync(rf.path)) {
    nullSrcGaps.push(`${rf.label}: registry file not found at ${rf.path}`);
    continue;
  }
  const text = readFileSync(rf.path, 'utf-8');

  // Split on each entry boundary: a line that starts with two spaces + double-quote.
  // e.g.  "st-augustine-1565": {
  // This matches the consistent formatting used throughout both registry files.
  const segments = text.split(/\n  "/);

  for (const seg of segments) {
    // Skip non-entry segments (file header, type declarations, comments, etc.)
    // A valid entry segment begins with an id like `stop-id": {`
    const idMatch = seg.match(/^([a-zA-Z0-9][a-zA-Z0-9_-]*)": \{/);
    if (!idMatch) continue;
    const id = idMatch[1];

    // Check for src: null (any whitespace variant) in this segment.
    const hasSrcNull = /\bsrc:\s*null\b/.test(seg);
    // Check for needsConfirmation: true in this segment.
    const hasConfirmation = /\bneedsConfirmation:\s*true\b/.test(seg);

    if (hasSrcNull && !hasConfirmation) {
      nullSrcGaps.push(
        `${rf.label}["${id}"] — src: null without needsConfirmation: true`
      );
    }
  }
}

checks.push({
  id: 'P09',
  label: 'All null-src registry entries carry needsConfirmation: true',
  passes: nullSrcGaps.length === 0,
  detail: nullSrcGaps.length > 0
    ? `Unacknowledged null-src stops (either download the image or add needsConfirmation: true):\n      ${nullSrcGaps.join('\n      ')}`
    : '',
});

// ── Registry parsing (for rotation + file-existence checks) ───────────────────
//
// Build a per-id record from each registry: { src, tier, needsConfirmation }.
// src is the raw value: null, or the '/journey/...' path string (quotes stripped).

function parseRegistry(absPath) {
  const out = new Map();
  if (!existsSync(absPath)) return out;
  const text = readFileSync(absPath, 'utf-8');
  const segments = text.split(/\n  "/);
  for (const seg of segments) {
    const idMatch = seg.match(/^([a-zA-Z0-9][a-zA-Z0-9_-]*)": \{/);
    if (!idMatch) continue;
    const id = idMatch[1];
    const srcMatch = seg.match(/\bsrc:\s*(null|'[^']*'|"[^"]*")/);
    let src = null;
    if (srcMatch && srcMatch[1] !== 'null') {
      src = srcMatch[1].slice(1, -1); // strip surrounding quotes
    }
    const tierMatch = seg.match(/\btier:\s*'([^']+)'/);
    const tier = tierMatch ? tierMatch[1] : null;
    const needsConfirmation = /\bneedsConfirmation:\s*true\b/.test(seg);
    const rightsMatch = seg.match(/\brights:\s*(?:'([^']*)'|"([^"]*)")/);
    const rights = rightsMatch ? (rightsMatch[1] ?? rightsMatch[2] ?? '') : '';
    const hasCredit    = /\bcredit:\s*(?:'[^']*'|"[^"]*"|`)/.test(seg);
    const hasSourceUrl = /\bsourceUrl:\s*(?:'[^']*'|"[^"]*")/.test(seg);
    const hasYear      = /\byear:\s*(?:\d|'[^']*'|"[^"]*")/.test(seg);
    out.set(id, { src, tier, needsConfirmation, rights, hasCredit, hasSourceUrl, hasYear });
  }
  return out;
}

const thenReg = parseRegistry(join(ROOT, 'src/lib/public-content/americasJourneyImages.ts'));
const nowReg  = parseRegistry(join(ROOT, 'src/lib/public-content/americasJourneyNowImages.ts'));

// ── Active rotation ids (from the tour data) ──────────────────────────────────
// Every TourPlace has `id: "..."`. The Capstone id ("your-story") has no image
// and is excluded.

const tourPath = join(ROOT, 'src/lib/public-content/americasJourneyTour.ts');
const tourText = existsSync(tourPath) ? readFileSync(tourPath, 'utf-8') : '';
const rotationIds = [...tourText.matchAll(/\bid:\s*"([^"]+)"/g)]
  .map((m) => m[1])
  .filter((id) => id !== 'your-story');

// ── P10: every non-null src in either registry exists on disk ────────────────
// A src that points to a missing file renders as a broken image. Catch it here.

const missingFiles = [];
for (const [label, reg] of [['IMAGES', thenReg], ['NOW_IMAGES', nowReg]]) {
  for (const [id, rec] of reg) {
    if (!rec.src) continue;
    const abs = join(ROOT, 'public', rec.src.replace(/^\//, ''));
    if (!existsSync(abs)) {
      missingFiles.push(`${label}["${id}"] src ${rec.src} — file not found at public${rec.src}`);
    }
  }
}
checks.push({
  id: 'P10',
  label: 'Every non-null registry src points to a real file in /public/journey',
  passes: missingFiles.length === 0,
  detail: missingFiles.length > 0
    ? `Registry src values with no file on disk (broken images):\n      ${missingFiles.join('\n      ')}`
    : '',
});

// ── P11/P12: no unexpected null src in the active rotation ────────────────────
//   THEN: src null is a FAIL unless the entry is an acknowledged hold
//         (needsConfirmation: true → text-only THEN is intentional).
//   NOW : a 'pd' OR 'cc-verify' tier with src null is a FAIL — a clean source
//         (public-domain or a verifiable Creative Commons file) exists and must
//         be ingested. Only 'commission' tier may stay null (text-only today-card
//         until original photography is delivered).

const rotationGaps = [];
for (const id of rotationIds) {
  const thenRec = thenReg.get(id);
  if (!thenRec) {
    rotationGaps.push(`IMAGES["${id}"] — rotation stop missing from THEN registry`);
  } else if (!thenRec.src && !thenRec.needsConfirmation) {
    rotationGaps.push(`IMAGES["${id}"] — THEN src null without needsConfirmation: true`);
  }

  const nowRec = nowReg.get(id);
  if (nowRec && (nowRec.tier === 'pd' || nowRec.tier === 'cc-verify') && !nowRec.src) {
    rotationGaps.push(`NOW_IMAGES["${id}"] — ${nowRec.tier}-tier NOW src null (ingest the present-day image; only 'commission' may stay null)`);
  }
}
checks.push({
  id: 'P11',
  label: 'No unexpected null src in the active rotation (THEN + pd/cc-verify NOW)',
  passes: rotationGaps.length === 0,
  detail: rotationGaps.length > 0
    ? `Rotation stops with a missing photo that is not an acknowledged hold:\n      ${rotationGaps.join('\n      ')}`
    : '',
});

// ── P12: then/now both render inside the on-map popup (round-2 assertion) ─────
// The card must render BOTH phases (then and now) from inside the map container,
// cross-fading between them — not a single static image.

checks.push({
  id: 'P12',
  label: 'Map popup renders both then and now phases with a cross-fade',
  passes: src.includes('phase === "then"') &&
          src.includes('"now"') &&
          src.includes('tour-popup-img') &&
          src.includes('tour-img-fade') &&
          src.includes('popupImg') &&
          src.includes('place.headline') &&
          src.includes('place.surprise'),
  detail: 'PublicMapExperience must render both phases inside the on-map popup: the THEN text (place.headline) and the NOW text (place.surprise), with the image (popupImg) fading in via the tour-img-fade keyframe (tour-popup-img).',
});

// ── P13: journey CTAs point to /explore (two intentional entry points) ────────
// TWO intentional journey CTAs to /explore are allowed and expected:
//   (1) the always-visible under-map CTA ("What are your possibilities? →"), and
//   (2) the capstone at the tour's end ("Ready to begin your Journey?").
// Both → /explore. The hard rule is the DESTINATION: a journey CTA must NEVER
// point at /onboarding (no accidental third CTA, no /onboarding funnel).

const homepageSrc = existsSync(join(ROOT, 'src/app/(public)/page.tsx'))
  ? readFileSync(join(ROOT, 'src/app/(public)/page.tsx'), 'utf-8')
  : '';
const exploreExists = existsSync(join(ROOT, 'src/app/(public)/explore/page.tsx'));
const ctaProblems = [];
// (2) Capstone entry point (in the tour data).
if (!/href:\s*"\/explore"/.test(tourText)) ctaProblems.push('capstone CTA href is not "/explore"');
if (!tourText.includes('Ready to begin your Journey?')) ctaProblems.push('capstone CTA label is not "Ready to begin your Journey?"');
// The old under-map CTA was intentionally retired to avoid duplicating the
// governed Navigator action. The capstone remains the Journey entry point.
if (src.includes('under-map-explore-cta')) ctaProblems.push('retired duplicate under-map CTA is still present');
// Hard rule: no journey CTA to /onboarding, anywhere on map / homepage / tour.
if (homepageSrc.includes('href="/onboarding"')) ctaProblems.push('homepage has a journey CTA to /onboarding (must be /explore)');
if (src.includes('href="/onboarding"') || /href:\s*"\/onboarding"/.test(tourText)) ctaProblems.push('a journey CTA points at /onboarding (must be /explore)');
if (!exploreExists) ctaProblems.push('/explore route (src/app/(public)/explore/page.tsx) does not exist');

checks.push({
  id: 'P13',
  label: 'Journey capstone CTA → /explore; retired duplicate absent; none → /onboarding',
  passes: ctaProblems.length === 0,
  detail: ctaProblems.length > 0
    ? `Journey-CTA-to-/explore violations:\n      ${ctaProblems.join('\n      ')}`
    : '',
});

// ── P14: rendered images are rights-clean (CC0 / PD) with a true year ─────────
// Living Map rule (Phase 1): every image that can actually render (src set AND
// not an unconfirmed hold) must carry a true `year`, a visible credit + source
// link, and CC0 / public-domain rights. Anything else must not be renderable.

const RIGHTS_CLEAN = /\bCC0\b|public[\s-]?domain|no known (?:copyright )?restrictions|\bPD\b/i;
const rightsGaps = [];
for (const [label, reg] of [['IMAGES', thenReg], ['NOW_IMAGES', nowReg]]) {
  for (const [id, rec] of reg) {
    // Only images that actually render are gated. Held / null entries are
    // covered by P09 (acknowledged) and P11 (rotation completeness).
    if (!rec.src || rec.needsConfirmation) continue;
    if (!rec.hasYear)      rightsGaps.push(`${label}["${id}"] — renderable image missing a true year`);
    if (!rec.hasCredit)    rightsGaps.push(`${label}["${id}"] — renderable image missing a credit`);
    if (!rec.hasSourceUrl) rightsGaps.push(`${label}["${id}"] — renderable image missing a sourceUrl`);
    if (!RIGHTS_CLEAN.test(rec.rights)) {
      rightsGaps.push(`${label}["${id}"] — rights not CC0/public-domain: "${rec.rights}"`);
    }
  }
}
checks.push({
  id: 'P14',
  label: 'Rendered images are CC0/PD with a true year, credit, and source link',
  passes: rightsGaps.length === 0,
  detail: rightsGaps.length > 0
    ? `Living-map rights/metadata violations:\n      ${rightsGaps.join('\n      ')}`
    : '',
});

// ── P15: holiday engine is wired into the map component ───────────────────────
// The map must consult the holiday calendar and render the takeover so a holiday
// can lead the map with its themed pair.

checks.push({
  id: 'P15',
  label: 'Holiday takeover is wired into the map component',
  passes: src.includes('getActiveHoliday') &&
          src.includes('activeHoliday') &&
          src.includes('Holiday feature') &&
          src.includes('In remembrance'),
  detail: 'PublicMapExperience must resolve getActiveHoliday and render the holiday takeover (celebration "Holiday feature" + dignified "In remembrance" treatment).',
});

// ── Parse the generated pool (array-structured TS → JSON) ─────────────────────
function parseGenerated(exportName) {
  const f = join(ROOT, 'src/lib/public-content/americasJourneyPoolGenerated.ts');
  if (!existsSync(f)) return {};
  const text = readFileSync(f, 'utf-8');
  const m = text.match(new RegExp(`export const ${exportName}: Record<string, ArchivalImage\\[\\]> = (\\{[\\s\\S]*?\\});`));
  if (!m) return {};
  try { return JSON.parse(m[1]); } catch { return {}; }
}
const genPool    = parseGenerated('GENERATED_POOL');
const genHoliday = parseGenerated('GENERATED_HOLIDAY_POOL');

// ── P16: no-portrait rule ────────────────────────────────────────────────────
// Runtime protection lives in the ingest (isPortrait filter); this gate ensures
// that filter can't be silently removed, and that no shipped image is described
// as a portrait.
const ingestPath = join(ROOT, 'src/scripts/ingestJourneyPool.ts');
const ingestSrc  = existsSync(ingestPath) ? readFileSync(ingestPath, 'utf-8') : '';
const portraitFindings = [];
if (!ingestSrc.includes('isPortrait') || !ingestSrc.toLowerCase().includes('no-portrait')) {
  portraitFindings.push('ingest no-portrait filter (isPortrait) is missing — it must reject LoC portrait items');
}
// Scan downloaded pools for any entry described as a portrait (the auto-pipeline
// records alt/description/credit; the hand-curated registries are reviewed).
function scanPortraitText(label, list) {
  for (const img of list) {
    const blob = `${img.alt ?? ''} ${img.description ?? ''} ${img.credit ?? ''}`.toLowerCase();
    if (/\bportrait\b|\bheadshot\b/.test(blob)) {
      portraitFindings.push(`${label} — image text mentions a portrait: "${(img.alt ?? '').slice(0, 60)}"`);
    }
  }
}
for (const [id, list] of Object.entries(genPool))    scanPortraitText(`GENERATED_POOL["${id}"]`, list);
for (const [id, list] of Object.entries(genHoliday)) scanPortraitText(`GENERATED_HOLIDAY_POOL["${id}"]`, list);
checks.push({
  id: 'P16',
  label: 'No-portrait rule (ingest filter present; no image described as a portrait)',
  passes: portraitFindings.length === 0,
  detail: portraitFindings.length ? `Portrait violations:\n      ${portraitFindings.join('\n      ')}` : '',
});

// ── P17: pair-present (or acknowledged single-image) ─────────────────────────
// Rotation stops legitimately holding a single image (second image is a
// needsConfirmation hold pending sourcing).
const SINGLE_IMAGE_STOPS = new Set([
  'de-zwaanendael-lewes', 'de-twelve-mile-circle', 'de-the-wedge',
  'pa-pithole', 'pa-york-capital', 'pa-centralia',
]);
function renderableCount(id) {
  const t = thenReg.get(id);
  const n = nowReg.get(id);
  let c = 0;
  if (t && t.src && !t.needsConfirmation) c++;
  if (n && n.src && !n.needsConfirmation) c++;
  c += (genPool[id] ?? []).length;
  return c;
}
const pairGaps = [];
for (const id of rotationIds) {
  const c = renderableCount(id);
  if (c === 0) {
    pairGaps.push(`${id} — 0 renderable images (blank card)`);
  } else if (c < 2 && !SINGLE_IMAGE_STOPS.has(id)) {
    pairGaps.push(`${id} — only ${c} renderable image and not flagged single-image (needs a pair)`);
  }
}
checks.push({
  id: 'P17',
  label: 'Every rotation stop renders a pair (or an acknowledged single image)',
  passes: pairGaps.length === 0,
  detail: pairGaps.length ? `Pair-present violations:\n      ${pairGaps.join('\n      ')}` : '',
});

// ── P19: /explore compass — emblem hub + 8 no-account lane spokes ─────────────
const explorePath = join(ROOT, 'src/app/(public)/explore/page.tsx');
const exploreSrc  = existsSync(explorePath) ? readFileSync(explorePath, 'utf-8') : '';
const interactiveCompassPath = join(ROOT, 'src/components/public/InteractiveCompassRose.tsx');
const interactiveCompassSrc = existsSync(interactiveCompassPath) ? readFileSync(interactiveCompassPath, 'utf-8') : '';
const EXPLORE_LANES = [
  'property-land', 'farms-agriculture', 'small-business-growth', 'environmental-compliance',
  'financing-capital', 'housing-development', 'programs-incentives', 'not-sure',
];
const exploreProblems = [];
if (!exploreSrc) {
  exploreProblems.push('/explore page not found');
} else {
  // No-account: spokes stay inside /explore, never funnel to /onboarding.
  // Match actual links/targets (href= or laneHref), not prose mentions in comments.
  if (/href=["']\/onboarding|["']\/onboarding\?explore/.test(exploreSrc)) {
    exploreProblems.push('a lane links to /onboarding — spokes must stay on /explore?lane=');
  }
  if (exploreSrc.includes('explorationHref')) exploreProblems.push('uses explorationHref (routes to /onboarding) — use /explore?lane=');
  if (!exploreSrc.includes('/explore?lane=')) exploreProblems.push('lanes must link to /explore?lane=<slug>');
  // Emblem hub present.
  if (!exploreSrc.includes('InteractiveCompassRose')) exploreProblems.push('interactive compass component is not rendered');
  if (!interactiveCompassSrc.includes('/brand/furlong-emblem.png')) exploreProblems.push('interactive compass emblem hub (/brand/furlong-emblem.png) not rendered');
  // Exactly the 8 lanes present.
  for (const s of EXPLORE_LANES) {
    if (!exploreSrc.includes(`"${s}"`)) exploreProblems.push(`lane "${s}" missing from the compass`);
  }
}
checks.push({
  id: 'P19',
  label: '/explore renders the emblem hub + 8 no-account lane spokes (no /onboarding)',
  passes: exploreProblems.length === 0,
  detail: exploreProblems.length ? `Explore compass violations:\n      ${exploreProblems.join('\n      ')}` : '',
});

// ── P20: /about map is the FOUNDING-THREAD story, not the hidden-gem tour ─────
// The /about/furlong-story map must render the Amber/Sapphire/Modern Convergence
// founding milestones — NEVER the homepage hidden-gem tour. This stops the
// Round-3 mistake (swapping in PublicMapExperience) from silently recurring.
const storyPath = join(ROOT, 'src/components/story/FurlongStoryTimeline.tsx');
const storySrc  = existsSync(storyPath) ? readFileSync(storyPath, 'utf-8') : '';
const aboutPath = join(ROOT, 'src/app/(public)/about/furlong-story/page.tsx');
const aboutSrc  = existsSync(aboutPath) ? readFileSync(aboutPath, 'utf-8') : '';
const FOUNDING_IDS = ['m0-america250', 'm1-amber-virginia', 'm6-convergence'];
const storyProblems = [];
if (!storySrc) {
  storyProblems.push('FurlongStoryTimeline.tsx not found');
} else {
  for (const id of FOUNDING_IDS) {
    if (!storySrc.includes(id)) storyProblems.push(`founding-thread milestone "${id}" missing from FurlongStoryTimeline`);
  }
  if (!storySrc.includes('Amber Thread') || !storySrc.includes('Sapphire Thread') || !storySrc.includes('Modern Convergence')) {
    storyProblems.push('FurlongStoryTimeline must label the Amber / Sapphire / Modern Convergence threads');
  }
  // It must NOT pull the hidden-gem tour data.
  if (/americasJourneyTour|\bJOURNEY\b/.test(storySrc)) {
    storyProblems.push('FurlongStoryTimeline references the homepage hidden-gem tour data (americasJourneyTour/JOURNEY) — it must use its own milestones');
  }
  // No hidden-gem rotation stop id may appear in the /about map.
  for (const id of rotationIds) {
    if (storySrc.includes(`"${id}"`)) storyProblems.push(`hidden-gem stop "${id}" leaked into the /about founding map`);
  }
}
if (!aboutSrc) {
  storyProblems.push('/about/furlong-story page not found');
} else {
  if (!aboutSrc.includes('FurlongStoryTimeline')) storyProblems.push('/about/furlong-story must render FurlongStoryTimeline');
  if (aboutSrc.includes('PublicMapExperience')) storyProblems.push('/about/furlong-story must NOT render the homepage PublicMapExperience (hidden-gem tour)');
}
// Homepage must still use the hidden-gem tour, not the story map.
if (homepageSrc && homepageSrc.includes('FurlongStoryTimeline')) {
  storyProblems.push('homepage must NOT render FurlongStoryTimeline — it keeps PublicMapExperience (hidden-gem tour)');
}
checks.push({
  id: 'P20',
  label: '/about renders the founding-thread map (not the hidden-gem tour)',
  passes: storyProblems.length === 0,
  detail: storyProblems.length ? `Founding-map violations:\n      ${storyProblems.join('\n      ')}` : '',
});

// ── P21: anti-duplication — canonical disclosure prose lives ONLY in <Disclosures> ─
// No page may hand-write the canonical disclosure sentences. They belong solely
// to src/components/public/Disclosures.tsx (single source of truth). This stops
// the per-page disclosure drift/duplication from silently returning.
// Exact canonical footer sentences (not warm paraphrases). Public surfaces must
// render <Disclosures> rather than hand-write these. Internal/governance pages
// carry their own institutional disclosures and are out of scope.
const DISCLOSURE_FRAGMENTS = [
  /is not an approval, guarantee, or official determination/i,
  /no legal reliance, no regulatory reliance/i,
  /does not secretly submit, sell, or distribute/i,
  /no silent submission\./i,
  /no information sale\./i,
];
const publicDir = join(ROOT, 'src/app/(public)');
const pageFiles = (existsSync(publicDir)
  ? readdirSync(publicDir, { recursive: true })
      .filter((f) => typeof f === 'string' && f.endsWith('page.tsx'))
      .map((f) => join(publicDir, f))
  : []);
const borrowerPage = join(ROOT, 'src/app/portal/borrower/page.tsx');
if (existsSync(borrowerPage)) pageFiles.push(borrowerPage);
const dupFindings = [];
for (const pf of pageFiles) {
  let txt = '';
  try { txt = readFileSync(pf, 'utf-8'); } catch { continue; }
  for (const re of DISCLOSURE_FRAGMENTS) {
    if (re.test(txt)) {
      dupFindings.push(`${pf.replace(ROOT + '/', '')} hand-writes a canonical disclosure sentence (/${re.source.slice(0, 38)}…/) — render <Disclosures> instead`);
    }
  }
}
checks.push({
  id: 'P21',
  label: 'Disclosure prose lives only in <Disclosures> (no per-page duplication)',
  passes: dupFindings.length === 0,
  detail: dupFindings.length ? `Anti-duplication violations:\n      ${dupFindings.join('\n      ')}` : '',
});

// ── P22: disclosure pages render <Disclosures>; data-rights content lives on /trust ─
// After the Build 56 consolidation the standalone /data-rights page is gone:
// /data-rights 308-redirects to /trust#your-data, so a page file there would be
// dead code (shadowed by the redirect). This gate therefore (1) checks the four
// real disclosure-bearing pages render <Disclosures>, (2) asserts the merged
// data-rights content actually renders on /trust#your-data (the five rights, the
// honest-deletion language, and the full <Disclosures>), and (3) FAILS if the
// orphaned /data-rights page is ever reintroduced.
const DISCLOSURE_PAGES = [
  'src/app/(public)/page.tsx',          // Home (compact)
  'src/app/(public)/trust/page.tsx',    // Trust & Your Data (incl. #your-data)
  'src/app/(public)/about/page.tsx',
  'src/app/(public)/compass/page.tsx',  // What We Do
];
const p22Problems = DISCLOSURE_PAGES.filter((rel) => {
  const f = join(ROOT, rel);
  if (!existsSync(f)) return true;
  return !readFileSync(f, 'utf-8').includes('<Disclosures');
}).map((rel) => `${rel} — missing <Disclosures>`);

// The orphaned standalone page must not come back — the 308 redirect shadows it.
if (existsSync(join(ROOT, 'src/app/(public)/data-rights/page.tsx'))) {
  p22Problems.push(
    'src/app/(public)/data-rights/page.tsx exists but is shadowed by the ' +
    '/data-rights→/trust#your-data 308 redirect (dead code) — delete it; the ' +
    'content lives on /trust#your-data',
  );
}

// The merged data-rights content must actually render on /trust#your-data.
const trustRel = 'src/app/(public)/trust/page.tsx';
const trustSrc = existsSync(join(ROOT, trustRel)) ? readFileSync(join(ROOT, trustRel), 'utf-8') : '';
const DATA_RIGHTS_TOKENS = [
  ['id="your-data"',                  'the #your-data section anchor'],
  ['Your Five Ultimate Data Rights',  'the five-rights heading'],
  ['Request an Explanation',          'right 1 — Request an Explanation'],
  ['Request an Export',               'right 2 — Request an Export'],
  ['Request a Human Review',          'right 3 — Request a Human Review'],
  ['Request a Hold',                  'right 4 — Request a Hold'],
  ['Request Deletion',                'right 5 — Request Deletion'],
  ['The Honest Truth About Deletion', 'the honest-deletion language'],
  ['<Disclosures variant="full"',     'the full <Disclosures> block'],
];
for (const [tok, desc] of DATA_RIGHTS_TOKENS) {
  if (!trustSrc.includes(tok)) {
    p22Problems.push(`/trust#your-data missing ${desc} (expected token: ${tok})`);
  }
}

checks.push({
  id: 'P22',
  label: 'Disclosure pages render <Disclosures>; data-rights content lives on /trust#your-data',
  passes: p22Problems.length === 0,
  detail: p22Problems.length ? `P22 violations:\n      ${p22Problems.join('\n      ')}` : '',
});

// ── P23: "Begin the journey" is never gated on the map load/intro ─────────────
// The visitor's choice must win from first paint — Begin must not carry a
// disabled state, must render on {!started} (not on map-load state), and the
// tour must never auto-start (started defaults false; advance is gated on play).
const beginProblems = [];
const beginIdx = src.indexOf('tour-begin-btn');
const beginBlock = beginIdx >= 0 ? src.slice(beginIdx, beginIdx + 400) : '';
if (!beginBlock) {
  beginProblems.push('Begin control (tour-begin-btn) not found');
} else {
  if (/\bdisabled\b/.test(beginBlock)) {
    beginProblems.push('Begin control has a disabled attribute — it must never be disabled by load/intro');
  }
  if (/mapStatus/.test(beginBlock)) {
    beginProblems.push('Begin control is gated on mapStatus (map load) — it must be available from first paint');
  }
}
if (!src.includes('{!started &&')) {
  beginProblems.push('Begin control must render on {!started} (visitor has not begun), not on a load/intro condition');
}
if (!/const \[started, setStarted\] = useState\(false\)/.test(src)) {
  beginProblems.push('Tour must not auto-start: `started` must default to false (autoplayOnLoad stays false)');
}
checks.push({
  id: 'P23',
  label: 'Begin control is enabled from first paint (never gated on map load/intro)',
  passes: beginProblems.length === 0,
  detail: beginProblems.length ? `Begin-control violations:\n      ${beginProblems.join('\n      ')}` : '',
});

// ── P24: Team "Guiding Beacon" page — built, dark, privacy-safe ───────────────
// First names + roles only (no surnames), no photos, no locations, security as a
// team promise, and PUBLISH-GATED (404 until FURLONG_TEAM_PUBLIC) + not linked
// in nav/footer while the entity/records aren't yet safe.
const teamPath = join(ROOT, 'src/app/(public)/team/page.tsx');
const teamSrc  = existsSync(teamPath) ? readFileSync(teamPath, 'utf-8') : '';
const headerSrcP24 = existsSync(join(ROOT, 'src/components/public/PublicSiteHeader.tsx'))
  ? readFileSync(join(ROOT, 'src/components/public/PublicSiteHeader.tsx'), 'utf-8') : '';
const layoutSrcP24 = existsSync(join(ROOT, 'src/components/public/PublicSiteLayout.tsx'))
  ? readFileSync(join(ROOT, 'src/components/public/PublicSiteLayout.tsx'), 'utf-8') : '';
const teamProblems = [];
if (!teamSrc) {
  teamProblems.push('team page (src/app/(public)/team/page.tsx) is not built');
} else {
  // P-team-5: publish-gated.
  if (!teamSrc.includes('notFound')) teamProblems.push('team page must be publish-gated via notFound() until the entity is registered');
  if (!/process\.env\.FURLONG_TEAM_PUBLIC/.test(teamSrc)) teamProblems.push('team page must gate on the FURLONG_TEAM_PUBLIC env flag');
  // P-team-4: security as a team promise.
  if (!/security is a team promise/i.test(teamSrc)) teamProblems.push('team page must include the "Security is a team promise" section');
  // P-team-1: no photos of people (match real image tags/refs, not prose).
  if (/<img\b|next\/image|\.(?:jpe?g|png|webp|avif)["')]/i.test(teamSrc)) teamProblems.push('team page must not include photos (lighthouse motifs only)');
  // P-team-3: first names + roles only — no surname fields.
  if (!teamSrc.includes('firstName')) teamProblems.push('team beacons must use first names only (firstName field)');
  if (/\blastName\b|\bfullName\b/.test(teamSrc)) teamProblems.push('team page must not use last-name / full-name fields');
}
// P-team-2 / not-publicly-routed: no nav or footer link to /team while dark.
if (/href=["']\/team\b/.test(headerSrcP24) || /href:\s*["']\/team\b/.test(headerSrcP24)) teamProblems.push('header must not link to /team while it is dark');
if (/["']\/team\b/.test(layoutSrcP24)) teamProblems.push('footer/layout must not link to /team while it is dark');
checks.push({
  id: 'P24',
  label: 'Team "Guiding Beacon" page is built, privacy-safe, and publish-gated (dark)',
  passes: teamProblems.length === 0,
  detail: teamProblems.length ? `Team-page violations:\n      ${teamProblems.join('\n      ')}` : '',
});

// ── Results ───────────────────────────────────────────────────────────────────

let failed = false;
const line = '─'.repeat(70);

for (const c of checks) {
  if (c.passes) {
    console.log(`PASS  ${c.id}  ${c.label}`);
  } else {
    console.error(`FAIL  ${c.id}  ${c.label}`);
    console.error(`      ${c.detail}`);
    failed = true;
  }
}

console.log(line);
if (failed) {
  console.error('✗  verify:map-photos FAIL — map component is not wired to render images.');
  process.exit(1);
}
console.log('✓  verify:map-photos PASS — map component reads from image registries.');
process.exit(0);
