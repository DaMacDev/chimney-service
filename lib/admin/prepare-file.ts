/**
 * Browser-side file preparation for owner uploads: photos are downscaled to a
 * JPEG (smaller bucket, faster pages); videos get a poster frame. Everything
 * the server needs to check the upload (hash, type, size, dimensions) is
 * computed here and re-verified server-side.
 */
import { IMAGE_MAX_SIDE, UPLOAD_TYPES, type UploadType } from "@/lib/media/limits";

export interface PreparedBlob {
  blob: Blob;
  contentType: UploadType;
  sha256: string;
  width: number;
  height: number;
}

export interface PreparedFile {
  main: PreparedBlob;
  /** Video only. */
  poster?: PreparedBlob;
}

async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.85),
  );
}

function draw(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function jpegFrom(source: CanvasImageSource, width: number, height: number) {
  const canvas = draw(source, width, height);
  const blob = await canvasToJpeg(canvas);
  return {
    blob,
    contentType: "image/jpeg" as const,
    sha256: await sha256(blob),
    width: canvas.width,
    height: canvas.height,
  };
}

async function prepareImage(file: File): Promise<PreparedFile> {
  // imageOrientation honours phone EXIF rotation; the JPEG re-encode drops EXIF (GPS).
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return { main: await jpegFrom(bitmap, bitmap.width, bitmap.height) };
  } finally {
    bitmap.close();
  }
}

function videoType(file: File): UploadType | null {
  const byName = file.name.toLowerCase().split(".").pop();
  const type = (Object.keys(UPLOAD_TYPES) as UploadType[]).find(
    (t) => t === file.type || (UPLOAD_TYPES[t].kind === "video" && UPLOAD_TYPES[t].ext === byName),
  );
  return type && UPLOAD_TYPES[type].kind === "video" ? type : null;
}

async function prepareVideo(file: File, contentType: UploadType): Promise<PreparedFile> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("unplayable"));
    });
    // Poster from ~1s in, or the middle of very short clips.
    video.currentTime = Math.min(1, video.duration / 2);
    await new Promise<void>((resolve) => (video.onseeked = () => resolve()));
    return {
      main: {
        blob: file,
        contentType,
        sha256: await sha256(file),
        width: video.videoWidth,
        height: video.videoHeight,
      },
      poster: await jpegFrom(video, video.videoWidth, video.videoHeight),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Throws an Error with a Spanish message the UI can show as-is. */
export async function prepareFile(file: File): Promise<PreparedFile> {
  if (file.type.startsWith("image/")) {
    try {
      return await prepareImage(file);
    } catch {
      throw new Error("No se pudo leer la foto. Prueba con un JPG o PNG.");
    }
  }
  const type = videoType(file);
  if (!type) throw new Error("Tipo de archivo no permitido. Usa fotos o videos MP4, WebM o MOV.");
  try {
    return await prepareVideo(file, type);
  } catch {
    throw new Error(
      "Este navegador no puede reproducir el video. Grábalo en formato «Más compatible» o envíalo por WhatsApp y vuelve a intentarlo.",
    );
  }
}
