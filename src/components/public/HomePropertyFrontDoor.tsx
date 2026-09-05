"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { buildPropertyAnalysisHref } from "@/lib/property/propertyAnalysisHref";
import { startPropertyFactsPrefetch } from "@/lib/property/propertyFactsPrefetch";

type FrontDoorResponse = {
  ok: boolean;
  error?: string;
  propertyId?: string | null;
  canonicalMatch?: { propertyId: string } | null;
  propertyRecord?: {
    propertyType?: string | null;
    rawPropertyStyle?: string | null;
    price?: number | null;
    listingStatus?: string | null;
    town?: string | null;
    county?: string | null;
    state?: string | null;
    description?: string | null;
  } | null;
  verification?: {
    status: "verified" | "partial" | "blocked" | "unverifiable";
    normalizedAddress?: string | null;
    parsedAddress?: { street?: string; city?: string; state?: string; zip?: string } | null;
  } | null;
  verifiedPrograms?: Array<{ name: string }>;
};

export function HomePropertyFrontDoor() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    const rawInput = input.trim();
    if (!rawInput) {
      setError("Enter a complete U.S. property address.");
      return;
    }

    setBusy(true);
    setError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch("/api/public/property-facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          exactAddress: rawInput,
          location: rawInput,
          rawInput,
          startingLens: "property-discovery",
        }),
      });
      const result = (await response.json()) as FrontDoorResponse;
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Furlong could not verify that address.");
      }
      const verification = result.verification;
      if (!verification || verification.status === "blocked" || verification.status === "unverifiable") {
        throw new Error("Furlong could not verify a complete property address. Add the street, city, state, and ZIP when available.");
      }

      const parsed = verification.parsedAddress;
      const normalized = verification.normalizedAddress || rawInput;
      const record = result.propertyRecord;
      const propertyType = record?.propertyType || record?.rawPropertyStyle || "place-led property";
      const location = [record?.town || parsed?.city, record?.state || parsed?.state].filter(Boolean).join(", ") || normalized;
      const href = buildPropertyAnalysisHref({
        propertyId: result.canonicalMatch?.propertyId || result.propertyId || "imported:place-facts",
        title: parsed?.street ? `${parsed.street} analysis` : `${normalized} analysis`,
        location,
        propertyType,
        priceLabel: record?.price != null
          ? `$${record.price.toLocaleString("en-US")}`
          : record?.listingStatus
            ? `${record.listingStatus} · no seller asking price published`
            : "Off market · no seller asking price published",
        vintage: "Current address verification",
        sourceLabel: result.canonicalMatch ? "Furlong canonical property match" : "Furlong verified address check",
        pathways: (result.verifiedPrograms || []).map((program) => program.name),
        exactAddress: normalized,
        town: record?.town || parsed?.city || null,
        county: record?.county || null,
        state: record?.state || parsed?.state || null,
        description: [record?.description, "Entered through the Furlong single property front door."].filter(Boolean).join(" "),
        sourceVerificationStatus: result.canonicalMatch ? "matched-approved-source-record" : "verified-address-only",
        matchedSourceRecordId: result.canonicalMatch?.propertyId || null,
        entryMethod: "manual-address",
        startingLens: "property-discovery",
      });

      const query = new URLSearchParams(href.split("?")[1] || "");
      startPropertyFactsPrefetch({
        propertyId: query.get("propertyId"),
        exactAddress: query.get("exactAddress"),
        location: query.get("location"),
        stateCode: query.get("state"),
        town: query.get("town"),
        county: query.get("county"),
        startingLens: query.get("lens"),
        declaredPropertyType: null,
      });
      router.push(href);
    } catch (caught) {
      const timedOut = caught instanceof DOMException && caught.name === "AbortError";
      setError(timedOut
        ? "The public-source check took too long. Try again in a moment."
        : caught instanceof Error ? caught.message : "Furlong could not verify that address.");
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }

  return (
    <section className="fl-front-door" aria-label="Analyze a property">
      <div className="fl-front-door-copy">
        <span className="fl-front-door-eyebrow">One address. The whole property picture.</span>
        <h2>What could this property become—and how could it be financed?</h2>
        <p>
          Furlong verifies the place, identifies the property type, tests realistic uses,
          compares financing paths, and opens the relevant environmental and decision modules automatically.
        </p>
      </div>
      <div
        className="fl-front-door-form"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void analyze();
          }
        }}
      >
        <label htmlFor="furlong-property-address">Enter a property address</label>
        <div className="fl-front-door-control">
          <input
            id="furlong-property-address"
            data-testid="homepage-property-address"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Street address, city, state and ZIP"
            autoComplete="street-address"
            aria-describedby="front-door-support front-door-error"
          />
          <button
            type="button"
            data-testid="homepage-analyze-property"
            onClick={() => void analyze()}
            disabled={busy}
          >
            {busy ? "Verifying…" : "Analyze this property"}
          </button>
        </div>
        <span id="front-door-support" className="fl-front-door-support">
          No account required. Your address is used to build this analysis—not to decide your eligibility.
        </span>
        <span id="front-door-error" role="alert" className="fl-front-door-error">
          {error}
        </span>
      </div>
      <Link href="/discover?mode=possibilities" className="fl-possibilities-link" data-testid="homepage-possibilities">
        I don’t have a property yet — show me possibilities
      </Link>
      <div className="fl-front-door-outcomes" aria-label="What happens next">
        <span><strong>1</strong> Verify the property</span>
        <span><strong>2</strong> Test uses and constraints</span>
        <span><strong>3</strong> Compare financing and next steps</span>
      </div>
    </section>
  );
}
