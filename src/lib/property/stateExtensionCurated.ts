/**
 * stateExtensionCurated — the land-grant cooperative-extension system, by
 * state (founder request 2026-07-29: the Education tab promises "extension
 * programs"; this is the fact behind that promise).
 *
 * Every state operates a cooperative-extension service through its 1862
 * land-grant university (many states run a second through an 1890
 * institution). County offices provide agronomy help, soil-test intake, 4-H,
 * pesticide certification, and farm business education — usually free or
 * near-free. Institution names are stable public facts; we deliberately do
 * NOT curate 50 deep-links that rot — the USDA NIFA partner directory is the
 * authoritative pointer, and a name search reaches any county office.
 */

export interface StateExtension {
  /** 1862 land-grant institution operating the statewide system. */
  institution: string;
  /** The extension system's public name. */
  extensionName: string;
}

export const STATE_EXTENSION_PROVENANCE = {
  source: "USDA NIFA land-grant university partner directory",
  url: "https://www.nifa.usda.gov/about-nifa/how-we-work/partnerships/land-grant-colleges-universities",
  asOf: "2026-07-29",
} as const;

export const STATE_EXTENSION: Record<string, StateExtension> = {
  AL: { institution: "Auburn University", extensionName: "Alabama Cooperative Extension System" },
  AK: { institution: "University of Alaska Fairbanks", extensionName: "Cooperative Extension Service" },
  AZ: { institution: "University of Arizona", extensionName: "Arizona Cooperative Extension" },
  AR: { institution: "University of Arkansas", extensionName: "Cooperative Extension Service" },
  CA: { institution: "University of California", extensionName: "UC Agriculture and Natural Resources" },
  CO: { institution: "Colorado State University", extensionName: "CSU Extension" },
  CT: { institution: "University of Connecticut", extensionName: "UConn Extension" },
  DE: { institution: "University of Delaware", extensionName: "UD Cooperative Extension" },
  FL: { institution: "University of Florida", extensionName: "UF/IFAS Extension" },
  GA: { institution: "University of Georgia", extensionName: "UGA Extension" },
  HI: { institution: "University of Hawaiʻi at Mānoa", extensionName: "CTAHR Cooperative Extension" },
  ID: { institution: "University of Idaho", extensionName: "University of Idaho Extension" },
  IL: { institution: "University of Illinois", extensionName: "Illinois Extension" },
  IN: { institution: "Purdue University", extensionName: "Purdue Extension" },
  IA: { institution: "Iowa State University", extensionName: "ISU Extension and Outreach" },
  KS: { institution: "Kansas State University", extensionName: "K-State Research and Extension" },
  KY: { institution: "University of Kentucky", extensionName: "UK Cooperative Extension Service" },
  LA: { institution: "Louisiana State University", extensionName: "LSU AgCenter" },
  ME: { institution: "University of Maine", extensionName: "UMaine Cooperative Extension" },
  MD: { institution: "University of Maryland", extensionName: "University of Maryland Extension" },
  MA: { institution: "University of Massachusetts Amherst", extensionName: "UMass Extension" },
  MI: { institution: "Michigan State University", extensionName: "MSU Extension" },
  MN: { institution: "University of Minnesota", extensionName: "UMN Extension" },
  MS: { institution: "Mississippi State University", extensionName: "MSU Extension Service" },
  MO: { institution: "University of Missouri", extensionName: "MU Extension" },
  MT: { institution: "Montana State University", extensionName: "MSU Extension" },
  NE: { institution: "University of Nebraska–Lincoln", extensionName: "Nebraska Extension" },
  NV: { institution: "University of Nevada, Reno", extensionName: "Extension, University of Nevada, Reno" },
  NH: { institution: "University of New Hampshire", extensionName: "UNH Cooperative Extension" },
  NJ: { institution: "Rutgers University", extensionName: "Rutgers Cooperative Extension" },
  NM: { institution: "New Mexico State University", extensionName: "NMSU Cooperative Extension Service" },
  NY: { institution: "Cornell University", extensionName: "Cornell Cooperative Extension" },
  NC: { institution: "North Carolina State University", extensionName: "NC State Extension" },
  ND: { institution: "North Dakota State University", extensionName: "NDSU Extension" },
  OH: { institution: "The Ohio State University", extensionName: "OSU Extension" },
  OK: { institution: "Oklahoma State University", extensionName: "OSU Extension" },
  OR: { institution: "Oregon State University", extensionName: "OSU Extension Service" },
  PA: { institution: "The Pennsylvania State University", extensionName: "Penn State Extension" },
  RI: { institution: "University of Rhode Island", extensionName: "URI Cooperative Extension" },
  SC: { institution: "Clemson University", extensionName: "Clemson Cooperative Extension" },
  SD: { institution: "South Dakota State University", extensionName: "SDSU Extension" },
  TN: { institution: "University of Tennessee", extensionName: "UT Extension" },
  TX: { institution: "Texas A&M University", extensionName: "Texas A&M AgriLife Extension Service" },
  UT: { institution: "Utah State University", extensionName: "USU Extension" },
  VT: { institution: "University of Vermont", extensionName: "UVM Extension" },
  VA: { institution: "Virginia Tech and Virginia State University", extensionName: "Virginia Cooperative Extension" },
  WA: { institution: "Washington State University", extensionName: "WSU Extension" },
  WV: { institution: "West Virginia University", extensionName: "WVU Extension" },
  WI: { institution: "University of Wisconsin–Madison", extensionName: "Extension (UW–Madison)" },
  WY: { institution: "University of Wyoming", extensionName: "UW Extension" },
  DC: { institution: "University of the District of Columbia", extensionName: "UDC CAUSES Land-Grant Programs" },
};
