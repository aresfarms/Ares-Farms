"use client";

import { useState } from "react";

import {
  allowedImageTypes,
  maxUploadImageBytes,
  validateImageUploadBytes,
} from "@/lib/security/imageUploadGate";

type ImportResponse = {
  ok: boolean;
  analysisHref?: string;
  warnings?: string[];
  error?: string;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read the uploaded file."));
    reader.readAsDataURL(file);
  });
}

export function PropertyImportLaunchpad() {
  return <PropertyImportLaunchpadInner variant="full" />;
}

export function PropertyImportLaunchpadRail() {
  return <PropertyImportLaunchpadInner variant="rail" />;
}

export function PropertyImportLaunchpadEmbedded() {
  return <PropertyImportLaunchpadInner variant="embedded" />;
}

async function validateClientImageFile(file: File): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const result = validateImageUploadBytes({
    mediaType: file.type || null,
    bytes,
  });

  if (!result.ok) {
    return result.error;
  }

  if (file.size > maxUploadImageBytes()) {
    return "The uploaded image is too large for this intake path.";
  }

  return null;
}

function PropertyImportLaunchpadInner({ variant }: { variant: "full" | "rail" | "embedded" }) {
  const [rawInput, setRawInput] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pendingMode, setPendingMode] = useState<"paste" | "image" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const compact = variant !== "full";
  const embedded = variant === "embedded";

  async function launchImport(mode: "paste" | "image") {
    setPendingMode(mode);
    setError(null);
    setWarnings([]);

    try {
      const payload: Record<string, unknown> = {
        mode,
        rawInput,
        notes,
      };

      if (mode === "image" && imageFile) {
        const clientImageError = await validateClientImageFile(imageFile);
        if (clientImageError) {
          throw new Error(clientImageError);
        }
        payload.imageDataUrl = await readFileAsDataUrl(imageFile);
        payload.imageName = imageFile.name;
      }

      const res = await fetch("/api/public/property-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ImportResponse;

      if (!res.ok || !data.ok || !data.analysisHref) {
        throw new Error(data.error || "The property import could not be prepared.");
      }

      setWarnings(data.warnings ?? []);
      window.location.href = data.analysisHref;
    } catch (err) {
      setError(err instanceof Error ? err.message : "The property import could not be prepared.");
    } finally {
      setPendingMode(null);
    }
  }

  return (
    <section
      aria-label={compact ? "Switch property" : "Bring your own property"}
      style={{
        display: "grid",
        gap: compact ? 12 : 16,
        border: embedded ? "none" : "1px solid #d7deea",
        borderRadius: embedded ? 0 : compact ? 16 : 18,
        background: embedded
          ? "transparent"
          : compact
          ? "linear-gradient(135deg, #fffaf0, #ffffff 52%, #f5f9fe)"
          : "linear-gradient(140deg, #fffdf7, #ffffff 55%, #f4f8fd)",
        padding: embedded ? "0" : compact ? "18px 20px" : "22px 24px",
      }}
    >
      <div style={{ display: "grid", gap: compact ? 4 : 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.08, textTransform: "uppercase", color: "#854F0B" }}>
          {compact ? "Switch property" : "Bring a property into Furlong"}
        </span>
        <strong style={{ fontSize: compact ? 19 : 24, color: "#101a2b", lineHeight: 1.1 }}>
          {compact
            ? "Paste or upload a different listing without leaving this analysis flow."
            : "Import a listing, an address, or a screenshot and move straight into analysis."}
        </strong>
        <p style={{ margin: 0, fontSize: compact ? 13 : 14, color: "#5d687a", lineHeight: 1.65, maxWidth: compact ? 980 : 840 }}>
          {compact
            ? "Use this rail to pivot out of the current listing and into any outside property from Zillow, Crexi, LoopNet, Redfin, an address, or a screenshot."
            : "Paste a property link, drop in the address, or upload a screenshot from a listing page. Furlong turns that intake into a governed property workspace instead of making people start from scratch."}
        </p>
      </div>

      <div style={{ display: "grid", gap: compact ? 12 : 14, gridTemplateColumns: compact ? "minmax(0, 1.45fr) minmax(0, 1fr) minmax(220px, 0.8fr)" : undefined }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={labelStyle}>Paste a property link or address</span>
          <textarea
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            placeholder="Paste a Zillow, Crexi, Redfin, LoopNet, or other property URL, or type the address directly."
            rows={compact ? 3 : 4}
            style={textareaStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={labelStyle}>Add your own notes or what caught your attention</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex: could this become a boutique inn, a rural business, an event venue, a farm operation, or something mixed-use?"
            rows={compact ? 3 : 4}
            style={textareaStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={labelStyle}>Upload a property screenshot or photo</span>
          <input
            type="file"
            accept={allowedImageTypes().join(",")}
            onChange={async (event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setError(null);

              if (!nextFile) {
                setImageFile(null);
                return;
              }

              const clientImageError = await validateClientImageFile(nextFile);
              if (clientImageError) {
                setImageFile(null);
                setError(clientImageError);
                event.target.value = "";
                return;
              }

              setImageFile(nextFile);
            }}
            style={inputStyle}
          />
          <span style={{ fontSize: 12.5, color: "#7a8aa0", lineHeight: 1.5 }}>
            Best for listing screenshots, flyer captures, or a property photo paired with your notes. Imported images are used only to extract visible intake facts for this advisory workspace, and non-image or suspicious payloads are rejected automatically.
          </span>
          <span style={{ fontSize: 12, color: "#8a5a10", lineHeight: 1.5 }}>
            Rejected uploads may be quarantined for internal security review rather than processed.
          </span>
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: compact ? "space-between" : "flex-start" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button
          type="button"
          onClick={() => launchImport("paste")}
          disabled={pendingMode !== null}
          style={primaryButton}
        >
          {pendingMode === "paste" ? "Preparing analysis…" : "Analyze pasted property"}
        </button>
        <button
          type="button"
          onClick={() => launchImport("image")}
          disabled={pendingMode !== null}
          style={secondaryButton}
        >
          {pendingMode === "image" ? "Reading upload…" : "Analyze uploaded property"}
        </button>
        </div>
        {compact && (
          <span style={{ fontSize: 12.5, color: "#7a8aa0", lineHeight: 1.5 }}>
            Current path stays open until you choose a new property.
          </span>
        )}
      </div>

      {(error || warnings.length > 0 || imageFile) && (
        <div style={{ display: "grid", gap: 6 }}>
          {imageFile && (
            <span style={{ fontSize: 12.5, color: "#5d687a" }}>
              Selected upload: {imageFile.name}
            </span>
          )}
          {error && (
            <span style={{ fontSize: 12.5, color: "#a12828", lineHeight: 1.5 }}>
              {error}
            </span>
          )}
          {warnings.map((warning) => (
            <span key={warning} style={{ fontSize: 12.5, color: "#854F0B", lineHeight: 1.5 }}>
              {warning}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#162033",
} as const;

const textareaStyle = {
  fontSize: 13.5,
  lineHeight: 1.6,
  borderRadius: 12,
  border: "1.5px solid #cbd5e1",
  padding: "12px 14px",
  resize: "vertical" as const,
  minHeight: 96,
} as const;

const inputStyle = {
  fontSize: 13.5,
  borderRadius: 12,
  border: "1.5px solid #cbd5e1",
  padding: "12px 14px",
  background: "#fff",
} as const;

const primaryButton = {
  borderRadius: 999,
  border: "none",
  background: "#0f766e",
  color: "#fff",
  fontWeight: 800,
  padding: "11px 18px",
  cursor: "pointer",
} as const;

const secondaryButton = {
  borderRadius: 999,
  border: "1px solid #d7deea",
  background: "#fff",
  color: "#12344d",
  fontWeight: 700,
  padding: "11px 18px",
  cursor: "pointer",
} as const;
