export type DataClassificationLevel =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED"
  | "SOVEREIGN_CONTROLLED";

export type ProductionDataInventoryEntry = {
  id: string;
  domain: string;
  schemaRefs: string[];
  fields: string[];
  classification: DataClassificationLevel;
  piiTypes: string[];
  purpose: string;
  retentionPolicy: string;
  disposalRule: string;
  legalHoldRule: string;
  redactionRules: string[];
  permittedActors: string[];
  externalDisclosure: "PROHIBITED" | "REDACTED_ONLY" | "AUTHORIZED_ONLY";
  aiUse: "PROHIBITED" | "ADMINISTRATIVE_ONLY" | "GOVERNED_ALLOWED";
  humanApprovalRequired: boolean;
};

export const productionDataInventoryVersion = "p5-b02-data-inventory-v1";

export const productionDataInventory: ProductionDataInventoryEntry[] = [
  {
    id: "PII-IDENTITY-001",
    domain: "identity-and-access",
    schemaRefs: ["users", "applications", "service_requests"],
    fields: ["email", "name", "user_id", "borrower_id", "tenant_id", "actor_id", "contact_name", "contact_email", "contact_phone"],
    classification: "RESTRICTED",
    piiTypes: ["direct-identifier", "contact-pii", "account-identifier"],
    purpose: "Authentication, governed routing, borrower support, and licensed-professional handoff.",
    retentionPolicy: "active-relationship-plus-7-years-or-longer-legal-hold",
    disposalRule: "cryptographic-erasure-or-governed-record-destruction-after-retention-and-hold-clearance",
    legalHoldRule: "suspend-disposal-while-legal-hold-active",
    redactionRules: ["remove-direct-identifiers-from-public-output", "mask-contact-pii-in-external-evidence", "exclude-session-and-tenant-identifiers"],
    permittedActors: ["authorized-operator", "data-rights-officer", "audit-officer", "licensed-spoke-as-needed"],
    externalDisclosure: "AUTHORIZED_ONLY",
    aiUse: "ADMINISTRATIVE_ONLY",
    humanApprovalRequired: true,
  },
  {
    id: "PII-PROPERTY-001",
    domain: "property-and-location",
    schemaRefs: ["properties", "applications", "service_requests"],
    fields: ["address", "city", "state", "zip", "county", "country", "property_id", "property_descriptor", "location_state", "location_county"],
    classification: "CONFIDENTIAL",
    piiTypes: ["precise-location", "property-linkage"],
    purpose: "Eligibility, environmental review, collateral context, and operational routing.",
    retentionPolicy: "application-life-plus-7-years-or-program-specific-longer-period",
    disposalRule: "delete-or-deidentify-after-retention-and-hold-clearance",
    legalHoldRule: "preserve-complete-location-lineage-while-held",
    redactionRules: ["remove-street-address-from-public-output", "generalize-location-to-county-or-region", "remove-property-identifiers"],
    permittedActors: ["authorized-operator", "data-rights-officer", "licensed-spoke-as-needed"],
    externalDisclosure: "REDACTED_ONLY",
    aiUse: "GOVERNED_ALLOWED",
    humanApprovalRequired: true,
  },
  {
    id: "PII-FINANCIAL-001",
    domain: "application-and-financial-context",
    schemaRefs: ["applications", "billing_events", "payment_connector_executions", "treasury_*"],
    fields: ["requested_amount", "requested_programs", "payload", "estimated_value", "payment_reference", "billing_reference"],
    classification: "RESTRICTED",
    piiTypes: ["financial-information", "application-context", "transaction-metadata"],
    purpose: "Program routing, governed readiness review, billing reconciliation, and audit evidence.",
    retentionPolicy: "transaction-or-application-close-plus-7-years-or-longer-regulatory-period",
    disposalRule: "retain-minimum-required-record-then-destroy-sensitive-payloads",
    legalHoldRule: "freeze-disposal-and-preserve-replay-lineage",
    redactionRules: ["remove-account-and-payment-references", "round-or-range-financial-values", "exclude-raw-financial-payloads"],
    permittedActors: ["authorized-operator", "data-rights-officer", "treasury-officer", "audit-officer"],
    externalDisclosure: "AUTHORIZED_ONLY",
    aiUse: "ADMINISTRATIVE_ONLY",
    humanApprovalRequired: true,
  },
  {
    id: "PII-DOCUMENT-001",
    domain: "documents-and-evidence",
    schemaRefs: ["application_documents", "document_storage_handoffs", "report_records"],
    fields: ["document_name", "file_name", "storage_uri", "checksum", "metadata", "application_id", "borrower_id"],
    classification: "RESTRICTED",
    piiTypes: ["document-content", "direct-identifier", "evidence-metadata"],
    purpose: "Document intake, evidence review, replay, audit, and regulated workflow support.",
    retentionPolicy: "document-type-policy-plus-7-years-default",
    disposalRule: "delete-object-and-derived-copies-after-retention-and-hold-clearance",
    legalHoldRule: "preserve-original-checksum-storage-reference-and-custody-lineage",
    redactionRules: ["never-publish-raw-document", "redact-direct-identifiers", "strip-storage-uri-and-checksum-from-external-output"],
    permittedActors: ["authorized-operator", "data-rights-officer", "audit-officer", "human-reviewer"],
    externalDisclosure: "AUTHORIZED_ONLY",
    aiUse: "ADMINISTRATIVE_ONLY",
    humanApprovalRequired: true,
  },
  {
    id: "PII-CREDENTIAL-001",
    domain: "credentials-and-secrets",
    schemaRefs: ["credential_vault_refs", "credentialed_scraping_events"],
    fields: ["vault_ref_id", "credential_type", "holding_actor_id", "license_scope", "expiry_timestamp", "revocation_event_ref"],
    classification: "SOVEREIGN_CONTROLLED",
    piiTypes: ["credential-reference", "license-identity", "security-metadata"],
    purpose: "Governed external access, license verification, revocation, and audit replay.",
    retentionPolicy: "credential-life-plus-7-years-of-audit-metadata-no-secret-material",
    disposalRule: "revoke-and-destroy-secret-material-immediately-when-no-longer-authorized",
    legalHoldRule: "preserve-non-secret-audit-metadata-only",
    redactionRules: ["never-export-secret-material", "redact-vault-and-actor-references", "exclude-license-scope-details-from-public-output"],
    permittedActors: ["security-authority", "credential-holder", "audit-officer"],
    externalDisclosure: "PROHIBITED",
    aiUse: "PROHIBITED",
    humanApprovalRequired: true,
  },
  {
    id: "PII-GOVERNANCE-001",
    domain: "audit-governance-and-replay",
    schemaRefs: ["audit_events", "canonical_ledger", "data_classification_registry", "replay_verification"],
    fields: ["actor_id", "entity_id", "trace_id", "replay_ref", "metadata", "payload_hash", "classification_context"],
    classification: "CONFIDENTIAL",
    piiTypes: ["actor-linkage", "behavioral-metadata", "audit-identifier"],
    purpose: "Accountability, reconstruction, incident response, and regulatory examination readiness.",
    retentionPolicy: "7-years-minimum-or-longer-constitutional-and-regulatory-requirement",
    disposalRule: "append-only-records-expire-only-through-approved-retention-authority",
    legalHoldRule: "indefinite-preservation-while-held",
    redactionRules: ["pseudonymize-actor-identifiers", "exclude-internal-trace-and-replay-identifiers", "release-only-minimum-necessary-audit-fields"],
    permittedActors: ["audit-officer", "data-rights-officer", "security-authority", "authorized-examiner"],
    externalDisclosure: "AUTHORIZED_ONLY",
    aiUse: "GOVERNED_ALLOWED",
    humanApprovalRequired: true,
  },
  {
    id: "PII-NOTICE-001",
    domain: "borrower-notices-and-delivery",
    schemaRefs: ["borrower_notice_deliveries", "borrower_notice_delivery_receipts", "regulated_decision_notices"],
    fields: ["borrower_id", "delivery_address", "delivery_reference", "tracking_reference", "notice_payload", "appeal_context"],
    classification: "RESTRICTED",
    piiTypes: ["contact-pii", "regulated-decision-context", "delivery-metadata"],
    purpose: "Human-approved borrower communications, delivery evidence, dispute, and appeal support.",
    retentionPolicy: "notice-delivery-plus-7-years-or-program-specific-longer-period",
    disposalRule: "destroy-delivery-secrets-and-minimize-receipt-metadata-after-retention",
    legalHoldRule: "preserve-notice-version-delivery-proof-and-appeal-lineage",
    redactionRules: ["redact-borrower-and-delivery-identifiers", "exclude-adverse-action-detail-from-public-output", "release-only-approved-notice-copy"],
    permittedActors: ["authorized-operator", "compliance-officer", "data-rights-officer", "borrower-recipient"],
    externalDisclosure: "AUTHORIZED_ONLY",
    aiUse: "ADMINISTRATIVE_ONLY",
    humanApprovalRequired: true,
  },
  {
    id: "PII-SOVEREIGN-001",
    domain: "sovereign-consent-and-jurisdiction",
    schemaRefs: ["sovereign_consent_gateway_records", "data_classification_registry"],
    fields: ["jurisdiction_scope", "consent_requirements", "sovereign_restriction", "operational_residency", "waiver_reference"],
    classification: "SOVEREIGN_CONTROLLED",
    piiTypes: ["sovereign-affiliation", "jurisdictional-restriction", "consent-lineage"],
    purpose: "Sovereignty enforcement, consent, residency, and cross-boundary restriction governance.",
    retentionPolicy: "authority-life-plus-7-years-and-all-supersession-lineage",
    disposalRule: "no-disposal-without-sovereign-authority-and-data-rights-approval",
    legalHoldRule: "preserve-all-authority-and-consent-lineage",
    redactionRules: ["never-publicly-disclose-sovereign-controlled-record", "remove-person-and-jurisdiction-linkage", "honor-authority-specific-redaction"],
    permittedActors: ["sovereign-authority", "data-rights-officer", "audit-officer"],
    externalDisclosure: "PROHIBITED",
    aiUse: "PROHIBITED",
    humanApprovalRequired: true,
  },
];

export const productionPiiAuthorization = {
  blockerId: "P5-B02",
  authorityRole: "Data Rights Officer",
  approvalRequired: true,
  approvalGranted: false,
  productionPiiPermitted: false,
  condition: "A named Data Rights Officer must approve the inventory, retention, disposal, redaction, and legal-hold controls after reviewing signed evidence.",
} as const;
