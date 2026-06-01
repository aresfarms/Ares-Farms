import { SCRAPER_REGISTRY } from "@/lib/source-intelligence/sourceIntelligenceRuntime";

export function buildGovernedScraperSchedule() {
  return SCRAPER_REGISTRY.map((scraper) => ({
    scraperId: scraper.scraperId,
    sourceId: scraper.sourceId,
    scheduleStatus: "MANUAL_REVIEW_ONLY",
    liveExecutionAllowed: false,
    requiredBeforeScheduling: [
      "connector certification",
      "replay certification",
      "provenance validation",
      "constitutional compliance review",
    ],
  }));
}
