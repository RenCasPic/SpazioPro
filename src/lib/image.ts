export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Read a File into a downscaled JPEG/WebP data URL so it fits comfortably in
 * localStorage (and, later, a Supabase Storage upload).
 */
export async function fileToDataUrl(
  file: File,
  { maxSize = 1600, quality = 0.82 }: { maxSize?: number; quality?: number } = {},
): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Formato no admitido. Usa JPG, PNG o WebP.");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}
