# Module 23 Evidence Packet — Statewide Parcel / Assessment Sources

**Prepared:** 2026-08-06. **For:** founder review under
`MODULE_23_SOURCE_LEGAL_LICENSING_REVIEW_GATE.md`.

**Why this exists.** Property type (farm vs commercial vs residential) drives
which financing lanes, costs, and questions a customer sees. Where no public
record names the type, the portal must ask the customer. Expanding automatic
typing means activating more county/state assessment sources — and every
source activation is gated behind Module 23, which requires recorded review of
each source's terms BEFORE it goes live.

**What was done.** Thirteen states' statewide parcel services were researched
and every endpoint below was **fetched live and anonymously** (`?f=json`) to
confirm it responds; field lists are copied from live layer metadata, not from
documentation. License text is quoted from the authoritative source.

**What this is not.** This is review evidence, not legal advice. Module 23's
own rule stands: nothing activates until a founder with `approve:source-legal`
records an approval.

---

## The bottom line

| Verdict | States | Property-type field? |
|---|---|---|
| **PERMISSIVE — recommended for approval** | North Carolina, New Jersey, Ohio, Indiana, Wisconsin, Minnesota | **Yes, all six** |
| **PERMISSIVE but no type data** | Delaware | No — geometry + PIN only |
| **NEEDS REVIEW — do not activate** | Virginia, Pennsylvania, West Virginia, Nebraska | VA/PA/WV no; NE yes (best ag fields, worst license) |
| **NO USABLE STATEWIDE SERVICE** | Iowa, Kansas | — |

**The convenient alignment:** the states that are cleanest legally are largely
the same states whose data actually carries a land-use field. Approving the
six-state green pile buys real automatic property typing, not just coverage.

---

## GREEN PILE — recommended for approval

Each entry: verified endpoint · quoted license · property-type field.

### North Carolina — strongest terms of any state reviewed
- **Endpoint (200 OK):** `https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/MapServer`
  (layer 1 = polygons; `/secure/` in the path is a naming artifact — **no token
  required**, anonymous access confirmed). maxRecordCount 5000.
- **License** (`https://www.nconemap.gov/pages/terms`): *"all partner
  organizations understand this free and unrestricted use policy"*; *"Written
  release agreements… are not required and will not be issued"*; *"Any sale of
  this data must not violate applicable state laws or regulations."*
  Attribution is a **requested citation, not a condition**.
- **Type field:** `parusecode` / `parusedesc` (+ secondary codes). Also owner
  name, assessed value, sale data, acreage.
- **Caveat:** use codes are county-native (Wake's `RHS`, `VAC`), so
  cross-county logic needs a mapping table.

### New Jersey — richest attributes
- **Endpoint (200 OK):** `https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_Composite_NJ_WM/FeatureServer`
  (layer 0 `Cad_parcel_mod4`). *Not* `maps.nj.gov/.../Parcels_NJ` — that one
  responds but carries no attributes.
- **License** (NJOGIS item + `https://www.nj.gov/nj/legal.shtml` §F):
  *"anyone may view, copy or distribute State information found here without
  obligation to the State"*; acknowledgement of NJOGIS is *"requested."*
- **Type field:** `PROP_CLASS`, `PROP_USE`, `BLDG_CLASS`, `BLDG_DESC`,
  `LAND_DESC`, plus values, acreage, sale price. Farmland class `3B` verified
  by live query.
- **PRIVACY FLAG:** `OWNER_NAME` is present in schema but **redacted to empty
  string** under **Daniel's Law**. Do not build anything expecting NJ owner
  names, and treat republication of NJ officials' home addresses as a real
  liability question.

### Ohio — best agricultural taxonomy
- **Endpoint (200 OK):** `https://services2.arcgis.com/MlJ0G8iWUyC7jAmu/arcgis/rest/services/OhioStatewidePacels_full_view/FeatureServer/0`
  (the typo "Pacels" is in the real URL).
- **License:** disclaimer-style — *"available for public use at the user's own
  risk and provided for informational purposes only."* Attribution: OGRIP.
  **No explicit redistribution clause** (see caution below).
- **Type field:** `StateLUC`, human-readable and ag-granular — live-queried
  values include `100 Agr-Vacant Land`, `101 Agr-Cash-Grain Farm`,
  `102 Agr-Livestock Farm`, `103 Agr-Dairy Farm`, `104 Agr-Poultry Farm`,
  `110–117 Agr-CAUV-*`, `120–124 Agr-Timber/Forest`.

### Indiana — most explicit grant
- **Endpoint (200 OK):** `https://gisdata.in.gov/server/rest/services/Hosted/Parcel_Boundaries_of_Indiana_Current/FeatureServer/0`
- **License:** *"It is requested, but not required, that the Indiana GIS Data
  Harvest Program be cited in any products generated from this data set."*
  The phrase **"any products generated from this data set"** explicitly
  contemplates derived products — the clearest grant of the thirteen.
- **Type field:** `dlgf_prop_class_code` (Indiana's 100-series = agricultural).

### Wisconsin — affirmative public release
- **Endpoint (200 OK):** `https://services3.arcgis.com/n6uYoouQZW75n5WI/arcgis/rest/services/Wisconsin_Statewide_Parcels_DB/FeatureServer/0`
  ⚠️ the commonly-cited `.../Wisconsin_Statewide_Parcels/FeatureServer` is
  **dead** (`Invalid URL`). Query-only (no Extract); bulk file geodatabase is
  offered separately, so bulk acquisition is clearly contemplated.
- **License:** *"This data free for public consumption as of: 06/30/2026."*
  Attribution: WI State Cartographer's Office / Wisconsin Land Information
  Program.
- **Type field:** `PROPCLASS` + `AUXCLASS`. **Parsing note:** `PROPCLASS` is
  comma-delimited multi-value (real values: `1,2,4,5,5M`). Class 4 =
  Agricultural, 5M = Ag Forest, 6 = Productive Forest. Also `ASSDACRES`.

### Minnesota — only statutory public-domain basis
- **Endpoint (200 OK):** `https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_mngeo/plan_parcels_open/FeatureServer`
  (layer 1). Metro counties additionally via MetroGIS.
- **License:** MnGeo asserts no restrictions; MetroGIS states it outright —
  *"This dataset is public domain under the Minnesota Government Data
  Practices Act (Minnesota Statutes Chapter 13)."* A **statute**, not a
  disclaimer.
- **Type field:** 103 fields incl. `useclass1`–`4`, `dwell_type`, `home_style`,
  and ag-specific `ag_preserv`, `agpre_enrd`, `agpre_expd`, `green_acre`.
- **Coverage caveat:** opt-in, roughly **56 of 87 counties** — not true
  statewide.

### Delaware — permissive, but no type data
- **Endpoint (200 OK):** `https://hosting.firstmap.delaware.gov/hosting/rest/services/PlanningCadastre/DE_StateParcels_SP_Public/FeatureServer`
- **License:** liability disclaimer only; it *presupposes* redistribution
  ("your downloading, modifying, sharing, distributing, or using") without
  restricting it — but never affirmatively grants rights.
- **Type field:** **NONE.** Fields are `PIN, ACRES, COUNTY, UPDATED` only.
- **Practical note:** the portal already reads richer Sussex County data
  directly; the statewide layer adds coverage, not classification.

---

## AMBER PILE — do not activate without a decision

### Virginia — one sentence is the whole problem
- **Endpoint (200 OK):** `https://vginmaps.vdem.virginia.gov/arcgis/rest/services/VA_Base_Layers/VA_Parcels/FeatureServer`
  ⚠️ the widely-cited `gismaps.vita.virginia.gov` host is **dead (NXDOMAIN)** —
  VITA became VDEM.
- **Conflict:** the state open-data portal says *"No License Provided"*; the
  VGIN item carries an accuracy disclaimer; but the **VDOT-hosted item the
  live service resolves to** says *"VDOT's digital data files are for use in
  performing the official business of the Commonwealth of Virginia."*
  Read literally that excludes all non-government use.
- **Assessment:** almost certainly boilerplate mis-applied to a VGIN
  aggregate. **Cheapest available win: one email to VGIN** could move Virginia
  to green. Worth doing — VA matters for the VEDP listings work.
- Also: statewide attributes are PIN-only (no type), and Va. Code § 2.2-3704
  permits charging for GIS-derived records.

### Pennsylvania — terms are fine; the data isn't
- **Endpoint (200 OK):** `https://apps.pasda.psu.edu/arcgis/rest/services/PA_Parcels/MapServer`
- **License** (PASDA FGDC metadata): Access Constraints **None**; use
  constraints are indemnification + "as is" only.
- ⚠️ **Misattribution to correct:** the harsh *"Reproduction or redistribution
  … expressly forbidden"* language circulating in search results governs
  **PAMAP imagery, not parcels.** Do not accept it as a reason PA is closed.
- **Real blocker:** PASDA itself says the dataset *"is incomplete"*, the layer
  carries **zero attributes** beyond a PIN, and PA's 67 counties are
  autonomous — so any real product means 67 sets of terms. That heterogeneity
  is the gate.

### West Virginia — adverse copyright notice
- **Endpoint (200 OK):** `https://services.wvgis.wvu.edu/arcgis/rest/services/Planning_Cadastre/WV_Parcels/MapServer`
  ⚠️ the circulating `gis.transportation.wv.gov/.../Economic/FeatureServer/5`
  is wrong — **layer 5 does not exist**; layer 7 is DOT right-of-way.
- **License:** none published. `licenseInfo` empty; page footer asserts
  **"Copyright © 2026 West Virginia GIS Technical Center, all rights
  reserved."** WV also **charges** for tax map products (Administrative Notice
  2017-19), which makes an implied license harder to assume.
- **Type field:** not in the service (owner + legal description yes; land use
  lives in a separate joinable table).

### Nebraska — best farm data, worst license language
- **Endpoint (200 OK):** `https://gis.ne.gov/Enterprise/rest/services/StatewideParcelsExternal/FeatureServer/0`
  (the `giscat.ne.gov` host in search results 404s).
- **License:** *"This information is for general use and analysis **within the
  state**"*; service metadata: *"compiled … for official, **internal use by
  the State of Nebraska**."*
- **Type field — the best of all thirteen:** `Classification_Code`,
  `Property_SubClass`, `Property_Parcel_Type`, `Zoning`, **`Ag_Land_Value`**,
  **`Irrigation_Type`**.
- **Assessment:** genuinely painful trade-off. Do **not** treat as approved.

### Iowa / Kansas — nothing to approve
- **Iowa:** no current statewide service. The only statewide layer is an
  **8-year-old 2017 snapshot** whose own metadata warns *"These data are not
  current."* County-by-county otherwise (Polk County verified live).
- **Kansas:** no statewide parcel product. Access runs through **ORKA**, a
  county-gated viewer with **12 counties password-restricted**. Johnson
  County's public service was enumerated in full and deliberately contains no
  parcel layer.

---

## Honest caveats before any approval

1. **"Permissive" here means "no prohibition found," not "redistribution
   expressly granted."** Only **Indiana** explicitly contemplates derived
   products, and only **Minnesota** rests on a statute. Ohio, Wisconsin, NC,
   NJ and Delaware publish disclaimers plus public-use language — good, but if
   the portal ever republishes parcel **geometry or owner names**
   commercially, get those in writing rather than relying on silence.
2. **Owner names are a separate question from the GIS license.** NC and WV
   expose them; NJ redacts under Daniel's Law. The portal's current use —
   reading a land-use code to classify a property — touches none of this, and
   staying inside that narrow use is the lowest-risk path by a wide margin.
3. **None of the thirteen publish rate limits or anti-automation terms.** All
   are standard Esri services with maxRecordCount 1000–5000, so pagination is
   a technical requirement, not a legal permission.
4. **Three endpoints in circulation are wrong** and should never be coded
   against: `gismaps.vita.virginia.gov` (dead), WV `Economic/.../5` (no such
   layer), and the old Wisconsin parcels URL (invalid).

---

## Recommended founder action

**Approve the six green states for the NARROW use of reading a land-use /
property-class code to classify a property type** — North Carolina, New
Jersey, Ohio, Indiana, Wisconsin, Minnesota. That is the use the portal
actually needs, it avoids every owner-name and republication question, and all
six carry the field.

**Hold** Virginia (pending one clarifying email to VGIN), Pennsylvania, West
Virginia, and Nebraska. **Skip** Iowa and Kansas until they publish something.

Delaware may be approved for coverage, but note it cannot classify anything on
its own.

---

# PART II — National sources (fills the gaps where states are amber or absent)

State-by-state activation is slow and leaves holes (Iowa and Kansas have
nothing; Virginia, Pennsylvania, West Virginia and Nebraska are on hold). Two
FREE federal sources cover the whole country and were verified live.

## RECOMMENDED — FEMA / ORNL **USA Structures** ⭐ the only free source that goes address → occupancy

- **Coverage:** 135,321,228 building footprints, US + territories (buildings
  over 450 sq ft).
- **Fields:** `occ_cls` (Residential / Commercial / Industrial / **Agriculture**
  / Government / Education / Assembly), `prim_occ` (Single Family Dwelling,
  Manufactured Home, Retail Trade, **Agriculture**…), plus `prop_addr`,
  `prop_city`, `prop_st`, `prop_zip`. **96.9% of records carry a street
  address.**
- **Endpoint (verified, per-point query works):**
  `https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/USA_Structures_View/FeatureServer/0/query`
- **Honesty requirements — non-negotiable if we use this:**
  - It is **modeled, not observed** — built by conflating 57 HIFLD layers,
    commercial parcel data, Census block housing percentages and a machine
    classifier. Published validation is **residential-vs-nonresidential only**
    (~92–95%). **No accuracy was ever published for the Agriculture or
    Commercial subclasses.** Imagery vintage on sampled records: 2019–2020.
  - **Observed failure:** at an Iowa farmstead the service returned two
    buildings, **both** labeled Residential / Single Family Dwelling — one is
    near-certainly an outbuilding. It also does not handle multi-address
    structures (townhouses, strip malls).
- **COUNSEL ITEM:** FEMA distributes openly and the method paper is CC BY 4.0,
  but the classification was built partly from **licensed LightBox parcel
  data**. Confirm the distributed product's terms before redistributing the
  attributes downstream — do not rely on the paper's CC BY alone.

## RECOMMENDED — USDA **Cropland Data Layer** — cleanest license in this document

- **License:** NASS states verbatim that CDL is *"considered public domain and
  free to redistribute."* Commercial use fine. Nothing else reviewed here is
  this clean.
- **Resolution:** 10 m from 2024 forward (30 m before); CONUS annual since 2008.
- **Endpoint (verified live) — note it requires Albers EPSG:5070 metres, NOT
  lat/lon (lat/lon returns HTTP 500):**
  `https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLValue?year=2024&x=…&y=…`
  → `{value: 1, category: "Corn"}`. GMU-hosted, best-effort, **no SLA**.
- **What it can and cannot say:** crop classes (Corn, Soybeans) are strong
  evidence of active farming. But `176 Grass/Pasture` and `181 Pasture/Hay`
  cannot distinguish a grazing operation from an unmanaged field or a mowed
  verge, and a rural house with a big lawn lands in `121 Developed/Open Space`
  — the same class as parks and golf courses. **Never a
  commercial-vs-residential signal.** Overall crop accuracy 75–82%.

## OpenStreetMap — legally workable, factually thin; do NOT lead with it

- **The ODbL rule that matters:** a report shown to a customer is a **Produced
  Work** — share-alike does **not** attach to it, attribution only. **But**
  ODbL §4.4 says a Derivative Database is "Publicly Used" *if a Produced Work
  created from it is Publicly Used* — so a **cached national table** of
  OSM-derived property types would itself have to be ODbL-licensed and, under
  §4.6, **offered for free download**. Share-alike never reaches our report; it
  reaches the pipeline table behind it.
- **Two clean routes if we ever use it:** keep any OSM-derived layer as a
  **separate (Collective) database**, never merged into proprietary tables; or
  stay inside the OSMF **geocoding guideline**, which treats individual
  per-address lookups as insubstantial extracts that may sit alongside
  proprietary data — **provided they are not systematically accumulated into a
  database.** Live, uncached, per-address only.
- **Why it's weak here anyway:** **79.37% of OSM buildings are untagged
  `building=yes`**, and US rural land-use polygons are sparse and
  inconsistently tagged. High-precision positives, near-worthless negatives —
  exactly backwards for rural work.
- **Operational limit:** the public Overpass instance guidance is under 10,000
  queries/day and it is explicitly **not an SLA**. Never back a customer-facing
  feature with `overpass-api.de`.

## Ruled out — with reasons (so these are not re-proposed later)

| Source | Why not |
|---|---|
| **USGS National Structures** | Emergency-response facilities only — no residence/barn/farm code at all. Rhode Island's layer is 71% cemeteries. |
| **Census MAF/TIGER** | MAF is Title 13 confidential forever. TIGER's farm landmark code exists but is unpopulated — **verified: Iowa has 0, Kansas 0, Virginia 0**. No residential class at all. |
| **FEMA NFIP claims** | Has occupancy codes but **no agricultural code**, and lat/lon is deliberately truncated to ~11 km — cannot be joined to an address. |
| **USACE NSI** | Self-described *"pseudo inventory… not an exact representation of reality"*; live query returned **two conflicting records at identical coordinates**; reported 17 agricultural buildings where USA Structures reported 4. |
| **USDA FSA Common Land Unit** | **Statutorily withdrawn** — §1619 of the 2008 Farm Bill bars USDA from releasing geospatial data about agricultural land or operations. Circulating "CLU shapefiles" are the pre-2008 release, ~18 years stale. **Any vendor selling "current CLU" is a legal red flag.** |
| **Microsoft Building Footprints** | Geometry + optional height only — **no use/type/occupancy field anywhere**. Cannot distinguish a barn from a house. (Note: the US repo is ODbL; the global repo is CDLA-Permissive — a commonly confused pair.) |
| **EPA FRS** | Only regulated facilities. Catches a large CAFO, misses a 200-acre row-crop farm. Positive-only signal, never a negative. |

## Paid upgrade path, if accuracy ever becomes revenue-critical

- **Regrid (Loveland)** — the only standardized nationwide answer: normalizes
  messy county codes into **LBCS** fields covering residential / commercial /
  industrial / **agricultural**. Published 2023 rates: **county $300–$800**,
  state $8k–$20k, national $50k–$135k, API $0.10–$0.28/record; 30-day free
  sandbox. EULA **explicitly permits displaying derived conclusions** to end
  users, **prohibits** resale/bulk redistribution and public display of
  assessment data, **requires per-page attribution**, and bars uploading data
  to third-party LLMs without permission.
- **ATTOM** — free trial key and a start-up plan exist; costs nothing to
  evaluate. (Estated is now ATTOM; the old cheap tier is gone.)
- **RentCast** — most permissive license of the paid set, but its
  `propertyType` has **no Agricultural or Commercial value** — a farm returns
  "Land" or "Single Family." Structurally cannot answer our question.
- **CoreLogic/Cotality, LightBox, Precisely, Datafiniti, Melissa** — enterprise
  quote-only; not realistic at this scale.

---

# CONSOLIDATED RECOMMENDATION

**Free, and it covers the whole country:**
1. **FEMA USA Structures** as the primary per-address signal (the only free
   source that goes address → occupancy class).
2. **USDA CDL** as an independent cross-check over the parcel footprint — it
   answers a genuinely different question ("is this land actively cropped")
   rather than echoing source 1, and its license is public domain.
3. **The six green states** (NC, NJ, OH, IN, WI, MN) as the highest-confidence
   layer where available — an actual assessor's classification beats any model.

**The design rule that keeps this honest:** treat **agreement between sources
as high confidence** and **disagreement as "we're not sure — please confirm."**
Given the observed Iowa farmstead misclassification, disagreement will be most
common on exactly the rural properties that matter most here. The picker must
survive as the honest fallback — it just stops being the default.

**Two items for counsel:** the LightBox-derived attribution inside FEMA USA
Structures, and a standing rule that any vendor selling "current USDA CLU" data
is a legal red flag.
