import {
  getReportAdminScopeRecord,
  listReportAdminRecords,
  persistReportRecord,
} from "@/lib/reports/reportRecordStore";

/** Stable public boundary for the canonical Report domain. */
export const canonicalReportAuthority = Object.freeze({
  persist: persistReportRecord,
  getAdminScope: getReportAdminScopeRecord,
  listAdminRecords: listReportAdminRecords,
});

export type {
  ListReportAdminRecordsInput,
  PersistReportRecordInput,
  ReportAdminRecord,
  ReportAdminScopeRecord,
} from "@/lib/reports/reportRecordStore";
