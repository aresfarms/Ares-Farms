# Plaid envelope-encryption key lifecycle.
# The key pre-dates Terraform; import it before apply so the rotation schedule is
# managed without replacing key material. Existing versions remain available for
# decryption while new encryptions use the automatically rotated primary.

data "google_kms_key_ring" "plaid" {
  project  = var.project_id
  location = var.region
  name     = "furlong-security"
}

resource "google_kms_crypto_key" "plaid_data" {
  name            = "plaid-data"
  key_ring        = data.google_kms_key_ring.plaid.id
  purpose         = "ENCRYPT_DECRYPT"
  rotation_period = "7776000s"

  lifecycle {
    prevent_destroy = true
  }
}
