import { BUCKET, supabase, variant } from "./supabase";

const SIZES = [1000, 800, 480] as const;
const MAX_BYTES = 15 * 1024 * 1024;

/** Centre-crops to a square (product cards are square) and encodes the 3 WebP sizes the storefront's srcset expects. */
export async function squareVariants(file: File): Promise<Blob[]> {
  if (!file.type.startsWith("image/")) throw new Error("Ce fichier n’est pas une image.");
  if (file.size > MAX_BYTES) throw new Error("L’image dépasse 15 Mo.");
  const bmp = await createImageBitmap(file).catch(() => { throw new Error("Image illisible. Utilisez un JPG, PNG ou WebP."); });
  const side = Math.min(bmp.width, bmp.height);
  const sx = (bmp.width - side) / 2, sy = (bmp.height - side) / 2;
  const out: Blob[] = [];
  for (const size of SIZES) {
    const px = Math.min(size, side);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = px;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, sx, sy, side, side, 0, 0, px, px);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.82));
    if (!blob) throw new Error("Votre navigateur ne sait pas convertir cette image en WebP.");
    out.push(blob);
  }
  bmp.close();
  return out;
}

const pathOf = (url: string) => url.split(`/storage/v1/object/public/${BUCKET}/`)[1];

/** Uploads the 3 sizes and returns the public URL of the base (1000px) file. */
export async function uploadImage(file: File, name: string): Promise<string> {
  const [full, w800, w480] = await squareVariants(file);
  const base = `products/${name}-${Date.now().toString(36)}`;
  const store = supabase.storage.from(BUCKET);
  const files: [string, Blob][] = [[`${base}.webp`, full], [`${base}-800.webp`, w800], [`${base}-480.webp`, w480]];
  for (const [path, blob] of files) {
    const { error } = await store.upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
    if (error) { await store.remove(files.map(([p]) => p)); throw new Error("L’envoi de l’image a échoué. Réessayez."); }
  }
  return store.getPublicUrl(`${base}.webp`).data.publicUrl;
}

/** Best-effort cleanup of an uploaded image set. Site images (/maisonsabra/...) are never touched. */
export async function removeImage(url: string | null | undefined) {
  const path = url ? pathOf(url) : undefined;
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path, variant(path, 800), variant(path, 480)]);
}
