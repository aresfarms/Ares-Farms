const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export type UploadImageGateResult = {
  ok: boolean;
  error: string | null;
  bytes: number;
  mediaType: string | null;
};

function hasJpegSignature(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function hasPngSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function hasWebpSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

function isoBrand(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (String.fromCharCode(...bytes.slice(4, 8)) !== "ftyp") return null;
  return String.fromCharCode(...bytes.slice(8, 12));
}

function hasHeicSignature(bytes: Uint8Array): boolean {
  const brand = isoBrand(bytes);
  return brand !== null && ["heic", "heix", "hevc", "hevx"].includes(brand);
}

function hasHeifSignature(bytes: Uint8Array): boolean {
  const brand = isoBrand(bytes);
  return brand !== null && ["mif1", "msf1"].includes(brand);
}

function mediaTypeMatchesBytes(mediaType: string, bytes: Uint8Array): boolean {
  if (mediaType === "image/jpeg") return hasJpegSignature(bytes);
  if (mediaType === "image/png") return hasPngSignature(bytes);
  if (mediaType === "image/webp") return hasWebpSignature(bytes);
  if (mediaType === "image/heic") return hasHeicSignature(bytes);
  if (mediaType === "image/heif") return hasHeifSignature(bytes);
  return false;
}

export function allowedImageTypes(): string[] {
  return Array.from(ALLOWED_IMAGE_TYPES);
}

export function maxUploadImageBytes(): number {
  return MAX_IMAGE_BYTES;
}

export function validateImageUploadBytes(input: {
  mediaType: string | null;
  bytes: Uint8Array;
}): UploadImageGateResult {
  const mediaType = input.mediaType?.trim().toLowerCase() ?? null;
  const bytes = input.bytes;

  if (!mediaType || !ALLOWED_IMAGE_TYPES.has(mediaType)) {
    return {
      ok: false,
      error: "Only JPEG, PNG, WEBP, HEIC, or HEIF images are allowed here.",
      bytes: bytes.byteLength,
      mediaType,
    };
  }

  if (bytes.byteLength < 32) {
    return {
      ok: false,
      error: "The uploaded file is too small to be a valid property image.",
      bytes: bytes.byteLength,
      mediaType,
    };
  }

  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "The uploaded image is too large for this intake path.",
      bytes: bytes.byteLength,
      mediaType,
    };
  }

  if (!mediaTypeMatchesBytes(mediaType, bytes)) {
    return {
      ok: false,
      error:
        "The uploaded file does not match its claimed image type and was rejected for safety.",
      bytes: bytes.byteLength,
      mediaType,
    };
  }

  return {
    ok: true,
    error: null,
    bytes: bytes.byteLength,
    mediaType,
  };
}
