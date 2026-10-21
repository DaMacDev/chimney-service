/**
 * Upload guardrails that keep the media bucket inside R2's free tier (ADR 0002).
 * Shared by the admin UI (early feedback) and the server (the real check).
 */

export const MB = 1024 * 1024;
export const GB = 1024 * MB;

/** Total bucket size the admin can never exceed (free tier is 10 GB). */
export const STORAGE_BUDGET_BYTES = 5 * GB;
export const MAX_IMAGE_BYTES = 10 * MB;
export const MAX_VIDEO_BYTES = 50 * MB;
/** New files per UTC day; stops a runaway loop from burning Class A writes. */
export const MAX_UPLOADS_PER_DAY = 100;
/** Photos are downscaled in the browser to this longest side before upload. */
export const IMAGE_MAX_SIDE = 2000;

export const TEXT_LIMITS = { name: 120, caption: 300, description: 1000 } as const;

export const UPLOAD_TYPES = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
} as const;

export type UploadType = keyof typeof UPLOAD_TYPES;

export interface UploadRequest {
  sha256: string;
  contentType: string;
  bytes: number;
}

export interface BucketUsage {
  totalBytes: number;
  uploadsToday: number;
}

/** Returns a Spanish error for the owner, or null when the upload may proceed. */
export function checkUpload(req: UploadRequest, usage: BucketUsage): string | null {
  const type = UPLOAD_TYPES[req.contentType as UploadType];
  if (!type) return "Tipo de archivo no permitido. Usa fotos JPG o videos MP4, WebM o MOV.";
  if (!/^[a-f0-9]{64}$/.test(req.sha256)) return "Archivo inválido.";
  if (!Number.isInteger(req.bytes) || req.bytes <= 0) return "Archivo vacío o inválido.";
  const max = type.kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (req.bytes > max) {
    return type.kind === "image"
      ? "La foto pesa más de 10 MB."
      : "El video pesa más de 50 MB. Acórtalo o envíalo por WhatsApp para comprimirlo y vuelve a intentarlo.";
  }
  if (usage.uploadsToday >= MAX_UPLOADS_PER_DAY) {
    return `Límite diario alcanzado (${MAX_UPLOADS_PER_DAY} archivos). Inténtalo mañana.`;
  }
  if (usage.totalBytes + req.bytes > STORAGE_BUDGET_BYTES) {
    return "Se alcanzó el espacio máximo (5 GB). Borra fotos o videos antiguos para subir más.";
  }
  return null;
}

export function objectKey(req: UploadRequest): string {
  const { ext } = UPLOAD_TYPES[req.contentType as UploadType];
  return `media/${req.sha256.slice(0, 24)}.${ext}`;
}
