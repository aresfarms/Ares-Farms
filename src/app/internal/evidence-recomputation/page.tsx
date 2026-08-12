import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  canApproveSourceLegal,
  operatorByEmail,
} from "@/lib/auth/operatorRegistry";
import {
  attestDeterministicReplay,
  listReplayAttestations,
} from "@/lib/property/officialEvidenceReplayExecutor";
import { listEvidenceReplayPackets } from "@/lib/property/officialEvidenceReplayPacketStore";
import {
  decideGovernedRecomputationHandler,
  listGovernedRecomputationHandlerReceipts,
  listGovernedRecomputationHandlers,
} from "@/lib/property/officialEvidenceRecomputationHandlerRegistry";
import type { DownstreamArtifactKind } from "@/lib/property/officialEvidenceDownstreamInvalidation";
import { ensureProductionRecomputationBindings } from "@/lib/property/officialEvidenceProductionRecomputationHandlers";
import { evidenceRecomputationActivationStatus } from "@/lib/property/officialEvidenceRecomputationActivation";
import { bootstrapLiveEvidenceReplayReview } from "@/lib/property/officialEvidenceLiveBootstrap";
import {
  listBatchReplayReceipts,
  runGovernedBatchReplayVerification,
} from "@/lib/property/officialEvidenceBatchReplayVerification";
import {
  createApprovalPacket,
  decideApprovalPacketItem,
  listApprovalPackets,
  listApprovalPacketDecisions,
  approvalCompletionStatus,
} from "@/lib/property/officialEvidenceApprovalPacket";
import {
  listRecomputationActivationReceipts,
  recordRecomputationActivationCeremony,
  recomputationActivationFinalized,
  type CeremonyAction,
} from "@/lib/property/officialEvidenceRecomputationCeremony";
import {
  createFinalCanaryReleasePacket,
  currentFinalCanaryReleasePacket,
  listFinalCanaryReleasePackets,
} from "@/lib/property/officialEvidenceFinalCanaryPacket";
import {
  currentPassedCanaryTranscript,
  listCanaryExecutionTranscripts,
} from "@/lib/property/officialEvidenceCanaryExecutionTranscript";
import {
  listSchedulerReleaseReceipts,
  recordSchedulerRelease,
  schedulerCanaryPassed,
  schedulerReleaseAuthorized,
  schedulerResumePermitted,
} from "@/lib/property/officialEvidenceSchedulerRelease";
import {
  currentReviewHandoffChecklist,
  listReviewHandoffReceipts,
  recordReviewHandoff,
} from "@/lib/property/officialEvidenceReviewHandoff";
import {
  decideSteadyStateIncident,
  listSteadyStateIncidentReceipts,
  openSteadyStateIncidents,
  type SteadyStateIncidentAction,
} from "@/lib/property/officialEvidenceSteadyStateIncident";
import {
  evaluateIncidentSlaBreaches,
  incidentSlaStatus,
  listIncidentSlaReceipts,
} from "@/lib/property/officialEvidenceIncidentSla";
import {
  acknowledgeIncidentNotification,
  deliverPendingIncidentNotifications,
  listIncidentNotificationReceipts,
  pendingIncidentNotifications,
} from "@/lib/property/officialEvidenceIncidentNotification";
import {
  decideExternalNotificationConnector,
  listExternalNotificationConnectorReceipts,
  listExternalNotificationConnectorRegistrations,
  type ExternalConnectorDecision,
} from "@/lib/property/officialEvidenceExternalNotificationConnector";
import {
  decideExternalNotificationActivation,
  listExternalNotificationActivationReceipts,
  liveExternalNotificationConnectors,
  type ExternalNotificationActivationAction,
} from "@/lib/property/officialEvidenceExternalNotificationActivation";
import { listExternalNotificationDeliveryReceipts } from "@/lib/property/officialEvidenceExternalNotificationDelivery";
import {
  evaluateExternalNotificationAcknowledgments,
  listExternalNotificationAssuranceReceipts,
} from "@/lib/property/officialEvidenceExternalNotificationAssurance";
import {
  connectorInProbation,
  listExternalNotificationReinstatementReceipts,
  reinstateExternalNotificationConnector,
} from "@/lib/property/officialEvidenceExternalNotificationReinstatement";
import {
  externalNotificationRegistrationRetired,
  listExternalNotificationRetirementReceipts,
  retireExternalNotificationConnector,
  type ExternalNotificationRetirementClassification,
} from "@/lib/property/officialEvidenceExternalNotificationRetirement";
import {
  externalNotificationRetirementClosed,
  listExternalNotificationRetirementClosureReceipts,
  closeExternalNotificationRetirement,
} from "@/lib/property/officialEvidenceExternalNotificationRetirementClosure";
import {
  evaluateExternalNotificationRetirementTombstones,
  listExternalNotificationRetirementTombstoneReceipts,
  retirementTombstoneHealthy,
} from "@/lib/property/officialEvidenceExternalNotificationRetirementTombstone";
import {
  containExternalNotificationTombstoneFailure,
  decideExternalNotificationTombstoneIncident,
  listExternalNotificationTombstoneIncidentReceipts,
  tombstoneIncidentStatus,
  type TombstoneIncidentAction,
} from "@/lib/property/officialEvidenceExternalNotificationTombstoneIncident";
import {
  closeExternalNotificationCorrectiveAction,
  correctiveActionStatus,
  listExternalNotificationCorrectiveActionReceipts,
  openExternalNotificationCorrectiveAction,
  verifyExternalNotificationCorrectiveAction,
} from "@/lib/property/officialEvidenceExternalNotificationCorrectiveAction";
import {
  closeExternalNotificationCorrectiveActionEffectivenessWindow,
  correctiveActionEffectivenessStatus,
  evaluateExternalNotificationCorrectiveActionEffectiveness,
  listExternalNotificationCorrectiveActionEffectivenessReceipts,
  openExternalNotificationCorrectiveActionEffectivenessWindow,
} from "@/lib/property/officialEvidenceExternalNotificationCorrectiveActionEffectiveness";
import {
  attestExternalNotificationInstitutionalClosure,
  externalNotificationInstitutionallyClosed,
  listExternalNotificationInstitutionalClosureAttestations,
} from "@/lib/property/officialEvidenceExternalNotificationInstitutionalClosure";

async function decideTombstoneIncident(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  decideExternalNotificationTombstoneIncident({
    registrationId: String(formData.get("registrationId") ?? ""),
    action: String(formData.get("action")) as Exclude<
      TombstoneIncidentAction,
      "CONTAIN"
    >,
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function verifyCorrectiveAction(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  verifyExternalNotificationCorrectiveAction({
    registrationId: String(formData.get("registrationId") ?? ""),
    rootCauseRef: String(formData.get("rootCauseRef") ?? "").trim(),
    credentialAuditRef: String(formData.get("credentialAuditRef") ?? "").trim(),
    providerAuditRef: String(formData.get("providerAuditRef") ?? "").trim(),
    routingAuditRef: String(formData.get("routingAuditRef") ?? "").trim(),
    secretAuditRef: String(formData.get("secretAuditRef") ?? "").trim(),
    codeChangeRef: String(formData.get("codeChangeRef") ?? "").trim() || null,
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function closeCorrectiveAction(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  closeExternalNotificationCorrectiveAction({
    registrationId: String(formData.get("registrationId") ?? ""),
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function evaluateCorrectiveActionEffectiveness(
  formData: FormData,
): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  evaluateExternalNotificationCorrectiveActionEffectiveness({
    registrationId: String(formData.get("registrationId") ?? ""),
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function closeCorrectiveActionEffectiveness(
  formData: FormData,
): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  closeExternalNotificationCorrectiveActionEffectivenessWindow({
    registrationId: String(formData.get("registrationId") ?? ""),
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function attestInstitutionalClosure(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  attestExternalNotificationInstitutionalClosure({
    registrationId: String(formData.get("registrationId") ?? ""),
    attestationScope: String(formData.get("attestationScope") ?? "").trim(),
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function runReplay(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const kind = String(formData.get("kind")) as DownstreamArtifactKind;
  const artifactId = String(formData.get("artifactId") ?? "");
  const registration = [...listGovernedRecomputationHandlers()]
    .reverse()
    .find((r) => r.kind === kind);
  if (!registration)
    throw new Error("No handler registration exists for this artifact class.");
  attestDeterministicReplay({
    artifactId,
    handlerId: registration.handlerId,
    implementationHash: registration.implementationHash,
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function runBatchReplay(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  const reason = String(formData.get("reason") ?? "").trim();
  runGovernedBatchReplayVerification({
    actorId: operator.id,
    actorName: operator.name,
    reason,
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function createDecisionPacket(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  createApprovalPacket({
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function decidePacketItem(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  decideApprovalPacketItem({
    packetId: String(formData.get("packetId") ?? ""),
    kind: String(formData.get("kind")) as DownstreamArtifactKind,
    decision: String(formData.get("decision")) as "APPROVE" | "SUSPEND",
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function recordHandoff(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  recordReviewHandoff({
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function ceremony(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  const action = String(formData.get("action")) as CeremonyAction;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["INITIALIZE", "FINALIZE", "REVOKE"].includes(action))
    throw new Error("Invalid activation ceremony action.");
  recordRecomputationActivationCeremony({
    action,
    actorId: operator.id,
    actorName: operator.name,
    reason,
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function createCanaryPacket(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  createFinalCanaryReleasePacket({
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function schedulerRelease(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  const action = String(formData.get("action")) as "AUTHORIZE" | "REVOKE";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["AUTHORIZE", "REVOKE"].includes(action))
    throw new Error("Invalid scheduler release action.");
  recordSchedulerRelease({
    action,
    actorId: operator.id,
    actorName: operator.name,
    reason,
  });
  revalidatePath("/internal/evidence-recomputation");
}
async function decide(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  const kind = String(formData.get("kind")) as DownstreamArtifactKind;
  const decision = String(formData.get("decision")) as "APPROVE" | "SUSPEND";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("A review reason is required.");
  decideGovernedRecomputationHandler({
    kind,
    decision,
    reviewerId: operator.id,
    reviewerName: operator.name,
    reason,
  });
  revalidatePath("/internal/evidence-recomputation");
}
import { listPostResumeWatchdogReceipts } from "@/lib/property/officialEvidencePostResumeWatchdog";

async function decideSteadyIncident(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  decideSteadyStateIncident({
    incidentId: String(formData.get("incidentId") ?? ""),
    action: String(formData.get("action")) as Exclude<
      SteadyStateIncidentAction,
      "OPEN"
    >,
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function decideExternalNotificationConnectorAction(
  formData: FormData,
): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  decideExternalNotificationConnector({
    registrationId: String(formData.get("registrationId") ?? ""),
    decision: String(formData.get("decision")) as ExternalConnectorDecision,
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function decideExternalNotificationActivationAction(
  formData: FormData,
): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  decideExternalNotificationActivation({
    registrationId: String(formData.get("registrationId") ?? ""),
    action: String(
      formData.get("action"),
    ) as ExternalNotificationActivationAction,
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function reinstateExternalConnector(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  reinstateExternalNotificationConnector({
    registrationId: String(formData.get("registrationId") ?? ""),
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function retireExternalConnector(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  retireExternalNotificationConnector({
    registrationId: String(formData.get("registrationId") ?? ""),
    classification: String(
      formData.get("classification"),
    ) as ExternalNotificationRetirementClassification,
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
    replacementRegistrationId:
      String(formData.get("replacementRegistrationId") ?? "").trim() || null,
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function closeExternalConnectorRetirement(
  formData: FormData,
): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  closeExternalNotificationRetirement({
    registrationId: String(formData.get("registrationId") ?? ""),
    credentialRevocationRef: String(
      formData.get("credentialRevocationRef") ?? "",
    ).trim(),
    providerCallbackDisableRef: String(
      formData.get("providerCallbackDisableRef") ?? "",
    ).trim(),
    routingAliasRemovalRef: String(
      formData.get("routingAliasRemovalRef") ?? "",
    ).trim(),
    secretReferenceRemovalRef: String(
      formData.get("secretReferenceRemovalRef") ?? "",
    ).trim(),
    internalQueueAuthoritative:
      formData.get("internalQueueAuthoritative") === "on",
    openOperationalReferences: Number(
      formData.get("openOperationalReferences") ?? "0",
    ),
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function acknowledgeNotification(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  acknowledgeIncidentNotification({
    notificationId: String(formData.get("notificationId") ?? ""),
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

export default async function EvidenceRecomputationPage() {
  ensureProductionRecomputationBindings();
  const activation = evidenceRecomputationActivationStatus();
  const session = await getServerSession(authOptions);
  const mayApprove = canApproveSourceLegal(session?.user?.email ?? null);
  const registrations = listGovernedRecomputationHandlers();
  const latest = [...registrations]
    .reverse()
    .filter((r, i, a) => a.findIndex((x) => x.kind === r.kind) === i);
  const packets = listEvidenceReplayPackets().slice().reverse();
  const attestations = listReplayAttestations().slice().reverse();
  const batchReplayReceipts = listBatchReplayReceipts().slice(-20).reverse();
  const approvalPackets = listApprovalPackets().slice(-10).reverse();
  const approvalPacketDecisions = listApprovalPacketDecisions()
    .slice(-30)
    .reverse();
  const receipts = listGovernedRecomputationHandlerReceipts()
    .slice(-30)
    .reverse();
  const ceremonyReceipts = listRecomputationActivationReceipts()
    .slice(-20)
    .reverse();
  const finalized = recomputationActivationFinalized();
  const releaseReceipts = listSchedulerReleaseReceipts().slice(-20).reverse();
  const releaseAuthorized = schedulerReleaseAuthorized();
  const canaryPassed = schedulerCanaryPassed();
  const resumePermitted = schedulerResumePermitted();
  const approvalCompletion = approvalCompletionStatus();
  const finalCanaryPacket = currentFinalCanaryReleasePacket();
  const finalCanaryPackets = listFinalCanaryReleasePackets()
    .slice(-20)
    .reverse();
  const steadyIncidentReceipts = listSteadyStateIncidentReceipts()
    .slice(-30)
    .reverse();
  const steadyOpenIncidents = openSteadyStateIncidents();
  evaluateIncidentSlaBreaches();
  deliverPendingIncidentNotifications();
  const incidentSlaReceipts = listIncidentSlaReceipts().slice(-30).reverse();
  const incidentNotificationReceipts = listIncidentNotificationReceipts()
    .slice(-40)
    .reverse();
  const pendingNotifications = pendingIncidentNotifications();
  const externalConnectorRegistrations =
    listExternalNotificationConnectorRegistrations().slice().reverse();
  const externalConnectorReceipts = listExternalNotificationConnectorReceipts()
    .slice(-30)
    .reverse();
  const externalActivationReceipts =
    listExternalNotificationActivationReceipts().slice(-30).reverse();
  const liveExternalConnectors = liveExternalNotificationConnectors();
  const externalDeliveryReceipts = listExternalNotificationDeliveryReceipts()
    .slice(-30)
    .reverse();
  evaluateExternalNotificationAcknowledgments();
  const externalAssuranceReceipts = listExternalNotificationAssuranceReceipts()
    .slice(-40)
    .reverse();
  const externalReinstatementReceipts =
    listExternalNotificationReinstatementReceipts().slice(-30).reverse();
  const externalRetirementReceipts =
    listExternalNotificationRetirementReceipts().slice(-30).reverse();
  const externalRetirementClosureReceipts =
    listExternalNotificationRetirementClosureReceipts().slice(-30).reverse();
  evaluateExternalNotificationRetirementTombstones();
  const externalRetirementTombstoneReceipts =
    listExternalNotificationRetirementTombstoneReceipts().slice(-40).reverse();
  for (const receipt of externalRetirementTombstoneReceipts)
    if (receipt.action === "TOMBSTONE_FAIL")
      containExternalNotificationTombstoneFailure({
        registrationId: receipt.registrationId,
      });
  const externalTombstoneIncidentReceipts =
    listExternalNotificationTombstoneIncidentReceipts().slice(-40).reverse();
  for (const receipt of externalTombstoneIncidentReceipts)
    if (receipt.action === "RESOLVE")
      openExternalNotificationCorrectiveAction({
        registrationId: receipt.registrationId,
      });
  const externalCorrectiveActionReceipts =
    listExternalNotificationCorrectiveActionReceipts().slice(-40).reverse();
  for (const receipt of externalCorrectiveActionReceipts)
    if (receipt.action === "CLOSE_CORRECTIVE_ACTION")
      openExternalNotificationCorrectiveActionEffectivenessWindow({
        registrationId: receipt.registrationId,
      });
  const externalCorrectiveActionEffectivenessReceipts =
    listExternalNotificationCorrectiveActionEffectivenessReceipts()
      .slice(-40)
      .reverse();
  const externalInstitutionalClosureAttestations =
    listExternalNotificationInstitutionalClosureAttestations()
      .slice(-30)
      .reverse();
  const watchdogReceipts = listPostResumeWatchdogReceipts()
    .slice(-20)
    .reverse();
  const canaryTranscripts = listCanaryExecutionTranscripts()
    .slice(-20)
    .reverse();
  const passedCanaryTranscript = currentPassedCanaryTranscript();
  const handoffChecklist = currentReviewHandoffChecklist();
  const handoffReceipts = listReviewHandoffReceipts().slice(-20).reverse();
  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "28px 24px 80px",
        display: "grid",
        gap: 18,
      }}
    >
      <header>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#9a3412" }}>
          INTERNAL · MODULE 45 RECOMPUTATION REVIEW
        </div>
        <h1>Evidence recomputation approvals</h1>
        <p>
          Approval requires a successful deterministic replay attestation for
          the exact handler implementation hash. No attestation, no approval.
        </p>
        <p>
          Scheduler activation: <b>{activation.ready ? "READY" : "BLOCKED"}</b>.
          Approval completion:{" "}
          <b>
            {approvalCompletion.complete &&
            approvalCompletion.allApproved &&
            approvalCompletion.current
              ? "READY"
              : "INCOMPLETE"}
          </b>
          . Ceremony: <b>{finalized ? "FINALIZED" : "OPEN"}</b>. All four
          handlers must be approved, replay-matched, and runtime-bound.
        </p>
        <p>
          Scheduler release:{" "}
          <b>{releaseAuthorized ? "AUTHORIZED" : "BLOCKED"}</b>. Canary:{" "}
          <b>{canaryPassed ? "PASSED" : "NOT PASSED"}</b>. Resume permission:{" "}
          <b>{resumePermitted ? "GRANTED" : "DENIED"}</b>.
        </p>
        <section
          style={{
            padding: 16,
            border: "1px solid #d7deea",
            borderRadius: 12,
            marginTop: 12,
          }}
        >
          <h2>Live readiness checklist</h2>
          <div>
            Approval packet:{" "}
            <b>{handoffChecklist.packetsReady ? "READY" : "MISSING"}</b>
          </div>
          <div>
            Four decisions complete:{" "}
            <b>{handoffChecklist.fourDecisionsComplete ? "YES" : "NO"}</b>
          </div>
          <div>
            All four approved:{" "}
            <b>{handoffChecklist.allApproved ? "YES" : "NO"}</b>
          </div>
          <div>
            Implementations current:{" "}
            <b>{handoffChecklist.implementationsCurrent ? "YES" : "NO"}</b>
          </div>
          <div>
            Technical activation:{" "}
            <b>{handoffChecklist.technicalReady ? "READY" : "BLOCKED"}</b>
          </div>
          <div>
            Final ceremony:{" "}
            <b>{handoffChecklist.ceremonyFinalized ? "FINALIZED" : "OPEN"}</b>
          </div>
          <div>
            Scheduler:{" "}
            <b>
              {handoffChecklist.resumePermitted
                ? "RESUME PERMITTED"
                : "PAUSED / BLOCKED"}
            </b>
          </div>
          {mayApprove && (
            <form
              action={recordHandoff}
              style={{ display: "grid", gap: 8, maxWidth: 700, marginTop: 10 }}
            >
              <textarea
                name="reason"
                required
                placeholder="Reason for handing the completed review to the final ceremony"
              />
              <button
                disabled={
                  !handoffChecklist.packetsReady ||
                  !handoffChecklist.fourDecisionsComplete ||
                  !handoffChecklist.allApproved ||
                  !handoffChecklist.implementationsCurrent ||
                  !handoffChecklist.technicalReady ||
                  handoffChecklist.ceremonyFinalized
                }
              >
                Record final-ceremony handoff
              </button>
            </form>
          )}
        </section>
        {mayApprove && (
          <form
            action={ceremony}
            style={{ display: "grid", gap: 8, maxWidth: 700 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Activation ceremony reason"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button name="action" value="INITIALIZE">
                Initialize live review set
              </button>
              <button
                name="action"
                value="FINALIZE"
                disabled={
                  !activation.ready ||
                  !approvalCompletion.complete ||
                  !approvalCompletion.allApproved ||
                  !approvalCompletion.current
                }
              >
                Finalize activation
              </button>
              <button name="action" value="REVOKE">
                Revoke activation
              </button>
            </div>
          </form>
        )}
        {mayApprove && (
          <form
            action={runBatchReplay}
            style={{ display: "grid", gap: 8, maxWidth: 700, marginTop: 12 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Batch replay verification reason"
            />
            <button>Run all four deterministic replays</button>
          </form>
        )}
        {mayApprove && (
          <form
            action={createCanaryPacket}
            style={{ display: "grid", gap: 8, maxWidth: 700, marginTop: 12 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Final canary release packet reason"
            />
            <button disabled={!finalized}>
              Create final canary release packet
            </button>
          </form>
        )}
        {mayApprove && (
          <form
            action={schedulerRelease}
            style={{ display: "grid", gap: 8, maxWidth: 700, marginTop: 12 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Scheduler release reason"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                name="action"
                value="AUTHORIZE"
                disabled={!activation.ready || !finalized || !finalCanaryPacket}
              >
                Authorize paused scheduler canary
              </button>
              <button name="action" value="REVOKE">
                Revoke scheduler release
              </button>
            </div>
          </form>
        )}
      </header>
      {latest.map((r) => (
        <section
          key={r.kind}
          style={{
            padding: 20,
            border: "1px solid #d7deea",
            borderRadius: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <strong>
            {r.kind} · {r.handlerId}
          </strong>
          <div>
            Status: <b>{r.status}</b>
          </div>
          <code style={{ overflowWrap: "anywhere" }}>
            Implementation {r.implementationHash}
          </code>
          <div>Source: {r.sourcePath}</div>
          {mayApprove && (
            <form
              action={decide}
              style={{ display: "grid", gap: 8, maxWidth: 700 }}
            >
              <input type="hidden" name="kind" value={r.kind} />
              <textarea
                name="reason"
                required
                placeholder="Human review reason"
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button name="decision" value="APPROVE">
                  Approve exact implementation
                </button>
                <button name="decision" value="SUSPEND">
                  Suspend
                </button>
              </div>
            </form>
          )}
        </section>
      ))}
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Signed replay packets</h2>
        {packets.length === 0 ? (
          <p>No replay packets are available yet.</p>
        ) : (
          packets.map((p) => (
            <div
              key={p.packetId}
              style={{ padding: "10px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{p.kind}</b> · {p.artifactId}
              <br />
              <code>{p.outputHash}</code>
              {mayApprove && (
                <form action={runReplay} style={{ marginTop: 8 }}>
                  <input type="hidden" name="kind" value={p.kind} />
                  <input type="hidden" name="artifactId" value={p.artifactId} />
                  <button>Run deterministic replay</button>
                </form>
              )}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Replay attestations</h2>
        {attestations.map((a) => (
          <div
            key={a.attestationId}
            style={{ padding: "10px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{a.matched ? "MATCH" : "FAIL"}</b> · {a.kind} · {a.artifactId} ·{" "}
            {a.executedAt}
            <br />
            <code>{a.implementationHash}</code>
            {a.reasons.length ? (
              <>
                <br />
                {a.reasons.join(", ")}
              </>
            ) : null}
          </div>
        ))}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Batch replay verification receipts</h2>
        {batchReplayReceipts.length === 0 ? (
          <p>No batch replay verification receipts.</p>
        ) : (
          batchReplayReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.allMatched ? "ALL MATCHED" : "REVIEW REQUIRED"}</b> ·{" "}
              {r.actorName} · {r.at}
              <br />
              {r.reason}
              <br />
              {r.results
                .map((x) => `${x.kind}:${x.matched ? "MATCH" : "FAIL"}`)
                .join(", ")}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Four-decision approval packet</h2>
        {mayApprove && (
          <form
            action={createDecisionPacket}
            style={{ display: "grid", gap: 8, maxWidth: 700 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Reason for preparing the four-decision packet"
            />
            <button>Create packet from latest all-matched batch replay</button>
          </form>
        )}
        {approvalPackets.length === 0 ? (
          <p>No approval packet has been prepared.</p>
        ) : (
          approvalPackets.map((packet) => (
            <div
              key={packet.packetId}
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <b>Packet {packet.packetId}</b> · batch {packet.batchReceiptId}
              <br />
              {packet.items.map((item) => (
                <form
                  key={item.kind}
                  action={decidePacketItem}
                  style={{
                    display: "grid",
                    gap: 6,
                    marginTop: 12,
                    maxWidth: 760,
                  }}
                >
                  <input
                    type="hidden"
                    name="packetId"
                    value={packet.packetId}
                  />
                  <input type="hidden" name="kind" value={item.kind} />
                  <div>
                    <b>{item.kind}</b> · <code>{item.implementationHash}</code>
                    <br />
                    Attestation {item.attestationId}
                  </div>
                  <textarea
                    name="reason"
                    required
                    placeholder={`Separate decision reason for ${item.kind}`}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button name="decision" value="APPROVE">
                      Approve this implementation
                    </button>
                    <button name="decision" value="SUSPEND">
                      Suspend this implementation
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ))
        )}
        <h3>Packet decisions</h3>
        {approvalPacketDecisions.length === 0 ? (
          <p>No packet decisions recorded.</p>
        ) : (
          approvalPacketDecisions.map((d) => (
            <div
              key={d.decisionId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{d.decision}</b> · {d.kind} · {d.actorName} · {d.at}
              <br />
              {d.reason}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Approval receipts</h2>
        {receipts.map((r) => (
          <div
            key={r.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{r.decision}</b> · {r.kind} · {r.actorName} · {r.at}
            <br />
            {r.reason}
          </div>
        ))}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Final-ceremony handoff receipts</h2>
        {handoffReceipts.length === 0 ? (
          <p>No handoff receipts recorded.</p>
        ) : (
          handoffReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>READY FOR FINAL CEREMONY</b> · {r.actorName} · {r.at}
              <br />
              {r.reason}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Activation ceremony receipts</h2>
        {ceremonyReceipts.length === 0 ? (
          <p>No activation ceremony receipts.</p>
        ) : (
          ceremonyReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.action}</b> · {r.actorName} · {r.at} · ready{" "}
              {String(r.readyAtDecision)}
              <br />
              {r.reason}
            </div>
          ))
        )}
      </section>

      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Final canary release packets</h2>
        {finalCanaryPackets.length === 0 ? (
          <p>No final canary release packets.</p>
        ) : (
          finalCanaryPackets.map((p) => (
            <div
              key={p.packetId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{p.ready ? "READY" : "BLOCKED"}</b> · {p.actorName} · {p.at}
              <br />
              Approval {p.approvalPacketId} · Handoff {p.handoffReceiptId} ·
              Ceremony {p.ceremonyReceiptId}
              <br />
              {p.reason}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Canary execution transcripts</h2>
        <p>
          Current matching passed transcript:{" "}
          <b>{passedCanaryTranscript ? "READY" : "MISSING"}</b>.
        </p>
        {canaryTranscripts.length === 0 ? (
          <p>No canary execution transcripts.</p>
        ) : (
          canaryTranscripts.map((r) => (
            <div
              key={r.transcriptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.status}</b> · run {r.canaryRunId} · packet {r.finalPacketId}
              <br />
              jobs {String(r.jobCount ?? 0)} · queued{" "}
              {String(r.queuedCount ?? 0)} · duration{" "}
              {String(r.durationMs ?? 0)} ms
              <br />
              <code>{r.jobResultHash ?? "pending"}</code>
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Post-resume watchdog receipts</h2>
        {watchdogReceipts.length === 0 ? (
          <p>
            No recurring executions have entered the guarded post-resume window.
          </p>
        ) : (
          watchdogReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.action}</b> · {r.at} · execution {r.executionId}
              <br />
              Guard window: {String(r.withinGuardWindow)} · jobs {r.jobCount} ·
              failed {r.failedJobIds.length} · blocked {r.blockedJobIds.length}
              {r.pauseError ? (
                <>
                  <br />
                  Pause error: {r.pauseError}
                </>
              ) : null}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Steady-state recomputation incidents</h2>
        {steadyOpenIncidents.length === 0 ? (
          <p>No open steady-state incidents.</p>
        ) : (
          steadyOpenIncidents.map((r) => (
            <form
              key={r.incidentId}
              action={decideSteadyIncident}
              style={{
                display: "grid",
                gap: 8,
                padding: "10px 0",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <input type="hidden" name="incidentId" value={r.incidentId} />
              <b>OPEN · {r.incidentId}</b>
              <div>
                Execution {r.executionId} · failed {r.failedJobIds.length} ·
                blocked {r.blockedJobIds.length}
              </div>
              {(() => {
                const sla = incidentSlaStatus(r.incidentId);
                return sla ? (
                  <div>
                    Severity <b>{sla.severity}</b> · acknowledge by{" "}
                    {sla.acknowledgeBy} · resolve by {sla.resolveBy}
                  </div>
                ) : null;
              })()}
              <textarea
                name="reason"
                required
                placeholder="Incident decision reason"
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button name="action" value="ACKNOWLEDGE">
                  Acknowledge
                </button>
                <button name="action" value="ESCALATE">
                  Escalate
                </button>
                <button name="action" value="RESOLVE">
                  Resolve
                </button>
              </div>
            </form>
          ))
        )}
        <h3>SLA receipts</h3>
        {incidentSlaReceipts.length === 0 ? (
          <p>No incident SLA receipts.</p>
        ) : (
          incidentSlaReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.action}</b> · {r.severity} · {r.at}
              <br />
              Ack by {r.acknowledgeBy} · resolve by {r.resolveBy}
              <br />
              {r.reason}
            </div>
          ))
        )}
        <h3>Module 45 incident notifications</h3>
        {pendingNotifications.length === 0 ? (
          <p>No unacknowledged incident notifications.</p>
        ) : (
          pendingNotifications.map((notification) => (
            <form
              key={notification.notificationId}
              action={acknowledgeNotification}
              style={{
                display: "grid",
                gap: 8,
                padding: "10px 0",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <input
                type="hidden"
                name="notificationId"
                value={notification.notificationId}
              />
              <b>
                {notification.severity} · {notification.slaAction} ·{" "}
                {notification.incidentId}
              </b>
              <div>
                Internal Module 45 queue · payload{" "}
                {notification.payloadHash.slice(0, 16)}…
              </div>
              <textarea
                name="reason"
                required
                placeholder="Notification acknowledgment reason"
              />
              <button disabled={!mayApprove}>Acknowledge notification</button>
            </form>
          ))
        )}
        <h4>Notification delivery receipts</h4>
        {incidentNotificationReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.severity} · {receipt.slaAction} ·{" "}
            {receipt.at}
            <br />
            {receipt.channel} · {receipt.actorName}
            <br />
            {receipt.reason}
          </div>
        ))}
        <h3>Incident receipts</h3>
        {steadyIncidentReceipts.map((r) => (
          <div
            key={r.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{r.action}</b> · {r.actorName} · {r.at}
            <br />
            {r.reason}
          </div>
        ))}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>External notification connector review</h2>
        <p>
          External email, SMS, and paging remain disabled unless the current
          implementation is separately approved.
        </p>
        {externalConnectorRegistrations.length === 0 ? (
          <p>No external notification connectors are registered.</p>
        ) : (
          externalConnectorRegistrations.map((registration) => (
            <form
              key={registration.registrationId}
              action={decideExternalNotificationConnectorAction}
              style={{
                display: "grid",
                gap: 8,
                padding: "10px 0",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <input
                type="hidden"
                name="registrationId"
                value={registration.registrationId}
              />
              <b>
                {registration.channel} · {registration.connectorId}
              </b>
              <code>{registration.implementationHash}</code>
              <div>
                Credentials: {registration.credentialMode} · delivery:{" "}
                {registration.deliverySemantics}
              </div>
              <div>Replay evidence: {registration.replayEvidenceHash}</div>
              <textarea
                name="reason"
                required
                placeholder="Connector review reason"
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button name="decision" value="APPROVE" disabled={!mayApprove}>
                  Approve current implementation
                </button>
                <button name="decision" value="SUSPEND" disabled={!mayApprove}>
                  Suspend
                </button>
              </div>
            </form>
          ))
        )}
        <h3>Live activation decisions</h3>
        {externalConnectorRegistrations.map((registration) => {
          const isLive = liveExternalConnectors.some(
            (x) => x.registrationId === registration.registrationId,
          );
          return (
            <form
              key={`activation-${registration.registrationId}`}
              action={decideExternalNotificationActivationAction}
              style={{
                display: "grid",
                gap: 8,
                padding: "10px 0",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <input
                type="hidden"
                name="registrationId"
                value={registration.registrationId}
              />
              <b>
                {registration.channel} · {registration.connectorId} ·{" "}
                {isLive ? "LIVE" : "NOT LIVE"}
              </b>
              <textarea
                name="reason"
                required
                placeholder="Live activation or revocation reason"
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button name="action" value="ACTIVATE" disabled={!mayApprove}>
                  Activate live delivery
                </button>
                <button name="action" value="REVOKE" disabled={!mayApprove}>
                  Revoke live delivery
                </button>
              </div>
            </form>
          );
        })}
        <h4>Activation receipts</h4>
        {externalActivationReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.channel} · {receipt.connectorId}{" "}
            · {receipt.at}
            <br />
            Dry run {receipt.dryRunReceiptId} · {receipt.actorName} ·{" "}
            {receipt.reason}
          </div>
        ))}
        <h3>Live external delivery receipts</h3>
        {externalDeliveryReceipts.length === 0 ? (
          <p>No governed live external deliveries have occurred.</p>
        ) : (
          externalDeliveryReceipts.map((receipt) => (
            <div
              key={receipt.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{receipt.action}</b> · {receipt.channel} ·{" "}
              {receipt.connectorId} · {receipt.at}
              <br />
              notification {receipt.notificationId} · payload{" "}
              {receipt.payloadHash.slice(0, 16)}…
              <br />
              {receipt.reason}
            </div>
          ))
        )}
        <h3>Connector receipts</h3>
        {externalConnectorReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.channel} · {receipt.connectorId}{" "}
            · {receipt.at}
            <br />
            {receipt.actorName} · {receipt.reason}
          </div>
        ))}
        <h3>Connector reinstatement and probation</h3>
        {externalConnectorRegistrations.map((registration) => (
          <form
            key={`reinstate-${registration.registrationId}`}
            action={reinstateExternalConnector}
            style={{
              display: "grid",
              gap: 8,
              padding: "10px 0",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <input
              type="hidden"
              name="registrationId"
              value={registration.registrationId}
            />
            <b>
              {registration.connectorId} ·{" "}
              {connectorInProbation(registration.registrationId)
                ? "PROBATION"
                : "NOT IN PROBATION"}
            </b>
            <textarea
              name="reason"
              required
              placeholder="Reinstatement reason after fresh dry run"
            />
            <button disabled={!mayApprove}>
              Reinstate into guarded probation
            </button>
          </form>
        ))}
        {externalReinstatementReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.channel} · {receipt.connectorId}{" "}
            · {receipt.at}
            <br />
            Probation acknowledgments {receipt.probationAcknowledgedDeliveries}/
            {receipt.probationRequiredDeliveries}
            <br />
            {receipt.reason}
          </div>
        ))}
        <h3>Permanent connector retirement</h3>
        <p>
          Retirement is irreversible for the bound registration and
          implementation hash. A replacement must begin with a fresh
          registration.
        </p>
        {externalConnectorRegistrations.map((registration) => (
          <form
            key={`retire-${registration.registrationId}`}
            action={retireExternalConnector}
            style={{
              display: "grid",
              gap: 8,
              padding: "10px 0",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <input
              type="hidden"
              name="registrationId"
              value={registration.registrationId}
            />
            <b>
              {registration.connectorId} · {registration.channel} ·{" "}
              {externalNotificationRegistrationRetired(
                registration.registrationId,
              )
                ? "RETIRED"
                : "ACTIVE REGISTRATION"}
            </b>
            <select name="classification" required defaultValue="">
              <option value="" disabled>
                Select retirement classification
              </option>
              <option value="SECURITY_RETIREMENT">Security retirement</option>
              <option value="PROVIDER_TERMINATION">Provider termination</option>
              <option value="IMPLEMENTATION_OBSOLESCENCE">
                Implementation obsolescence
              </option>
              <option value="POLICY_PROHIBITION">Policy prohibition</option>
              <option value="OPERATOR_DECOMMISSION">
                Operator decommission
              </option>
              <option value="SUPERSEDED_IMPLEMENTATION">
                Superseded implementation
              </option>
            </select>
            <input
              name="replacementRegistrationId"
              placeholder="Optional replacement registration ID"
            />
            <textarea
              name="reason"
              required
              placeholder="Permanent retirement reason"
            />
            <button
              disabled={
                !mayApprove ||
                externalNotificationRegistrationRetired(
                  registration.registrationId,
                )
              }
            >
              Permanently retire registration
            </button>
          </form>
        ))}
        {externalRetirementReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.classification} ·{" "}
            {receipt.channel} · {receipt.connectorId} · {receipt.at}
            <br />
            implementation {receipt.implementationHash.slice(0, 16)}… ·
            revocation {receipt.revocationReceiptId}
            <br />
            {receipt.reason}
          </div>
        ))}

        <h3>Retirement closure and decommission verification</h3>
        <p>
          Closure proves that the retired registration has no remaining
          credential, callback, routing, secret-reference, or operational path.
        </p>
        {externalConnectorRegistrations
          .filter((registration) =>
            externalNotificationRegistrationRetired(
              registration.registrationId,
            ),
          )
          .map((registration) => (
            <form
              key={`retirement-closure-${registration.registrationId}`}
              action={closeExternalConnectorRetirement}
              style={{
                display: "grid",
                gap: 8,
                padding: "10px 0",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <input
                type="hidden"
                name="registrationId"
                value={registration.registrationId}
              />
              <b>
                {registration.connectorId} · {registration.channel} ·{" "}
                {externalNotificationRetirementClosed(
                  registration.registrationId,
                )
                  ? "CLOSED"
                  : "RETIREMENT OPEN"}
              </b>
              <input
                name="credentialRevocationRef"
                required
                placeholder="Credential revocation evidence reference"
              />
              <input
                name="providerCallbackDisableRef"
                required
                placeholder="Provider callback disablement reference"
              />
              <input
                name="routingAliasRemovalRef"
                required
                placeholder="Routing alias removal reference"
              />
              <input
                name="secretReferenceRemovalRef"
                required
                placeholder="Runtime secret-reference removal reference"
              />
              <label>
                Open operational references{" "}
                <input
                  name="openOperationalReferences"
                  type="number"
                  min="0"
                  defaultValue="0"
                  required
                />
              </label>
              <label>
                <input
                  name="internalQueueAuthoritative"
                  type="checkbox"
                  required
                />{" "}
                Module 45 internal queue remains authoritative
              </label>
              <textarea
                name="reason"
                required
                placeholder="Retirement closure reason"
              />
              <button
                disabled={
                  !mayApprove ||
                  externalNotificationRetirementClosed(
                    registration.registrationId,
                  )
                }
              >
                Close retirement
              </button>
            </form>
          ))}
        {externalRetirementClosureReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.channel} · {receipt.connectorId}{" "}
            · {receipt.at}
            <br />
            credential {receipt.credentialRevocationRef} · callback{" "}
            {receipt.providerCallbackDisableRef}
            <br />
            alias {receipt.routingAliasRemovalRef} · secret{" "}
            {receipt.secretReferenceRemovalRef}
            <br />
            open references {receipt.openOperationalReferences} · internal queue
            authoritative
            <br />
            {receipt.reason}
          </div>
        ))}
        <h3>Retirement tombstone surveillance</h3>
        <p>
          Closed registrations remain under permanent surveillance for stale
          approval, activation, dry-run, delivery, or reinstatement evidence.
        </p>
        {externalRetirementClosureReceipts.map((closure) => (
          <div
            key={`tombstone-status-${closure.registrationId}`}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>
              {closure.connectorId} · {closure.channel} ·{" "}
              {retirementTombstoneHealthy(closure.registrationId)
                ? "TOMBSTONE HEALTHY"
                : "TOMBSTONE REVIEW REQUIRED"}
            </b>
            <br />
            registration {closure.registrationId} · closure {closure.receiptId}
          </div>
        ))}
        {externalRetirementTombstoneReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.channel} · {receipt.connectorId}{" "}
            · {receipt.at}
            <br />
            checked through {receipt.checkedThrough} · prohibited events{" "}
            {receipt.prohibitedEventCount}
            {receipt.prohibitedEventRefs.length > 0 ? (
              <>
                <br />
                {receipt.prohibitedEventRefs.join(" · ")}
              </>
            ) : null}
            <br />
            {receipt.reason}
          </div>
        ))}
        <h3>Tombstone breach containment</h3>
        <p>
          Every tombstone failure is automatically contained as SEV-1. Module 45
          must acknowledge the incident before it can be resolved; external
          delivery remains blocked.
        </p>
        {externalRetirementTombstoneReceipts
          .filter((receipt) => receipt.action === "TOMBSTONE_FAIL")
          .map((failure) => {
            const status = tombstoneIncidentStatus(failure.registrationId);
            return (
              <form
                key={`tombstone-incident-${failure.registrationId}`}
                action={decideTombstoneIncident}
                style={{
                  display: "grid",
                  gap: 8,
                  padding: "10px 0",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <input
                  type="hidden"
                  name="registrationId"
                  value={failure.registrationId}
                />
                <b>
                  {failure.connectorId} · {failure.channel} · {status}
                </b>
                <select name="action" required defaultValue="">
                  <option value="" disabled>
                    Select Module 45 disposition
                  </option>
                  <option value="ACKNOWLEDGE">
                    Acknowledge and investigate
                  </option>
                  <option value="ESCALATE">Escalate</option>
                  <option value="RESOLVE">Resolve after acknowledgment</option>
                </select>
                <textarea
                  name="reason"
                  required
                  placeholder="Incident disposition reason"
                />
                <button disabled={!mayApprove || status === "RESOLVED"}>
                  Record tombstone incident decision
                </button>
              </form>
            );
          })}
        {externalTombstoneIncidentReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.severity} · {receipt.channel} ·{" "}
            {receipt.connectorId} · {receipt.at}
            <br />
            external delivery blocked · internal queue authoritative · offending
            events {receipt.offendingEventRefs.length}
            {receipt.offendingEventRefs.length ? (
              <>
                <br />
                {receipt.offendingEventRefs.join(" · ")}
              </>
            ) : null}
            <br />
            {receipt.reason}
          </div>
        ))}
        <h3>Post-incident corrective action</h3>
        <p>
          A resolved tombstone incident remains open institutionally until root
          cause and remediation evidence are verified, zero post-resolution
          recurrence events are proven, and Module 45 records final
          corrective-action closure.
        </p>
        {externalTombstoneIncidentReceipts
          .filter((receipt) => receipt.action === "RESOLVE")
          .map((resolution) => {
            const status = correctiveActionStatus(resolution.registrationId);
            return (
              <div
                key={`capa-${resolution.registrationId}`}
                style={{ padding: "10px 0", borderTop: "1px solid #e2e8f0" }}
              >
                <b>
                  {resolution.connectorId} · {resolution.channel} · CORRECTIVE
                  ACTION {status}
                </b>
                {status === "OPEN" ? (
                  <form
                    action={verifyCorrectiveAction}
                    style={{ display: "grid", gap: 8, marginTop: 8 }}
                  >
                    <input
                      type="hidden"
                      name="registrationId"
                      value={resolution.registrationId}
                    />
                    <input
                      name="rootCauseRef"
                      required
                      placeholder="Root-cause evidence reference"
                    />
                    <input
                      name="credentialAuditRef"
                      required
                      placeholder="Credential audit reference"
                    />
                    <input
                      name="providerAuditRef"
                      required
                      placeholder="Provider control audit reference"
                    />
                    <input
                      name="routingAuditRef"
                      required
                      placeholder="Routing audit reference"
                    />
                    <input
                      name="secretAuditRef"
                      required
                      placeholder="Secret-management audit reference"
                    />
                    <input
                      name="codeChangeRef"
                      placeholder="Optional corrective code/change reference"
                    />
                    <textarea
                      name="reason"
                      required
                      placeholder="Why remediation is complete and recurrence risk is controlled"
                    />
                    <button disabled={!mayApprove}>Verify remediation</button>
                  </form>
                ) : null}
                {status === "VERIFIED" ? (
                  <form
                    action={closeCorrectiveAction}
                    style={{ display: "grid", gap: 8, marginTop: 8 }}
                  >
                    <input
                      type="hidden"
                      name="registrationId"
                      value={resolution.registrationId}
                    />
                    <textarea
                      name="reason"
                      required
                      placeholder="Corrective-action closure reason"
                    />
                    <button disabled={!mayApprove}>
                      Close corrective action
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        {externalCorrectiveActionReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.channel} · {receipt.connectorId}{" "}
            · {receipt.at}
            <br />
            recurrence events {receipt.recurrenceEventCount} · external delivery
            blocked · internal queue authoritative
            {receipt.rootCauseRef ? (
              <>
                <br />
                root cause {receipt.rootCauseRef} · credential{" "}
                {receipt.credentialAuditRef} · provider{" "}
                {receipt.providerAuditRef}
              </>
            ) : null}
            {receipt.routingAuditRef ? (
              <>
                <br />
                routing {receipt.routingAuditRef} · secret{" "}
                {receipt.secretAuditRef}
                {receipt.codeChangeRef
                  ? ` · change ${receipt.codeChangeRef}`
                  : ""}
              </>
            ) : null}
            <br />
            {receipt.reason}
          </div>
        ))}
        <h3>Corrective-action effectiveness monitoring</h3>
        <p>
          Closed corrective actions remain under a 72-hour observation window
          with three clean checkpoints separated by at least 24 hours. Any
          recurrence blocks closure.
        </p>
        {externalCorrectiveActionReceipts
          .filter((receipt) => receipt.action === "CLOSE_CORRECTIVE_ACTION")
          .map((receipt) => {
            const status = correctiveActionEffectivenessStatus(
              receipt.registrationId,
            );
            return (
              <div
                key={`effectiveness-${receipt.registrationId}`}
                style={{ padding: "10px 0", borderTop: "1px solid #e2e8f0" }}
              >
                <b>
                  {receipt.connectorId} · {receipt.channel} · EFFECTIVENESS{" "}
                  {status}
                </b>
                {status !== "CLOSED" && status !== "FAILED" ? (
                  <form
                    action={evaluateCorrectiveActionEffectiveness}
                    style={{ display: "grid", gap: 8, marginTop: 8 }}
                  >
                    <input
                      type="hidden"
                      name="registrationId"
                      value={receipt.registrationId}
                    />
                    <button disabled={!mayApprove}>
                      Run due effectiveness checkpoint
                    </button>
                  </form>
                ) : null}
                {status === "CHECKPOINT_3" ? (
                  <form
                    action={closeCorrectiveActionEffectiveness}
                    style={{ display: "grid", gap: 8, marginTop: 8 }}
                  >
                    <input
                      type="hidden"
                      name="registrationId"
                      value={receipt.registrationId}
                    />
                    <textarea
                      name="reason"
                      required
                      placeholder="Why the 72-hour effectiveness window may close"
                    />
                    <button disabled={!mayApprove}>
                      Close effectiveness window
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        {externalCorrectiveActionEffectivenessReceipts.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · checkpoint {receipt.checkpointNumber}/
            {receipt.requiredCheckpoints} · {receipt.channel} ·{" "}
            {receipt.connectorId} · {receipt.at}
            <br />
            observation {receipt.observationWindowHours}h · recurrence events{" "}
            {receipt.recurrenceEventCount} · external delivery blocked ·
            internal queue authoritative
            {receipt.recurrenceEventRefs.length ? (
              <>
                <br />
                {receipt.recurrenceEventRefs.join(" · ")}
              </>
            ) : null}
            <br />
            {receipt.reason}
          </div>
        ))}

        <h3>Independent institutional closure</h3>
        <p>
          A closed effectiveness window still requires an independent Module 45
          actor to attest the complete incident, remediation, effectiveness, and
          tombstone evidence snapshot.
        </p>
        {externalCorrectiveActionEffectivenessReceipts
          .filter((receipt) => receipt.action === "CLOSE_EFFECTIVENESS_WINDOW")
          .map((receipt) => (
            <div
              key={`institutional-closure-${receipt.registrationId}`}
              style={{ padding: "10px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>
                {receipt.connectorId} · {receipt.channel} ·{" "}
                {externalNotificationInstitutionallyClosed(
                  receipt.registrationId,
                )
                  ? "INSTITUTIONALLY CLOSED"
                  : "INDEPENDENT ATTESTATION REQUIRED"}
              </b>
              {!externalNotificationInstitutionallyClosed(
                receipt.registrationId,
              ) ? (
                <form
                  action={attestInstitutionalClosure}
                  style={{ display: "grid", gap: 8, marginTop: 8 }}
                >
                  <input
                    type="hidden"
                    name="registrationId"
                    value={receipt.registrationId}
                  />
                  <input
                    name="attestationScope"
                    required
                    placeholder="Attestation scope and evidence reviewed"
                  />
                  <textarea
                    name="reason"
                    required
                    placeholder="Independent institutional closure rationale"
                  />
                  <button disabled={!mayApprove}>
                    Attest institutional closure
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        {externalInstitutionalClosureAttestations.map((receipt) => (
          <div
            key={receipt.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{receipt.action}</b> · {receipt.channel} · {receipt.connectorId}{" "}
            · {receipt.at}
            <br />
            independent actor {receipt.actorName} · evidence snapshot{" "}
            {receipt.evidenceSnapshotHash.slice(0, 20)}…
            <br />
            effectiveness {receipt.effectivenessClosureReceiptId} · corrective
            action {receipt.correctiveActionClosureReceiptId}
            <br />
            {receipt.attestationScope} · {receipt.reason}
          </div>
        ))}
        <h3>External delivery assurance receipts</h3>
        {externalAssuranceReceipts.length === 0 ? (
          <p>No external delivery acknowledgment or timeout receipts.</p>
        ) : (
          externalAssuranceReceipts.map((receipt) => (
            <div
              key={receipt.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{receipt.action}</b> · {receipt.channel} ·{" "}
              {receipt.connectorId} · {receipt.at}
              <br />
              Notification {receipt.notificationId} · acknowledge by{" "}
              {receipt.acknowledgeBy}
              <br />
              {receipt.reason}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Scheduler release receipts</h2>
        {releaseReceipts.length === 0 ? (
          <p>No scheduler release receipts.</p>
        ) : (
          releaseReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.action}</b> · {r.actorName} · {r.at} · ready{" "}
              {String(r.activationReady)} · finalized{" "}
              {String(r.ceremonyFinalized)}
              <br />
              {r.reason}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
