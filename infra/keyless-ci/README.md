# Keyless GitHub-to-Google build identity

This isolated Terraform root provisions the no-key CI identity required by
Vol III, Vol III-B, and TECH-SEC-001. GitHub exchanges its protected-main OIDC
token for a short-lived Google credential. No service-account JSON key exists.

The identity can submit and inspect Cloud Builds, upload source only to the
project's Cloud Build bucket, and act only as the existing `furlong-build`
executor. It cannot read Secret Manager, invoke Furlong, access Cloud SQL, or
read borrower documents.

The GitHub workflow is manually dispatched so CI does not create build spend
without an operator decision. Each request carries the exact commit and ref;
the image receives an OCI revision label.

Run `terraform init`, `terraform plan`, and `terraform apply` from this folder.
Local state is ignored and must be preserved in the governed operator backup;
migrate it to a locked remote backend before a second operator manages it.
