# Staging image-approval authority. The project policy can require this
# attestor before a Cloud Run resource opts into the default policy. Existing
# revisions are unaffected; each new service revision or job execution is
# evaluated once enable_binary_authorization is explicitly set true.

resource "google_kms_crypto_key" "release_attestor" {
  name     = "furlong-release-attestor"
  key_ring = data.google_kms_key_ring.plaid.id
  purpose  = "ASYMMETRIC_SIGN"

  version_template {
    algorithm        = "EC_SIGN_P256_SHA256"
    protection_level = "SOFTWARE"
  }

  lifecycle {
    prevent_destroy = true
  }
}

data "google_kms_crypto_key_version" "release_attestor" {
  crypto_key = google_kms_crypto_key.release_attestor.id
  version    = 1
}

resource "google_kms_crypto_key_iam_member" "release_attestor_signers" {
  for_each = var.binary_authorization_signer_principals

  crypto_key_id = google_kms_crypto_key.release_attestor.id
  role          = "roles/cloudkms.signerVerifier"
  member        = each.value
}
resource "google_container_analysis_note" "release_attestor" {
  project           = var.project_id
  name              = "furlong-release-approval"
  short_description = "Approved zero-HIGH/CRITICAL Furlong release digests"

  attestation_authority {
    hint {
      human_readable_name = "Furlong governed staging release approval"
    }
  }
}

resource "google_binary_authorization_attestor" "release" {
  project     = var.project_id
  name        = "furlong-release-approval"
  description = "Requires a founder-approved attestation after vulnerability gates pass."

  attestation_authority_note {
    note_reference = google_container_analysis_note.release_attestor.id

    public_keys {
      id = data.google_kms_crypto_key_version.release_attestor.name

      pkix_public_key {
        public_key_pem      = data.google_kms_crypto_key_version.release_attestor.public_key[0].pem
        signature_algorithm = "ECDSA_P256_SHA256"
      }
    }
  }
}
resource "google_binary_authorization_policy" "staging" {
  project                       = var.project_id
  description                   = "Enforce approved, attested Furlong digests for opted-in Cloud Run resources."
  global_policy_evaluation_mode = "ENABLE"

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    require_attestations_by = [
      "projects/${var.project_id}/attestors/${google_binary_authorization_attestor.release.name}",
    ]
  }
}
