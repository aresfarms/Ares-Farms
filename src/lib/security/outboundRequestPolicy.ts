import { isLoopbackHostname } from "@/lib/security/requestGuards";
import { PARCEL_SOURCE_HOSTS } from "@/lib/property/parcelSourceRegistry";

const STATIC_ALLOWED_HOSTS = new Set([
  "geocoding.geo.census.gov",
  "hazards.fema.gov",
  "mapservices.nps.gov",
  "services.arcgis.com",
  "services6.arcgis.com",
  "opendata.arcgis.com",
  "mdgeodata.md.gov",
  "map.sussexcountyde.gov",
  "www.treasury.gov",
  "realestatesales.gov",
  // National parcel coverage: every verified statewide/county government parcel
  // service registered in parcelSourceRegistry. Adding a source there governs its
  // egress here automatically — no source can open an ungoverned path.
  ...PARCEL_SOURCE_HOSTS,
]);

function configuredAllowedHosts(): Set<string> {
  const hosts = new Set<string>(STATIC_ALLOWED_HOSTS);
  const envUrlVars = [
    "PROPERTY_UPLOAD_SCAN_URL",
  ];

  for (const key of envUrlVars) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      hosts.add(new URL(raw).hostname.toLowerCase());
    } catch {
      // Ignore malformed configuration here; callers will still fail when used.
    }
  }

  return hosts;
}

export function assertAllowedOutboundUrl(url: string | URL): URL {
  const parsed = url instanceof URL ? url : new URL(url);
  const protocol = parsed.protocol.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();

  if (protocol !== "https:" && !(protocol === "http:" && isLoopbackHostname(hostname))) {
    throw new Error(`Outbound request blocked: ${parsed.origin} does not use an approved transport.`);
  }

  if (!configuredAllowedHosts().has(hostname)) {
    throw new Error(`Outbound request blocked: ${hostname} is not on the governed allowlist.`);
  }

  return parsed;
}

export async function governedFetch(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  const parsed = assertAllowedOutboundUrl(url);
  return fetch(parsed, init);
}
