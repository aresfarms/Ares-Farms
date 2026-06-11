import {
  detectStewardshipViolation,
  FURLONG_STEWARDSHIP_VERSION,
  STEWARDSHIP_DOMAINS,
  stewardshipDomainById,
  stewardshipDomainsForExplorationModule,
  stewardshipLineage,
  type StewardshipDomain,
} from "@/lib/stewardship/stewardshipRegistry";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main() {
  // Lineage.
  const lineage = stewardshipLineage();
  assert(
    lineage.version === FURLONG_STEWARDSHIP_VERSION,
    "Lineage must echo the stewardship version."
  );
  assert(lineage.domainCount === 3, "There must be 3 stewardship domains.");

  // Current stewards appear as current stewards of domains.
  const expectedStewards: Record<string, string> = {
    "financing-capital": "Stuart Fraass",
    "environmental-compliance": "Caitlin Hudson",
    "communications-public-trust": "Frances Fraass",
  };
  for (const [domainId, steward] of Object.entries(expectedStewards)) {
    const domain = stewardshipDomainById(domainId);
    assert(domain !== undefined, `Domain ${domainId} must exist.`);
    assert(
      domain.currentSteward === steward,
      `${domainId} current steward must be ${steward}.`
    );
    assert(
      domain.stewardTitle.startsWith("Steward of "),
      `${domainId} must use stewardship-language title.`
    );
  }

  // Domains persist independently of individuals: changing the current steward
  // does NOT change the domain id or its profile route.
  const original = stewardshipDomainById("financing-capital")!;
  const reassigned: StewardshipDomain = {
    ...original,
    currentSteward: "A Future Steward",
  };
  assert(
    reassigned.domainId === original.domainId &&
      reassigned.profileRoute === original.profileRoute,
    "Reassigning a steward must not change the domain id or profile route."
  );
  for (const d of STEWARDSHIP_DOMAINS) {
    assert(
      d.profileRoute === `/stewardship/${d.domainId}`,
      `${d.domainId} profileRoute must derive from the domain id, not the steward.`
    );
  }

  // Exploration → stewardship review routing (the required examples).
  const propLand = stewardshipDomainsForExplorationModule("property-land").map(
    (d) => d.domainId
  );
  assert(
    propLand.includes("financing-capital") &&
      propLand.includes("environmental-compliance"),
    "property-land must route to Financing & Capital + Environmental & Compliance stewardship."
  );
  const smb = stewardshipDomainsForExplorationModule(
    "small-business-growth"
  ).map((d) => d.domainId);
  assert(
    smb.includes("financing-capital") &&
      smb.includes("communications-public-trust"),
    "small-business-growth must route to Financing & Capital + Communications & Public Trust stewardship."
  );
  const env = stewardshipDomainsForExplorationModule(
    "environmental-compliance"
  ).map((d) => d.domainId);
  assert(
    env.length === 1 && env[0] === "environmental-compliance",
    "environmental-compliance must route to Environmental & Compliance stewardship."
  );

  // Environmental technical review remains held for Alpha.
  const envDomain = stewardshipDomainById("environmental-compliance")!;
  assert(
    typeof envDomain.heldForAlphaNote === "string" &&
      envDomain.heldForAlphaNote.length > 0,
    "environmental-compliance must note technical review is held for Alpha."
  );

  // Language guard: detector catches forbidden titles + sales/approval claims,
  // but not normal stewardship copy.
  assert(
    detectStewardshipViolation("Our expert will guide you") !== null,
    "Detector must catch the forbidden title 'expert'."
  );
  assert(
    detectStewardshipViolation("You are pre-approved — buy now!") !== null,
    "Detector must catch approval + sales language."
  );
  assert(
    detectStewardshipViolation(
      "Helps illuminate pathways and questions worth exploring."
    ) === null,
    "Detector must not flag normal stewardship copy."
  );

  // The whole registry carries zero violations.
  let violations = 0;
  for (const d of STEWARDSHIP_DOMAINS) {
    for (const t of [
      d.domainName,
      d.stewardTitle,
      d.description,
      ...d.helpsIlluminate,
      ...d.questionsExplored,
      ...d.whenHumanReviewAppropriate,
      d.heldForAlphaNote ?? "",
    ]) {
      if (detectStewardshipViolation(t)) violations += 1;
    }
  }
  assert(violations === 0, `Stewardship copy must carry zero violations; found ${violations}.`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        version: FURLONG_STEWARDSHIP_VERSION,
        domainCount: lineage.domainCount,
        domainIds: lineage.domainIds,
        message: "Furlong Stewardship smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
