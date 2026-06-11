// scripts/verifySingleNav.mjs — Build 55
//
// Gate: homepage must render EXACTLY ONE site-navigation landmark.
// Two headers is the failure mode caught here. One missing nav is equally a failure.
//
// What it checks:
//   N01  Homepage HTML contains exactly one aria-label="Furlong" nav landmark.
//        (PublicSiteHeader renders <nav aria-label="Furlong">. If PlatformChrome
//        and PublicSiteLayout both render PublicSiteHeader, this count becomes 2.)
//
// Run with dev server or served build up:
//   npm run dev &
//   node scripts/verifySingleNav.mjs
//   npm run verify:single-nav       (expects server at localhost:3000)
//
// "The map reveals opportunities, not the visitor."
// Public Alpha remains PENDING.

const BASE = process.env.BASE || 'http://localhost:3000';
const ROUTE = '/';

let html;
try {
  const res = await fetch(BASE + ROUTE);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  html = await res.text();
} catch (e) {
  console.error(`FAIL  N01  Could not load ${BASE}${ROUTE}: ${e.message}`);
  console.error(`      Is the dev server running? Run \`npm run dev\` in another tab.`);
  process.exit(1);
}

// Count the number of site-navigation landmarks.
// PublicSiteHeader renders: <nav aria-label="Furlong"
// This string is the unique fingerprint of the site nav component.
const NAV_MARKER = 'aria-label="Furlong"';
const count = (html.match(/aria-label="Furlong"/g) || []).length;

const line = '─'.repeat(70);

if (count === 1) {
  console.log(`PASS  N01  Homepage has exactly one "${NAV_MARKER}" nav (count=${count})`);
  console.log(line);
  console.log('✓  verify:single-nav PASS — one site navigation landmark on the homepage.');
  process.exit(0);
} else if (count === 0) {
  console.error(`FAIL  N01  Homepage has ZERO site navigation landmarks (${NAV_MARKER} not found).`);
  console.error(`      PublicSiteLayout / PublicSiteHeader may not be rendering on this route.`);
  console.log(line);
  console.error('✗  verify:single-nav FAIL');
  process.exit(1);
} else {
  console.error(`FAIL  N01  Homepage has ${count} site navigation landmarks — expected exactly 1.`);
  console.error(`      Likely cause: PlatformChrome AND PublicSiteLayout both render PublicSiteHeader.`);
  console.error(`      Fix: PlatformChrome must return null for public routes.`);
  console.log(line);
  console.error('✗  verify:single-nav FAIL — duplicate site navigation detected.');
  process.exit(1);
}
