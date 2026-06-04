# Furlong — Public Alpha Definition

**Status:** PROPOSED — requires sign-off by named governance authority before any external admission.
**Checkpoint context:** `BR-2026-06-01-M41`, review-bound, live-fetch = 0.
**Purpose:** the single authoritative statement of what Public Alpha *is* — so "required vs optional" module questions become answerable and the Module 42 self-report gate has criteria to enforce.

---

## 1. Definition (one sentence)

> **Public Alpha is a closed, invitation-only release in which a limited set of real external users exercise the application-intake and advisory surfaces with a human in the loop at every decision point — with no payments, no live external/regulated actions, no official determinations, and no regulated reliance.**

It is the first release where people *outside* the build team touch the platform. It is **not** production, **not** go-live, and confers **no** official or legal reliance. Furlong's constitutional posture holds unchanged: *we facilitate, we do not decide.*

---

## 2. Who is admitted (audience scope)

- **Invited borrowers / farmers** — submit applications and documents, use advisory surfaces. Free, as per doctrine.
- **A small number of partnered lenders / agencies** — receive routed files **in a non-binding review capacity** (no live credit decision is relied upon during Alpha).
- **Internal operators** — full human-in-loop oversight (Module 05 Reviews).
- **Explicitly excluded in Alpha:** the open public, federal regulators relying on output, capital partners acting on commitments, grant offices issuing authorizations.

Admission is by explicit invite + signed Alpha participation terms stating the no-reliance, advisory nature.

---

## 3. What is ON in Alpha

| Capability | Module(s) | Constraint |
|---|---|---|
| Application intake | 03 applications | Real submissions accepted; human-reviewed |
| Document intake | 04 documents | Upload + completeness check only |
| Field/overlay completeness checks | 06 rules | Advisory completeness only — never eligibility |
| Human review & transition | 05 reviews | Mandatory at every decision point |
| In-app notices / status | 08 notices | **In-app only** — no external send |
| Advisory program/opportunity surfacing | revenue-intel + program graph | Clearly labeled advisory; surfaces candidates, never determines |
| Data accounting / portability | 19 data-rights | Borrower can see/export what's held |
| Append-only audit + replay | 09 audit-replay | The trust spine — must verify intact |
| Advisory export | 13 reports | Watermarked advisory, not official |
| Governance runtime + promotion gate | 01, 14 | Keeps all blocks enforced |

## 4. What stays OFF in Alpha (must remain blocked)

Payment capture · borrower **external** notice sending · official determinations / approvals / adverse-action issuance · official report publication · public verification · official or regulatory reliance · legal advice · **live scraper / live fetch (count stays 0)** · live external actions · DNS cutover · production DB migrations · public production API exposure · open (non-invited) signup · regulatory examination submission / response.

These map 1:1 to the KNOWN BLOCKS list and must read `PASS` (enforced) or `BLOCKED_BY_DESIGN` in the Module 42 self-report throughout Alpha.

---

## 5. Data & trust posture during Alpha

- **Real PII enters the system** for the first time → minimal-disclosure / redaction (`pii_redaction`) and federated retention must be verified **before** admission, not after.
- Every advisory output must be **lineage-traceable** to a governed source.
- Audit hash-chain must verify end-to-end (`audit_chain_intact = PASS`).
- Offline-first sync must work (core customer promise) — submit offline, sync on reconnect, nothing lost.

---

## 6. Entry criteria (all must hold to START Alpha)

1. Module 42 self-report exit code = **0** for the Alpha-required module set (§3).
2. **Module 44 (Disclosure Audit)** green: every ON surface carries advisory-only / no-approval / no-guarantee / no-reliance / no-public-verification disclosures.
3. **Module 45 (Human Authority)**: every decision point in the ON set has a named credentialed clearing role; no path clears without a human.
4. `claims_controls` = PASS against the prohibited-claims corpus on all customer-facing surfaces.
5. `pii_redaction` = PASS; `audit_chain_intact` = PASS; `live_fetch_enabled` = 0.
6. The **3 awaiting-promotion requirements** are enumerated and confirmed **not** required for the Alpha set (or resolved).
7. Tree committed + tagged; sensitive files ignored; DR restore tested.
8. Signed Alpha participation terms in place for every external participant.

## 7. Exit criteria (what ends Alpha → next phase)

Alpha is **complete** (not "go-live") when:

1. Target invited cohort has run end-to-end intake→review→advisory output with **zero** reliance incidents and **zero** block bypasses recorded in audit.
2. Self-report holds exit code 0 across the full Alpha set for a sustained window (define duration, e.g. 30 days).
3. Functional/e2e coverage added for the ON modules (Alpha must close the smoke-only gap before any production conversation).
4. All Alpha-surfaced defects triaged; no open FAIL in `route_loads`, `replay_reproduces`, `pii_redaction`, `claims_controls`, `blocks_enforced`.
5. A decision is recorded by the named governance authority on whether to proceed toward the production gate chain (Modules 27–41) — Alpha exit does **not** auto-authorize production.

---

## 8. How this feeds the Module 42 self-report

- The §3 ON list defines which modules the self-report gate evaluates as **Alpha-required**; FAIL on any blocks Alpha start.
- The §4 OFF list defines the `blocks_enforced` assertions; any bypass = FAIL = Alpha halt.
- The §6 entry criteria become the **gate's exit-code 0 condition** for the Alpha profile.
- Everything in §3 of the Interrogation Framework's "optional after Alpha" (production/regulatory/live-source chain, Modules 22–26 and 27–41) is **excluded** from the Alpha gate and must read `BLOCKED_BY_DESIGN`, not FAIL.

---

## 9. Open decisions for sign-off

1. **Sustained-window duration** for exit criterion 2 (proposed: 30 days).
2. **Cohort size** — how many borrowers / how many partner lenders.
3. Whether **Module 21 (environmental-compliance)** is a featured Alpha workflow or deferred.
4. Whether **Module 10 (connectors)** must be live (only if Alpha integrates a real lender system vs. simulated review).
5. Named **governance authority** who signs Alpha entry and exit.

> Once §9 is decided, this becomes the canonical Alpha profile the build and the self-report enforce against.
