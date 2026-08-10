# Governed staging edge. The WAF/backend may be provisioned before DNS cutover.
# Caitlin's direct authenticated founder-testing lane remains independent until
# she explicitly closes every licensed and authority pathway test.
locals {
  edge_enabled       = var.enable_edge_security && var.core_image != ""
  edge_front_enabled = local.edge_enabled && var.edge_hostname != ""
}

resource "google_compute_security_policy" "edge" {
  count   = local.edge_enabled ? 1 : 0
  project = var.project_id
  name    = "furlong-staging-edge-waf"
  type    = "CLOUD_ARMOR"

  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr { expression = "evaluatePreconfiguredWaf('sqli-v33-stable')" }
    }
    description = "Block SQL injection signatures."
  }

  rule {
    action   = "deny(403)"
    priority = 1010
    match {
      expr { expression = "evaluatePreconfiguredWaf('xss-v33-stable')" }
    }
    description = "Block cross-site scripting signatures."
  }

  rule {
    action   = "deny(403)"
    priority = 1020
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('lfi-v33-stable') || evaluatePreconfiguredWaf('rfi-v33-stable') || evaluatePreconfiguredWaf('rce-v33-stable')"
      }
    }
    description = "Block file-inclusion and remote-code-execution signatures."
  }

  rule {
    action   = "rate_based_ban"
    priority = 2000
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["*"] }
    }
    rate_limit_options {
      conform_action   = "allow"
      exceed_action    = "deny(429)"
      enforce_on_key   = "IP"
      ban_duration_sec = 600
      rate_limit_threshold {
        count        = 120
        interval_sec = 60
      }
      ban_threshold {
        count        = 600
        interval_sec = 300
      }
    }

    description = "Per-IP abuse control with bounded temporary bans."
  }

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["*"] }
    }
    description = "Default allow after managed WAF and rate controls."
  }
}

resource "google_compute_region_network_endpoint_group" "edge" {
  count                 = local.edge_enabled ? 1 : 0
  project               = var.project_id
  name                  = "furlong-staging-core-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = google_cloud_run_v2_service.core[0].name
  }
}

resource "google_compute_backend_service" "edge" {
  count                 = local.edge_enabled ? 1 : 0
  project               = var.project_id
  name                  = "furlong-staging-edge-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  timeout_sec           = 30
  security_policy       = google_compute_security_policy.edge[0].id

  backend {
    group = google_compute_region_network_endpoint_group.edge[0].id
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

resource "google_compute_global_address" "edge" {
  count   = local.edge_enabled ? 1 : 0
  project = var.project_id
  name    = "furlong-staging-edge-ip"
}

resource "google_compute_managed_ssl_certificate" "edge" {
  count   = local.edge_front_enabled ? 1 : 0
  project = var.project_id
  name    = "furlong-staging-edge-cert"

  managed {
    domains = [var.edge_hostname]
  }
}

resource "google_compute_url_map" "edge" {
  count           = local.edge_front_enabled ? 1 : 0
  project         = var.project_id
  name            = "furlong-staging-edge-map"
  default_service = google_compute_backend_service.edge[0].id
}

resource "google_compute_target_https_proxy" "edge" {
  count            = local.edge_front_enabled ? 1 : 0
  project          = var.project_id
  name             = "furlong-staging-edge-https"
  url_map          = google_compute_url_map.edge[0].id
  ssl_certificates = [google_compute_managed_ssl_certificate.edge[0].id]
}

resource "google_compute_global_forwarding_rule" "edge_https" {
  count                 = local.edge_front_enabled ? 1 : 0
  project               = var.project_id
  name                  = "furlong-staging-edge-https"
  ip_address            = google_compute_global_address.edge[0].id
  port_range            = "443"
  target                = google_compute_target_https_proxy.edge[0].id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

output "edge_reserved_ip" {
  description = "Reserved WAF edge IP. DNS must not be changed until the governed domain cutover gate passes."
  value       = try(google_compute_global_address.edge[0].address, null)
}

output "edge_https_hostname" {
  description = "Founder-approved HTTPS hostname; null while DNS/front-end activation remains held."
  value       = var.edge_hostname == "" ? null : var.edge_hostname
}
