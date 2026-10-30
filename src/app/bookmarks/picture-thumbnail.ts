/** A small copy of a picture for the framing editor, plus its proportions. */
export interface PictureThumb {
  /** A `data:` URL (the site's CSP allows those images, not `blob:` ones). */
  url: string;
  /** Width ÷ height. */
  aspect: number;
}

/**
 * The picture shrunk to at most `maxPx` on its longer side, as a JPEG data URL, or
 * null when the browser can't decode it. Only for showing it in the editor on this
 * page — the engine always gets the original file.
 */
export async function pictureThumbnail(file: Blob, maxPx = 640): Promise<PictureThumb | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return { url: canvas.toDataURL('image/jpeg', 0.85), aspect: canvas.width / canvas.height };
  } catch {
    return null;
  }
}
