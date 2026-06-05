import {
  CURATED_EXPLORATION_STORIES,
  EXPLORATION_CATEGORIES,
  FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE,
  FEATURED_EXPLORATION_LABEL,
} from "@/lib/customer-landing/featuredExplorationStories";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(EXPLORATION_CATEGORIES.length === 8, "Expected 8 exploration categories.");
  assert(
    CURATED_EXPLORATION_STORIES.length >= 4,
    "Expected at least 4 curated exploration stories."
  );
  assert(
    FEATURED_EXPLORATION_LABEL === "Featured Exploration",
    "Featured exploration label drifted."
  );
  assert(
    FEATURED_EXPLORATION_ILLUSTRATIVE_NOTE.includes("not based on your location"),
    "Illustrative note must disclose that the map is not location-based."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: "exploration-registry-smoke-v0.1.0",
        categoryCount: EXPLORATION_CATEGORIES.length,
        storyCount: CURATED_EXPLORATION_STORIES.length,
        message:
          "smoke:exploration-registry PASS — exploration categories and illustrative-story posture are intact.",
      },
      null,
      2
    )
  );
}

main();
