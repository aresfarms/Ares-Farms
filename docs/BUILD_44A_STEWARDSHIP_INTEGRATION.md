# Build 44-A — Furlong Stewardship Integration

**Doctrine:** `docs/DOCTRINE_FURLONG_STEWARDSHIP_V1.md`
**Type:** Content / UX / navigation. **No** change to governance rules, voting
state, Alpha status, or human-authority requirements. Public Alpha remains
PENDING; no founder votes recorded.

> **Branch dependency:** stacked on `build-45-customer-landing` (PR #39, the
> customer homepage) so the homepage stewardship section can be added. PR base =
> `build-45-customer-landing`. Merge #39 first, then this.

## What was built

| File | Role |
|---|---|
| `src/lib/stewardship/stewardshipRegistry.ts` | `StewardshipDomain` model + 3 domains (domains persist independently of current stewards), core language, doctrine rules, exploration→domain review mapping, language-violation detector. |
| `src/components/stewardship/StewardshipSection.tsx` | "Meet the Stewards Behind Furlong" homepage section (platform-first, after exploration/trust/discovery; not the hero). |
| `src/components/stewardship/StewardshipReview.tsx` | "Need help exploring further? …request stewardship review" block for exploration flows (after value; customer retains control). |
| `src/app/stewardship/page.tsx` | Public stewardship index (footer "Stewardship" link target). |
| `src/app/stewardship/[domainId]/page.tsx` | Steward profile pages ("Steward of …", pathways illuminated, questions explored, when human review is appropriate). |
| `src/scripts/verifyStewardship.ts` / `stewardshipSmokeTest.ts` | `verify:stewardship` + `smoke:stewardship` gates. |
| `docs/DOCTRINE_FURLONG_STEWARDSHIP_V1.md` | Canonical doctrine. |

Edits: homepage (`src/app/page.tsx`) renders `<StewardshipSection>` after trust +
adds the "Stewardship" footer link; `PlatformChrome` treats `/stewardship` and
profile routes as public (no internal chrome); npm scripts + CI steps added.

## Domains (persist independently of individuals)

Financing & Capital → Furlong Capital Desk · Environmental & Compliance → Caitlin Hudson
· Communications & Public Trust → Furlong Trust Desk. `profileRoute` derives from
`domainId`, so a steward change never moves a page. Environmental technical
review remains **held for Alpha** (CCR-2026-002).

## Constitutional posture

Stewards illuminate, they do not decide. No expert/guru/master/captain/
salesperson framing, no advisor-first positioning, no sales language, no
approval/guarantee/official-determination claims (enforced by
`verify:stewardship`). Platform remains the primary experience; no steward is
the homepage hero. Customer always retains control.

## Verification

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run smoke:stewardship` | PASS |
| `npm run verify:stewardship` | PASS (3 domains, 0 findings) |
| `npm run verify:no-personal-docs` | PASS |
| `npm run verify:disclosures` | PASS |
| `npm run verify:customer-journey` | PASS |
| `npm run smoke:claims-public` | PASS |
| `npm run build` | exit 0 |

## Acceptance

- [x] Homepage contains the stewardship section (after exploration/trust/discovery; not the hero).
- [x] Stewards appear as current stewards of persistent domains; each links to its profile page.
- [x] Exploration engine can route to stewardship review (registry mapping + `<StewardshipReview>`).
- [x] No founder-first homepage positioning; no sales language; no approval/guarantee language.
- [x] Platform remains the primary experience.
- [x] Stewardship domains persist independently from individuals.
- [x] Footer "Stewardship" placeholder link added (`/stewardship`).
- [x] Public Alpha remains PENDING. No founder votes recorded. No Alpha approval declared.
