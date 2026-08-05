"use client";

/**
 * ExploreDropdown — Homepage exploration entry point (Build 51).
 *
 * Client component so onChange can navigate to the onboarding flow.
 * Renders a visible <label> + <select> pair with no submit button.
 * On option selection, routes immediately to /onboarding?explore=<slug>.
 *
 * Accessibility: visible <label htmlFor> paired with id= on <select>.
 * Privacy: no visitor tracking; slug is a category choice, not identity.
 * The map reveals opportunities, not the visitor.
 *
 * Public Alpha remains PENDING.
 */

const EXPLORE_OPTIONS = [
  { slug: "farms-agriculture",         label: "Farms, Agriculture & Land" },
  { slug: "small-business-growth",     label: "Commercial Properties" },
  { slug: "environmental-compliance",  label: "Environmental & Compliance" },
  { slug: "financing-capital",         label: "Financing & Capital" },
  { slug: "housing-development",       label: "Newsletters & Podcasts" },
  { slug: "programs-incentives",       label: "Grants & State and Federal Programs" },
  { slug: "not-sure",                  label: "Taxes, Accounting & Regulations" },
] as const;

export function ExploreDropdown() {
  return (
    <div className="fl-explore-form">
      <label
        htmlFor="homepage-explore-select"
        className="fl-explore-label"
      >
        Choose a starting point
      </label>
      <select
        id="homepage-explore-select"
        className="fl-explore-select"
        defaultValue=""
        style={{ minHeight: 50 }}
        onChange={(e) => {
          if (e.target.value) {
            window.location.href =
              `/onboarding?explore=${encodeURIComponent(e.target.value)}`;
          }
        }}
      >
        <option value="" disabled>Select a topic to explore…</option>
        {EXPLORE_OPTIONS.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
