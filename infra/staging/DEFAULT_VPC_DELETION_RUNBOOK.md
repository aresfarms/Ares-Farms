# Default VPC Deletion Runbook

This cleanup is intentionally staged outside the normal Terraform apply because
deleting the Google-created `default` network is destructive. The goal is to
remove standing attack surface only after we confirm no workloads still depend
on it.

## Preconditions

- Confirm no Compute Engine VM, forwarding rule, VPN, Cloud NAT, or connector is
  attached to the `default` network.
- Confirm the Furlong staging stack is using only `furlong-staging-vpc`.
- Capture current inventory for the change record.

## Read-only inventory

```bash
gcloud compute instances list --project furlong-staging-499102
gcloud compute firewall-rules list --project furlong-staging-499102 --filter='network=default'
gcloud compute routes list --project furlong-staging-499102 --filter='network=default'
gcloud compute addresses list --project furlong-staging-499102
```

## Deletion sequence

Delete firewall rules on `default` first, then the network itself:

```bash
gcloud compute firewall-rules delete default-allow-icmp default-allow-internal default-allow-rdp default-allow-ssh --project furlong-staging-499102 --quiet
gcloud compute networks delete default --project furlong-staging-499102 --quiet
```

## Post-check

```bash
gcloud compute networks list --project furlong-staging-499102
gcloud compute firewall-rules list --project furlong-staging-499102 --filter='network=default'
```

Expected result: the `default` network is gone and no `default-*` firewall
rules remain.
