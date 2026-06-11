// scripts/verifyPublic.mjs
// ONE command that runs every public-site check and is red until they ALL pass.
// This is what stops "fixed one, broke another" — nothing can regress silently.
//
//   npm run verify:public            full run (includes build — slower)
//   FAST=1 npm run verify:public     skip tsc+build for a quick edit loop
//   the public-copy check needs the dev server up:  npm run dev  (in another tab)
//
// Add to package.json:  "verify:public": "node scripts/verifyPublic.mjs"

import { spawnSync } from 'node:child_process';

const FAST = !!process.env.FAST;

// [label, command, args, { slow?, needsServer? }]
const GATES = [
  ['type-check (tsc)',          'npx', ['tsc', '--noEmit'], { slow: true }],
  ['build',                     'npm', ['run', 'build'], { slow: true }],
  ['route isolation',           'npm', ['run', 'verify:public-reset-route-isolation']],
  ['surface conformance',       'npm', ['run', 'verify:public-surface-conformance']],
  ['disclosures',               'npm', ['run', 'verify:disclosures']],
  ['accessibility',             'npm', ['run', 'verify:accessibility']],
  ['customer journey',          'npm', ['run', 'verify:customer-journey']],
  ['journey image credits',     'npm', ['run', 'verify:journey-image-credits']],
  ['map photos wired',          'npm', ['run', 'verify:map-photos']],
  ['map render-swap (DOM)',     'npm', ['run', 'verify:render-swap'], { needsServer: true }],
  ['public no internal leak',   'npm', ['run', 'verify:public-no-internal-leak'], { needsServer: true }],
  ['internal auth (server)',    'npm', ['run', 'verify:internal-auth'], { needsServer: true }],
  ['property gates (src/priv/frame)', 'npm', ['run', 'verify:property'], { needsServer: true }],
  ['provider directory model',  'npm', ['run', 'verify:providers'], { needsServer: true }],
  ['single nav (no duplicate)', 'npm', ['run', 'verify:single-nav'], { needsServer: true }],
  ['no personal docs',          'npm', ['run', 'verify:no-personal-docs']],
  ['public copy (words)',       'npm', ['run', 'verify:public-copy'], { needsServer: true }],
];

const results = [];
for (const [label, cmd, args, opts = {}] of GATES) {
  if (FAST && opts.slow) { results.push([label, 'skip']); continue; }
  process.stdout.write(`running ${label} … `);
  const r = spawnSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  const ok = r.status === 0;
  console.log(ok ? 'PASS' : 'FAIL');
  if (!ok) {
    const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-8).join('\n');
    if (out) console.log(out.split('\n').map((l) => '    ' + l).join('\n'));
    if (opts.needsServer) console.log('    (is the dev server running? `npm run dev` in another tab)');
  }
  results.push([label, ok ? 'pass' : 'fail']);
}

console.log('\n──────── verify:public ────────');
for (const [label, status] of results) {
  const mark = status === 'pass' ? '✓' : status === 'skip' ? '–' : '✗';
  console.log(`  ${mark}  ${label}${status === 'skip' ? '  (skipped — FAST)' : ''}`);
}
const failed = results.filter(([, s]) => s === 'fail');
console.log('───────────────────────────────');
if (failed.length) {
  console.log(`NOT DONE — ${failed.length} failing: ${failed.map(([l]) => l).join(', ')}`);
  process.exit(1);
}
console.log(FAST ? 'Fast checks pass. Run the full `npm run verify:public` before committing.' : 'All public-site checks pass.');
process.exit(0);
