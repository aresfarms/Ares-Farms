/**
 * Report branding helper (Build 44-B).
 *
 * Branding + required disclosures for Furlong exploration reports / PDFs /
 * downloadable summaries. The logo is a trust anchor on the cover/header and
 * again in the footer; it never replaces the advisory or data-rights
 * disclosures, which are mandatory on every report.
 */

export const REPORT_LOGO_PATH = "/brand/furlong-logo.png";
export const REPORT_EMBLEM_PATH = "/brand/furlong-emblem.png";
export const REPORT_COMPASS_WATERMARK_PATH =
  "/brand/furlong-compass-watermark.jpeg";

export const REPORT_TITLE = "Furlong Exploration Report";

export const REPORT_ADVISORY_DISCLOSURE =
  "Advisory information only — not an approval, guarantee, eligibility finding, or official determination. Furlong is not a lender, and does not approve, deny, guarantee, or make official determinations.";

export const REPORT_DATA_RIGHTS_DISCLOSURE =
  "Your information belongs to you. You can request an accounting, export, or deletion of your data at any time. We do not sell your information.";

export const REPORT_FOOTER_TEXT =
  "Furlong — we help you understand the map. The journey and the decisions remain yours.";

export interface ReportBranding {
  logoPath: string;
  emblemPath: string;
  compassWatermarkPath: string;
  reportTitle: string;
  advisoryDisclosure: string;
  dataRightsDisclosure: string;
  footerText: string;
  generatedDate: string;
  explorationPath: string[];
}

/**
 * Build the branding/disclosure block for a report cover. Pass the exploration
 * path (e.g. ["Property & Land", "Financing & Capital", "Readiness"]) and an
 * optional generation date (defaults to now).
 */
export function buildReportBranding(opts?: {
  explorationPath?: string[];
  generatedAt?: Date;
}): ReportBranding {
  const date = opts?.generatedAt ?? new Date();
  return {
    logoPath: REPORT_LOGO_PATH,
    emblemPath: REPORT_EMBLEM_PATH,
    compassWatermarkPath: REPORT_COMPASS_WATERMARK_PATH,
    reportTitle: REPORT_TITLE,
    advisoryDisclosure: REPORT_ADVISORY_DISCLOSURE,
    dataRightsDisclosure: REPORT_DATA_RIGHTS_DISCLOSURE,
    footerText: REPORT_FOOTER_TEXT,
    generatedDate: date.toISOString().slice(0, 10),
    explorationPath: opts?.explorationPath ?? [],
  };
}

/** A human-readable exploration path, e.g. "Furlong → Property & Land → …". */
export function formatExplorationPath(path: string[]): string {
  return ["Furlong", ...path].join(" → ");
}
