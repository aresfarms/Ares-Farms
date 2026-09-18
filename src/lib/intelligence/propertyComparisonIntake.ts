export const PROPERTY_COMPARISON_MIN = 1;
export const PROPERTY_COMPARISON_MAX = 1_000;
export const PROPERTY_COMPARISON_TOP_MAX = 5;

export type PropertyComparisonIntake = {
  addresses: string[];
  excludedAddresses: string[];
  requestedResultCount: number;
};

export type PropertyComparisonIntakeResult =
  | { ok: true; value: PropertyComparisonIntake; duplicateCount: number }
  | { ok: false; error: string };

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function addressKey(value: string): string {
  return value.toLocaleLowerCase("en-US").replace(/\s+/g, " ").trim();
}
export function parsePropertyComparisonIntake(input: {
  addressesText: string;
  excludedAddressesText?: string;
  requestedResultCount: number;
}): PropertyComparisonIntakeResult {
  const submitted = lines(input.addressesText);
  if (submitted.length < PROPERTY_COMPARISON_MIN) {
    return { ok: false, error: "Enter at least one complete U.S. property address." };
  }
  if (submitted.length > PROPERTY_COMPARISON_MAX) {
    return { ok: false, error: `Enter no more than ${PROPERTY_COMPARISON_MAX.toLocaleString("en-US")} properties in one comparison.` };
  }
  if (submitted.some((address) => address.length > 300)) {
    return { ok: false, error: "Each property address must be 300 characters or fewer." };
  }

  const requestedResultCount = Math.trunc(input.requestedResultCount);
  if (requestedResultCount < 1 || requestedResultCount > PROPERTY_COMPARISON_TOP_MAX) {
    return { ok: false, error: "Choose between one and five properties to return." };
  }

  const excludedAddresses = [...new Map(
    lines(input.excludedAddressesText ?? "").map((address) => [addressKey(address), address]),
  ).values()];
  const excludedKeys = new Set(excludedAddresses.map(addressKey));
  const unique = new Map<string, string>();
  for (const address of submitted) {
    const key = addressKey(address);
    if (!excludedKeys.has(key) && !unique.has(key)) unique.set(key, address);
  }
  const addresses = [...unique.values()];
  if (!addresses.length) {
    return { ok: false, error: "Every submitted property was excluded. Keep at least one property to compare." };
  }

  const submittedKeyCount = new Set(submitted.map(addressKey)).size;
  return {
    ok: true,
    value: { addresses, excludedAddresses, requestedResultCount },
    duplicateCount: submitted.length - submittedKeyCount,
  };
}
