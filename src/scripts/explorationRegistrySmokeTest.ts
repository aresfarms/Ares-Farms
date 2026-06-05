import {
  EXPLORATION_MODULE_REGISTRY,
  explorationModuleById,
} from "@/lib/exploration/explorationRegistry";
import {
  composeExplorationView,
  explorationEngineLineage,
} from "@/lib/exploration/explorationRuntime";
import {
  detectExplorationProhibitedClaim,
  REQUIRED_ALPHA_EXPLORATION_MODULE_IDS,
  UNIVERSAL_EXPLORATION_ENGINE_VERSION,
} from "@/lib/exploration/explorationTypes";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function optionIds(moduleId: string, dimensionId: string): string[] {
  const m = explorationModuleById(moduleId);
  const dim = m?.narrowingDimensions.find((d) => d.dimensionId === dimensionId);
  return dim ? dim.options.map((o) => o.optionId) : [];
}

function main() {
  // Version + lineage.
  const lineage = explorationEngineLineage();
  assert(
    lineage.engineVersion === UNIVERSAL_EXPLORATION_ENGINE_VERSION,
    "Lineage must echo the engine version."
  );
  assert(
    lineage.requiredModuleCount === 8,
    "There must be 8 required Alpha exploration modules."
  );
  assert(
    lineage.moduleCount >= 8,
    "Registry must contain at least the 8 required modules."
  );

  // Every required module can start in FULL_MAP and FOCUS_MY_EXPLORATION.
  for (const moduleId of REQUIRED_ALPHA_EXPLORATION_MODULE_IDS) {
    const full = composeExplorationView({ moduleId, mode: "FULL_MAP" });
    assert(full.ok, `${moduleId} must start in FULL_MAP mode.`);
    assert(full.valueShown, `${moduleId} FULL_MAP must show value immediately.`);
    assert(
      full.firstValueOutputs.length > 0,
      `${moduleId} FULL_MAP must surface first-value outputs.`
    );
    assert(
      full.requiresPersonalInfo === false,
      `${moduleId} must not require personal info for exploration.`
    );

    const focus = composeExplorationView({
      moduleId,
      mode: "FOCUS_MY_EXPLORATION",
    });
    assert(focus.ok, `${moduleId} must start in FOCUS_MY_EXPLORATION mode.`);
    assert(
      focus.availableOptions.length > 0,
      `${moduleId} FOCUS must offer narrowing options.`
    );
    // Human review is delayed until value appears (no selection yet).
    assert(
      focus.valueShown === false && focus.humanReviewOptions.length === 0,
      `${moduleId} FOCUS must not show human review before value.`
    );
  }

  // farms-agriculture supports flowers, livestock, specialty animals, crops.
  const ag = optionIds("farms-agriculture", "agriculture-type");
  for (const id of ["crops", "flowers", "livestock", "specialty-animals"]) {
    assert(ag.includes(id), `farms-agriculture must support "${id}".`);
  }

  // property-land supports hotels, RV parks, mobile home parks, unusual props.
  const prop = optionIds("property-land", "property-type");
  for (const id of ["hotel", "rv-park", "mobile-home-park", "unusual-distressed"]) {
    assert(prop.includes(id), `property-land must support "${id}".`);
  }

  // financing-capital supports USDA, SBA, conventional, seller financing,
  // working capital.
  const finGoal = optionIds("financing-capital", "financing-goal");
  const finSource = optionIds("financing-capital", "capital-source");
  assert(finGoal.includes("working-capital"), "financing-capital must support working capital.");
  for (const id of ["usda", "sba", "conventional", "seller-financing"]) {
    assert(finSource.includes(id), `financing-capital must support "${id}".`);
  }

  // environmental-compliance remains advisory / held for technical review.
  const env = explorationModuleById("environmental-compliance");
  assert(env !== undefined, "environmental-compliance module must exist.");
  const envTechnical = env.humanReviewRoutes.filter(
    (r) => r.specialistDomain === "ENVIRONMENTAL_COMPLIANCE"
  );
  assert(
    envTechnical.length > 0 && envTechnical.every((r) => r.heldForAlpha === true),
    "environmental-compliance technical review must be HELD_FOR_ALPHA (qualified reviewer required)."
  );

  // not-sure-yet returns suggested paths.
  const notSure = composeExplorationView({
    moduleId: "not-sure-yet",
    mode: "FULL_MAP",
  });
  assert(
    notSure.firstValueOutputs.some((o) => o.outputId === "suggested-paths"),
    "not-sure-yet must return suggested exploration paths."
  );

  // Human review delayed until value appears — then it appears.
  const beforeValue = composeExplorationView({
    moduleId: "financing-capital",
    mode: "FOCUS_MY_EXPLORATION",
  });
  assert(
    beforeValue.humanReviewOptions.length === 0,
    "Human review must be hidden before value is shown."
  );
  const afterValue = composeExplorationView({
    moduleId: "financing-capital",
    mode: "FOCUS_MY_EXPLORATION",
    selectedOptions: [
      { dimensionId: "financing-goal", optionId: "working-capital" },
    ],
  });
  assert(
    afterValue.valueShown &&
      afterValue.firstValueOutputs.length > 0 &&
      afterValue.humanReviewOptions.length > 0,
    "After a narrowing choice, value + human review must appear."
  );
  assert(
    afterValue.humanReviewOptions.some(
      (r) => r.specialistDomain === "FINANCING_CAPITAL"
    ),
    "financing-capital must offer a financing specialist route after value."
  );

  // Prohibited claims: the detector catches assertions but not topic mentions.
  assert(
    detectExplorationProhibitedClaim("You are pre-approved for funding") !== null,
    "Detector must catch a prohibited approval claim."
  );
  assert(
    detectExplorationProhibitedClaim("Eligibility questions to consider") === null,
    "Detector must NOT flag legitimate topic mentions like 'eligibility questions'."
  );
  // The real registry must carry zero prohibited claims.
  let claimHits = 0;
  for (const m of EXPLORATION_MODULE_REGISTRY) {
    const texts = [
      m.label,
      m.plainEnglishDescription,
      m.fullMapIntro,
      m.focusPrompt,
      ...m.narrowingDimensions.flatMap((d) => [
        d.label,
        d.prompt,
        ...d.options.flatMap((o) => [o.label, o.plainEnglishDescription]),
      ]),
      ...m.firstValueOutputs.flatMap((o) => [o.label, o.description]),
      ...m.humanReviewRoutes.map((r) => r.label),
    ];
    for (const t of texts) {
      if (detectExplorationProhibitedClaim(t)) claimHits += 1;
    }
  }
  assert(claimHits === 0, `Registry copy must carry zero prohibited claims; found ${claimHits}.`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        engineVersion: UNIVERSAL_EXPLORATION_ENGINE_VERSION,
        moduleCount: lineage.moduleCount,
        requiredModuleCount: lineage.requiredModuleCount,
        message: "Universal Exploration Engine smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
