// scripts/verifyPublicCopy.mjs — Build 54
//
// Verifies that public pages render the APPROVED plain-English copy, not an
// older technical or draft version. The other gates pass green without checking
// the words — this one checks the words.
//
// Run with the dev server OR a served production build up:
//   npm run build && npm start &
//   BASE=http://localhost:3000 node scripts/verifyPublicCopy.mjs
//
// Or simply:
//   npm run verify:public-copy        (expects server already at localhost:3000)
//
// One entry per page.
//   forbidden — strings whose presence means OLD copy is still live.
//   required  — strings that MUST be present (approved copy).
// Both compared against VISIBLE TEXT only (tags/attributes/styles stripped), so
// aria-* attributes, CSS hex colors, and data attributes never trip it.
//
// Governance:
//   "The map reveals opportunities, not the visitor."
//   "We show pathways, not promises."
//   Public Alpha remains PENDING.

const BASE = process.env.BASE || 'http://localhost:3000';

const PAGES = [

  // ── / (homepage) ─────────────────────────────────────────────────────────────
  // Build 55: "Clear waters, no surprises" replaces the old trust strip + what-not
  // panel. Disclosures: advisory · pathways-not-promises · not-a-lender ·
  // not-a-regulator · ai-advisory-only · no-data-sale · explore-first · right-to-delete.
  {
    route: '/',
    forbidden: [
      // Retired hero taglines (Build 57 blend copy supersedes them).
      'discovering your opportunities',
      'financial and land topography',
      // Old flat-list "What Furlong Is Not" items — replaced by bold-intro bullets
      'furlong does not approve or deny',    // old flat-list item (not in new copy)
      'furlong does not guarantee outcomes', // old flat-list item (not in new copy)
      'furlong does not make official determinations', // old flat-list item (not in new copy)
    ],
    required: [
      // Hero "blend" copy (Build 57) — H1 → tagline → subhead → trust tag, verbatim
      'every journey starts somewhere.',
      "mapping america's land, funding, and business opportunities.",
      'use 250 years of land and financial history to map your next venture',
      'zero tracking. total transparency.',
      // New section heading
      'clear waters, no surprises',
      // Lighthouse opener
      'a lighthouse is a tool for the captain',
      // How we work bullets (lead phrases)
      'explore first, talk later',
      'pathways, not promises',
      'you keep the wheel',
      // What Furlong is not bullets (lead phrases — disclosures)
      "we're not a bank or a lender",
      "we're not a regulator",
      "we're not an automated decision-maker",
      // AI disclosure (ai-advisory-only)
      'ai never makes the final call',
      // explore-first disclosure
      'before you ever share a single piece of personal information',
      // right-to-delete disclosure
      'you can delete your footprint',
      // no-data-sale disclosure
      "we don't sell it",
      // Closing paragraph
      'every final decision and determination belongs entirely to you',
    ],
  },

  // ── /accessibility ───────────────────────────────────────────────────────────
  // Old Build 53: technical WCAG jargon, contrast ratios, CSS hex values, and
  // raw ARIA attribute strings visible in the DOM body text.
  // Build 54 approved: plain-English disability-category format.
  {
    route: '/accessibility',
    forbidden: [
      '4.84:1', '12:1', '4.6:1',            // raw contrast ratios
      '#162033', '#8a6914', '#0f766e',        // CSS hex values as visible text
      'aria-live', 'role="img"', 'htmlfor',   // raw ARIA attributes as visible text
      'wcag 2.2 aa target',                   // old technical badge label
      'matter of equity',                     // old institutional phrasing
    ],
    required: [
      'is furlong ada-friendly',              // h1 question
      'built so you can actually use it',     // subtitle
      "if you're blind",                      // disability-category section
      'if you have low vision',
      "if you're deaf or hard of hearing",
      "if you're autistic",
      "if you can't use a mouse",
    ],
  },

  // ── /compass (What We Do — value prop) ───────────────────────────────────────
  {
    route: '/compass',
    forbidden: [],
    required: [
      'compass to capital',                   // h1
      'navigating the maze',                  // h1
      "we help, we don",                      // "we help, we don't decide"
      'free for borrowers',                   // the free promise
    ],
  },

  // ── /about (Our Story — founding narrative) ──────────────────────────────────
  // Build 56 consolidation: /about is now the founding story; the value prop
  // ("Compass to Capital") moved to /compass.
  {
    route: '/about',
    forbidden: [
      'compass to capital',                   // value prop now lives on /compass, not here
    ],
    required: [
      'our story',                            // h1
      'the furlong story',                    // founding-thread map series label (SSR)
      'amber and sapphire',                   // founding-thread note (SSR)
    ],
  },

  // ── /trust ───────────────────────────────────────────────────────────────────
  // Warm "Proving the Promise" version: four emoji commitments + the Guiding
  // Beacon boundaries. The WILL ALWAYS / WILL NEVER commitments and the formal
  // disclosure footer are checked by verify:disclosures / verify:customer-journey.
  {
    route: '/trust',
    forbidden: [
      'no bs, just facts',                    // Build 51 heading — must be gone
      'matter of equity',                     // old institutional draft phrasing
    ],
    required: [
      'proving the promise',                  // warm h1
      'a real person always makes the call',  // commitment 1
      'no big data piles',                    // commitment 2
      'nothing is secretly changed',          // commitment 3
      'free for borrowers, with zero bias',   // commitment 4
    ],
  },

  // ── /data-rights (Build 56: redirects to /trust#your-data) ───────────────────
  // /data-rights now 308-redirects into the merged Trust & Your Data page; this
  // fetch follows the redirect, so these tokens are asserted against the
  // #your-data section on /trust. The Furlong-bottom-line content is covered by
  // /trust's warm body + the shared <Disclosures>, so it is not a separate token.
  {
    route: '/data-rights',
    forbidden: [],
    required: [
      'in control of your information',       // h2: "You're in Control of Your Information"
      'keep a copy of your cargo',            // lighthouse opener
      'your five ultimate data rights',       // warm rights section heading
      'the honest truth about deletion',      // deletion section heading
    ],
  },

];

// ── HTML → visible text ───────────────────────────────────────────────────────

function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')                  // drop tags + all attributes
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // All apostrophe encodings — &#39; (decimal), &#x27; (hex), &apos;, &rsquo;
    .replace(/&#39;|&#x27;|&apos;|&rsquo;/g, "'")
    .replace(/['']/g, "'")                     // curly apostrophes → straight
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Normalize a search string the same way so curly apostrophes in the
// PAGES constant don't cause mismatches against the normalized HTML text.
function normalizeQuery(s) {
  return s
    .replace(/&#39;|&#x27;|&apos;|&rsquo;/g, "'")
    .replace(/['']/g, "'")
    .toLowerCase();
}

// ── Run ───────────────────────────────────────────────────────────────────────

let failed = false;

for (const p of PAGES) {
  let text;
  try {
    const res = await fetch(BASE + p.route);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    text = toText(await res.text());
  } catch (e) {
    console.error(`FAIL ${p.route}: could not load (${e.message}). Is the site running at ${BASE}?`);
    failed = true;
    continue;
  }

  const stillOld = p.forbidden.filter((s) => text.includes(normalizeQuery(s)));
  const missing   = p.required.filter((s)  => !text.includes(normalizeQuery(s)));

  if (stillOld.length || missing.length) {
    failed = true;
    console.error(`FAIL ${p.route}`);
    if (stillOld.length) console.error(`   old copy still present: ${stillOld.join(' | ')}`);
    if (missing.length)  console.error(`   approved copy missing:  ${missing.join(' | ')}`);
  } else {
    console.log(`PASS ${p.route} — approved copy present, old copy gone`);
  }
}

process.exit(failed ? 1 : 0);
