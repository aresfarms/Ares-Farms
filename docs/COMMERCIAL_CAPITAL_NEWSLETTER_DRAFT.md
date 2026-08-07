# The Capital Brief — Commercial & Ag Financing Newsletter (DRAFT)

**Status: DRAFT for Stuart's review (compliance gate #34). Not published.**
Modeled on Stuart's own Five Borough Capital commercial-mortgage newsletter
(supplied 2026-07-20) and adapted to Furlong's voice + governance:

- **Facts + education, never advice or a quote.** Rate figures are *illustrative
  current ranges*, labeled as such, and the platform's live public-rates block
  (`CapitalRatesBlock`) is the moving source of truth.
- **Routes to the licensed lender's desk through Furlong** — no personal cell,
  name, or credential published on the public portal (safety + governance rule).
  Stuart's own client/referral copy keeps his direct contact; the *portal* edition
  does not.
- **No proprietary matrix published verbatim.** The lender-matrix concept is
  generalized to program structure, not Five Borough's private term sheet.

Everything below is a template Stuart edits each month — the numbers, the market
read, and the "university" topic are his to set.

---

## MONTHLY EDITION — template

### 1. Market pulse *(Stuart writes 2–4 sentences)*
> *Example structure (replace with the month's read):* A strong jobs print with
> stable unemployment, and Treasury yields easing off year-to-date highs, is the
> market's way of saying the current shock isn't a long-term drag — which points
> to an extended window of a workable commercial real-estate market.

**Good news / Not-so-good news** — the two-line rate outlook Stuart's readers open
for. Frame the "if you were banking on a cut" reality without predicting the Fed:
> *Example:* The path had leaned toward cuts later in 2026; the more likely read
> now is rates *holding* near current levels. Plan around "steady," not "lower."

*(A 7-year rate-history chart goes here — Stuart supplies the image.)*

### 2. The standout: 100% financing most people don't know exists
The single most valuable thing to teach a referral network — how an owner can add
a property with **zero down payment**:

- **USDA Business & Industry** offers long-term fixed-rate financing for
  **owner-occupied** commercial real estate up to **100% LTV** — and it is **not
  just for farms**. A large majority of the U.S. map is USDA-eligible, and typical
  fundings include hotels, gas stations, and industrial assets. *(Confirm any
  address on the USDA eligibility map — link in the edition.)*
- This is the tool for a hard-to-move listing or an owner who wants to expand but
  hasn't saved a traditional down payment.

> Furlong framing: we state the program structure as a published fact and route
> "does my deal and address actually qualify" to the licensed lender — the agency
> and lender decide eligibility, never the newsletter.

### 3. Current rate ranges *(illustrative — Stuart updates monthly)*
> Labeled **illustrative, past ~30 days**, by capital source. The live figures on
> the platform's rates block are the real-time reference; this table is a monthly
> snapshot for context, not a quote.

| Capital source | Range (low–high) |
|---|---|
| Bank | 5.4%–7.1% |
| Insurance company | 5.3%–6.7% |
| Credit union | 5.4%–6.6% |
| Family office | 5.0%–7.8% |
| CMBS | 5.2%–6.3% |
| SBA / USDA | 6.7%–8.9% |

*(Property types the ranges span: industrial, multifamily, retail, NNN, office,
hospitality, special purpose. Values above are example placeholders from the
2026 sample newsletter — Stuart replaces them each month.)*

### 4. How commercial capital is structured *(generalized — not a private term sheet)*
Rather than publish a proprietary lender matrix, the portal edition teaches the
*shape* of a commercial financing:

- **Loan size:** small-balance (~$350K) up to institutional ($250M+).
- **Leverage:** commonly up to ~80% conventional; **90% for SBA/USDA**.
- **Term / amortization:** 2–10 year terms, amortized over 15–30 years.
- **Coverage:** lenders size to the property's **DSCR** (typically ≥1.10x), not
  the borrower's paycheck — see the university note below.
- **Recourse:** both recourse and non-recourse structures exist.

### 5. Commercial Mortgage University *(Stuart's evergreen teaching slot)*
The one distinction that sets an advisor apart with clients and referral partners:

> **Residential underwriting looks at the borrower** (the person's global
> debt-to-income). **Commercial underwriting looks at the building** (the
> property's debt-service coverage). A well-paid W-2 buyer purchasing a 4-family
> usually gets maximum LTV; that same buyer on a 6-family with weak financials
> only qualifies for what the building's **DSCR** supports. Get the rent roll and
> the annual expenses, and you can size the maximum loan the property will carry.

*(Rotate the topic monthly: prepayment structures, SBA 504 vs 7(a) fit, bridge-to-
perm, USDA B&I eligibility, cap rates and value, etc.)*

### 6. Close + route to the desk
> If you've got a deal you can't find a home for, bring it in. Furlong carries the
> property's verified place-facts, cost model, and program fit straight into the
> licensed lender's file — nothing re-keyed — and the lender takes it from there.

**CTA (portal edition):** "Send your deal to the licensed lender's desk →"
(the platform's financing intake). No personal phone/name on the portal version.

---

## Governance checklist before this goes live
- [ ] Stuart reviews + sets the month's market read, rates, and university topic (#34).
- [ ] Confirm "illustrative rates" labeling + link to the live rates block.
- [ ] Confirm no personal contact/credential on the *portal* edition.
- [ ] Fair-housing: commercial focus, but keep any owner-occupied/residential
      crossovers free of steering language (runs through `verify:brief-copy`).
- [ ] Decide branding on the portal edition (Furlong "Capital Brief" vs. Stuart's
      Five Borough masthead) — founder/counsel call.

Once approved, this becomes the **`finance` audience monthly edition** in the
newsletter composer (`newsletterEditions.ts`) — wired the same way as the farm,
commercial, and residential editions.
