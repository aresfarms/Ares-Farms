import * as fs from "node:fs";
import { runtimeStatePath } from "./runtimeStatePath";

export type ExternalNotificationRetirementClassification =
  | "SECURITY_RETIREMENT"
  | "PROVIDER_TERMINATION"
  | "IMPLEMENTATION_OBSOLESCENCE"
  | "POLICY_PROHIBITION"
  | "OPERATOR_DECOMMISSION"
  | "SUPERSEDED_IMPLEMENTATION";

export interface ExternalNotificationRetirementReceipt {
  receiptId: string;
  registrationId: string;
  connectorId: string;
  implementationHash: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  action: "RETIRE";
  classification: ExternalNotificationRetirementClassification;
  revocationReceiptId: string;
  replacementRegistrationId: string | null;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
}

export const EXTERNAL_NOTIFICATION_RETIREMENT_FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-retirement.json",
);

export function listExternalNotificationRetirementReceipts(): ExternalNotificationRetirementReceipt[] {
  try {
    return JSON.parse(fs.readFileSync(EXTERNAL_NOTIFICATION_RETIREMENT_FILE, "utf8"));
  } catch {
    return [];
  }
}

export function retiredExternalNotificationRegistration(registrationId: string) {
  return [...listExternalNotificationRetirementReceipts()]
    .reverse()
    .find((receipt) => receipt.registrationId === registrationId) ?? null;
}

export function externalNotificationRegistrationRetired(registrationId: string): boolean {
  return retiredExternalNotificationRegistration(registrationId) !== null;
}
