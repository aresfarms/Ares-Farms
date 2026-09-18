export type CompensationFactState = "DISCLOSED" | "VERIFIED" | "UNKNOWN" | "NOT_APPLICABLE";
export type CompensationSourceType =
  | "BUYER_AGREEMENT"
  | "LISTING_AGREEMENT"
  | "PURCHASE_OFFER"
  | "CLOSING_DISCLOSURE"
  | "AUTHORIZED_OFF_MLS_DISCLOSURE"
  | "CUSTOMER_STATEMENT"
  | "NONE";

export interface CompensationAmount {
  type: "ZERO" | "FLAT" | "PERCENT" | "HOURLY" | "OTHER" | "UNKNOWN";
  value: number | null;
  description: string | null;
}

export interface RealEstateCompensationInput {
  jurisdiction: string | null;
  consumerRole: "BUYER" | "SELLER" | "BOTH" | "UNREPRESENTED" | "UNKNOWN";
  buyerAgreementStatus: "NOT_SIGNED" | "SIGNED" | "NOT_APPLICABLE" | "UNKNOWN";
  buyerBrokerCompensation: CompensationAmount;
  listingBrokerCompensation: CompensationAmount;
  sellerAuthorizedBuyerBrokerPayment: CompensationAmount;
  sellerConcession: CompensationAmount;
  additionalFees: Array<{ label: string; amount: CompensationAmount; refundable: boolean | null }>;
  agreementTerm: string | null;
  terminationTerms: string | null;
  carryoverPeriod: string | null;
  dualAgencyOrConflictDisclosure: string | null;
  sourceType: CompensationSourceType;
  sourceReference: string | null;
  disclosureAuthorized: boolean;
}

export interface RealEstateCompensationTransparency {
  version: "real-estate-compensation-transparency-v1";
  posture: "CLEAR" | "REVIEW_NEEDED" | "UNKNOWN";
  knownFacts: string[];
  questionsBeforeCommitment: string[];
  reviewFlags: string[];
  legalBoundary: string[];
}

function formatAmount(amount: CompensationAmount): string {
  if (amount.type === "ZERO") return "$0";
  if (amount.type === "FLAT" && amount.value != null) return `$${amount.value.toLocaleString("en-US")}`;
  if (amount.type === "PERCENT" && amount.value != null) return `${amount.value}%`;
  if (amount.type === "HOURLY" && amount.value != null) return `$${amount.value.toLocaleString("en-US")}/hour`;
  if (amount.type === "OTHER" && amount.description) return amount.description;
  return "not yet provided";
}

function isOpenEnded(amount: CompensationAmount): boolean {
  const text = amount.description?.toLowerCase() ?? "";
  return amount.type === "UNKNOWN" || /whatever|any amount|seller offers|to be determined|tbd/.test(text);
}

export function buildRealEstateCompensationTransparency(
  input: RealEstateCompensationInput,
): RealEstateCompensationTransparency {
  if (input.sourceType === "AUTHORIZED_OFF_MLS_DISCLOSURE" && !input.disclosureAuthorized) {
    throw new Error("Off-MLS compensation disclosure requires documented authorization.");
  }

  const knownFacts: string[] = [
    "Broker fees and commissions are not set by law and are negotiable.",
  ];
  const reviewFlags: string[] = [];

  if (input.buyerAgreementStatus === "SIGNED") {
    knownFacts.push(`Buyer-broker compensation stated in the supplied agreement: ${formatAmount(input.buyerBrokerCompensation)}.`);
  } else if (input.consumerRole === "BUYER" || input.consumerRole === "BOTH") {
    reviewFlags.push("No signed buyer agreement has been supplied for review.");
  }

  if (input.listingBrokerCompensation.type !== "UNKNOWN") {
    knownFacts.push(`Listing-broker compensation disclosed by the supplied record: ${formatAmount(input.listingBrokerCompensation)}.`);
  }
  if (input.sellerAuthorizedBuyerBrokerPayment.type !== "UNKNOWN") {
    knownFacts.push(`Seller-authorized payment toward buyer representation: ${formatAmount(input.sellerAuthorizedBuyerBrokerPayment)}.`);
  }
  if (input.sellerConcession.type !== "UNKNOWN") {
    knownFacts.push(`Seller concession disclosed for transaction costs: ${formatAmount(input.sellerConcession)}.`);
  }

  if (isOpenEnded(input.buyerBrokerCompensation) && input.buyerAgreementStatus === "SIGNED") {
    reviewFlags.push("The buyer compensation term appears open-ended or not objectively ascertainable.");
  }
  if (input.additionalFees.some((fee) => fee.amount.type === "UNKNOWN")) {
    reviewFlags.push("One or more additional brokerage or service fees are not quantified.");
  }
  for (const fee of input.additionalFees) {
    knownFacts.push(`${fee.label}: ${formatAmount(fee.amount)}${fee.refundable == null ? "" : fee.refundable ? " (identified as refundable)" : " (identified as nonrefundable)"}.`);
  }
  if (!input.terminationTerms && input.buyerAgreementStatus === "SIGNED") reviewFlags.push("Termination and cancellation terms were not supplied.");
  if (input.carryoverPeriod) knownFacts.push(`Carryover or protection period: ${input.carryoverPeriod}.`);
  if (input.carryoverPeriod && !input.terminationTerms) reviewFlags.push("A carryover period is disclosed without complete termination terms.");
  if (input.dualAgencyOrConflictDisclosure) knownFacts.push(`Agency/conflict disclosure: ${input.dualAgencyOrConflictDisclosure}.`);

  const questionsBeforeCommitment = [
    "What exact services are included, excluded, or charged separately?",
    "What amount or rate is owed, who may pay it, and can the broker receive more than the consumer agreed to?",
    "Is any retainer, administrative, transaction, technology, showing, cancellation, or early-termination fee charged?",
    "How long does the agreement last, is it exclusive, and how can either party end it?",
    "Does a carryover or protection period create payment obligations after termination?",
    "Could dual agency, designated agency, transaction brokerage, or competing buyers create a conflict?",
    "Which amounts are estimates, which are authorized, and which will appear on the final closing disclosure?",
  ];

  const legalBoundary = [
    "FURLONG does not set, recommend, collect, split, or negotiate broker compensation.",
    "FURLONG does not use MLS data feeds to create or maintain a marketplace of compensation offers.",
    "Compensation terms appear only when supplied or authorized through a lawful agreement or transaction record and are labeled by source.",
    "This section explains disclosed cost terms and questions to ask; it is not legal advice or a substitute for reviewing the controlling agreement with a licensed professional or attorney.",
  ];

  return {
    version: "real-estate-compensation-transparency-v1",
    posture: reviewFlags.length ? "REVIEW_NEEDED" : knownFacts.length > 1 ? "CLEAR" : "UNKNOWN",
    knownFacts,
    questionsBeforeCommitment,
    reviewFlags,
    legalBoundary,
  };
}

export function emptyRealEstateCompensationInput(): RealEstateCompensationInput {
  const unknown: CompensationAmount = { type: "UNKNOWN", value: null, description: null };
  return {
    jurisdiction: null,
    consumerRole: "UNKNOWN",
    buyerAgreementStatus: "UNKNOWN",
    buyerBrokerCompensation: unknown,
    listingBrokerCompensation: unknown,
    sellerAuthorizedBuyerBrokerPayment: unknown,
    sellerConcession: unknown,
    additionalFees: [],
    agreementTerm: null,
    terminationTerms: null,
    carryoverPeriod: null,
    dualAgencyOrConflictDisclosure: null,
    sourceType: "NONE",
    sourceReference: null,
    disclosureAuthorized: false,
  };
}
