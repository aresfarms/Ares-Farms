import {
  EXPLORATION_MODULE_REGISTRY,
  explorationModuleById,
} from "@/lib/exploration/explorationRegistry";
import {
  ExplorationDimension,
  ExplorationMode,
  ExplorationModule,
  ExplorationOption,
  FirstValueOutput,
  HumanReviewRoute,
  REQUIRED_ALPHA_EXPLORATION_MODULE_IDS,
  UNIVERSAL_EXPLORATION_ENGINE_VERSION,
} from "@/lib/exploration/explorationTypes";

/**
 * Universal Exploration Engine — runtime (Build 45).
 *
 * Given a moduleId + mode + selected options, returns the current customer
 * view: prompt, available options, selected path, first-value outputs, source
 * family hints, and (only after value is shown) human review options. No
 * personal information is required for exploration; output is advisory and
 * carries no approval / guarantee / eligibility / official-determination claim.
 */

export type SelectedExplorationOption = {
  dimensionId: string;
  optionId: string;
};

export type ExplorationViewInput = {
  moduleId: string;
  mode: ExplorationMode;
  selectedOptions?: SelectedExplorationOption[];
  modules?: ExplorationModule[];
};

export type SelectedPathEntry = {
  dimensionId: string;
  optionId: string;
  label: string;
};

export type ExplorationView = {
  ok: boolean;
  error: string | null;
  engineVersion: string;
  moduleId: string;
  label: string;
  mode: ExplorationMode;
  prompt: string;
  currentDimensionId: string | null;
  availableOptions: ExplorationOption[];
  selectedPath: SelectedPathEntry[];
  valueShown: boolean;
  firstValueOutputs: FirstValueOutput[];
  sourceFamilyHints: string[];
  humanReviewOptions: HumanReviewRoute[];
  // Constitutional flags.
  requiresPersonalInfo: false;
  advisoryOnly: true;
  noApproval: true;
  noGuarantee: true;
  noEligibilityDetermination: true;
  noOfficialDetermination: true;
};

function emptyView(
  input: ExplorationViewInput,
  error: string
): ExplorationView {
  return {
    ok: false,
    error,
    engineVersion: UNIVERSAL_EXPLORATION_ENGINE_VERSION,
    moduleId: input.moduleId,
    label: "",
    mode: input.mode,
    prompt: "",
    currentDimensionId: null,
    availableOptions: [],
    selectedPath: [],
    valueShown: false,
    firstValueOutputs: [],
    sourceFamilyHints: [],
    humanReviewOptions: [],
    requiresPersonalInfo: false,
    advisoryOnly: true,
    noApproval: true,
    noGuarantee: true,
    noEligibilityDetermination: true,
    noOfficialDetermination: true,
  };
}

function resolvePath(
  module: ExplorationModule,
  selected: SelectedExplorationOption[]
): SelectedPathEntry[] {
  const path: SelectedPathEntry[] = [];
  for (const sel of selected) {
    const dim = module.narrowingDimensions.find(
      (d) => d.dimensionId === sel.dimensionId
    );
    const opt = dim?.options.find((o) => o.optionId === sel.optionId);
    if (dim && opt) {
      path.push({
        dimensionId: dim.dimensionId,
        optionId: opt.optionId,
        label: opt.label,
      });
    }
  }
  return path;
}

export function composeExplorationView(
  input: ExplorationViewInput
): ExplorationView {
  const modules = input.modules ?? EXPLORATION_MODULE_REGISTRY;
  const module = explorationModuleById(input.moduleId, modules);
  if (!module) {
    return emptyView(input, `Unknown exploration module: ${input.moduleId}`);
  }
  if (input.mode !== "FULL_MAP" && input.mode !== "FOCUS_MY_EXPLORATION") {
    return emptyView(input, `Unknown exploration mode: ${input.mode}`);
  }

  const selected = input.selectedOptions ?? [];
  const selectedPath = resolvePath(module, selected);

  // Full Map shows broad value immediately. Focus shows value after the first
  // narrowing choice; before any choice it shows only the prompt + options.
  const valueShown =
    input.mode === "FULL_MAP" ? true : selectedPath.length >= 1;

  let prompt: string;
  let currentDimension: ExplorationDimension | null;

  if (input.mode === "FULL_MAP") {
    prompt = module.fullMapIntro;
    currentDimension = module.narrowingDimensions[0] ?? null;
  } else if (selectedPath.length === 0) {
    prompt = module.focusPrompt;
    currentDimension = module.narrowingDimensions[0] ?? null;
  } else {
    // Advance through dimensions in order.
    const nextIndex = selectedPath.length;
    currentDimension = module.narrowingDimensions[nextIndex] ?? null;
    prompt = currentDimension
      ? currentDimension.prompt
      : "Here is what we can show you so far — keep exploring or take a next step.";
  }

  const availableOptions = currentDimension ? currentDimension.options : [];

  const firstValueOutputs = valueShown
    ? module.firstValueOutputs.filter(
        (o) => o.allowedInFreeExploration && !o.requiresPersonalInfo
      )
    : [];

  // Source hints: module families + any hints attached to chosen options.
  const optionSourceHints = selectedPath.flatMap((entry) => {
    const dim = module.narrowingDimensions.find(
      (d) => d.dimensionId === entry.dimensionId
    );
    const opt = dim?.options.find((o) => o.optionId === entry.optionId);
    return opt?.sourceHints ?? [];
  });
  const sourceFamilyHints = Array.from(
    new Set([...module.sourceFamilies, ...optionSourceHints])
  );

  // Human review only after value is shown.
  const humanReviewOptions = valueShown
    ? module.humanReviewRoutes.filter((r) => r.triggerAfterValueShown)
    : [];

  return {
    ok: true,
    error: null,
    engineVersion: UNIVERSAL_EXPLORATION_ENGINE_VERSION,
    moduleId: module.moduleId,
    label: module.label,
    mode: input.mode,
    prompt,
    currentDimensionId: currentDimension ? currentDimension.dimensionId : null,
    availableOptions,
    selectedPath,
    valueShown,
    firstValueOutputs,
    sourceFamilyHints,
    humanReviewOptions,
    requiresPersonalInfo: false,
    advisoryOnly: true,
    noApproval: true,
    noGuarantee: true,
    noEligibilityDetermination: true,
    noOfficialDetermination: true,
  };
}

export function explorationEngineLineage(): {
  engineVersion: string;
  moduleCount: number;
  requiredModuleCount: number;
} {
  return {
    engineVersion: UNIVERSAL_EXPLORATION_ENGINE_VERSION,
    moduleCount: EXPLORATION_MODULE_REGISTRY.length,
    requiredModuleCount: REQUIRED_ALPHA_EXPLORATION_MODULE_IDS.length,
  };
}
