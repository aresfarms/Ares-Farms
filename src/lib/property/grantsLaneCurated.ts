/**
 * grantsLaneCurated — the Grants & Programs module content (founder direction
 * 2026-07-19). The federal/state grant programs a rural property or business
 * owner should know, in plain language: what each funds, who it's for, and the
 * catch (competitive, deadline-driven, matching funds, feasibility required).
 *
 * HONEST + NOT ADVICE: these are the programs' published facts, not a promise of
 * an award and not a determination. Grants are competitive; a program fitting a
 * project is not the same as winning it. Amounts/caps change by fiscal year —
 * always confirm the current NOFO/rule. Scanned by verify:brief-copy.
 */

export interface GrantBrief {
  id: string;
  program: string;
  question: string;
  answer: string;
  pointer: string;
  url?: string;
  /** The catch / thing people miss. */
  watch?: string;
}

export const GRANT_BRIEFS: GrantBrief[] = [
  {
    id: "reap",
    program: "USDA REAP",
    question: "REAP — help paying for renewable energy or efficiency upgrades",
    answer:
      "The Rural Energy for America Program gives grants (and guaranteed loans) to ag producers and rural " +
      "small businesses for renewable-energy systems (solar, wind, geothermal) and energy-efficiency " +
      "improvements. Grants can cover a large share of a project's cost, with the balance often financed. " +
      "It's one of the most useful programs for a farm or rural business cutting its energy bill.",
    pointer: "USDA Rural Development state energy coordinator; the current REAP NOFO (7 CFR 4280-B)",
    url: "https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvement-guaranteed-loans",
    watch:
      "It's competitive and scored — a technical report / energy audit and matching funds are usually required. " +
      "Start early; the application is not a weekend project.",
  },
  {
    id: "vapg",
    program: "USDA VAPG",
    question: "VAPG — turning a raw commodity into a higher-value product",
    answer:
      "The Value-Added Producer Grant helps agricultural producers who process or brand their product to earn " +
      "more from it (e.g., milk → cheese, grain → flour, fruit → jam). There are planning grants (for a " +
      "feasibility study / business plan) and working-capital grants (for the launch). It rewards moving up " +
      "the value chain rather than selling the raw commodity.",
    pointer: "USDA Rural Development state office; the current VAPG NOFO",
    url: "https://www.rd.usda.gov/programs-services/business-programs/value-added-producer-grants",
    watch:
      "It's a reimbursement-style match — you generally put up matching funds, and a feasibility study / business " +
      "plan is typically required to apply.",
  },
  {
    id: "community-facilities",
    program: "USDA Community Facilities",
    question: "Community Facilities — grants + loans for essential rural facilities",
    answer:
      "The Community Facilities program funds essential facilities in rural areas — health clinics, public " +
      "safety, schools, childcare, community buildings — through a mix of low-interest loans and grants. It's " +
      "aimed at public bodies, nonprofits, and tribes serving rural communities, not private business.",
    pointer: "USDA Rural Development state office; the Community Facilities program page",
    url: "https://www.rd.usda.gov/programs-services/community-facilities",
  },
  {
    id: "rbdg",
    program: "USDA RBDG",
    question: "RBDG — small grants that help small rural businesses grow",
    answer:
      "The Rural Business Development Grant supports small and emerging rural businesses through an " +
      "intermediary (a town, tribe, nonprofit, or co-op) — for training, technical assistance, equipment, or " +
      "feasibility work. The grant goes to the intermediary, which uses it to help local businesses.",
    pointer: "USDA Rural Development state office; a local economic-development intermediary",
    url: "https://www.rd.usda.gov/programs-services/business-programs/rural-business-development-grants",
  },
  {
    id: "feasibility",
    program: "Feasibility studies",
    question: "Why so many grants ask for a feasibility study first",
    answer:
      "Programs like VAPG and REAP want proof the project pencils out before they fund it — a feasibility study " +
      "or technical report that shows the market, the numbers, and the engineering hold up. A strong, " +
      "independent study is often what separates a funded application from a rejected one. This is exactly the " +
      "kind of work Furlong's licensed professionals can prepare.",
    pointer: "A qualified independent consultant; the program's specific study requirements in its NOFO",
    watch:
      "Consultants charge real money for these ($4,900 and up, by scope) — but a program that requires one and " +
      "doesn't get a credible one simply doesn't get funded.",
  },
  {
    id: "state-local",
    program: "State & local programs",
    question: "Don't forget state and local incentives",
    answer:
      "Beyond the federal programs, states, counties, and utilities run their own grants, tax credits, and " +
      "cost-share programs — agricultural, energy, historic-preservation, brownfield/cleanup, and small-business. " +
      "They're scattered and change often, which is exactly why they get missed. It's worth a check with your " +
      "state ag department, energy office, and economic-development agency for what stacks with a federal grant.",
    pointer: "Your state department of agriculture, state energy office, and economic-development agency",
  },
];

export const GRANTS_NOTE =
  "This is an educational overview of programs, not a promise of an award and not application advice. Grants are " +
  "competitive and deadline-driven, amounts and rules change each fiscal year, and eligibility depends on the " +
  "specific program's current notice of funding (NOFO). Always confirm the current terms with the administering " +
  "agency before you rely on anything here.";
