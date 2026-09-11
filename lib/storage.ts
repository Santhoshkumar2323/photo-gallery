export type ImageSize = "thumbnail" | "medium" | "original";

const STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_BASE?.replace(/\/+$/, "");

const SIZE_FOLDER: Record<ImageSize, string> = {
  thumbnail: "thumbnails",
  medium: "medium",
  original: "originals",
};

export function getImageUrl(path: string, size: ImageSize): string {

  if (!STORAGE_BASE) {
    throw new Error(
      "Missing NEXT_PUBLIC_STORAGE_BASE env var. Set it to your R2 " +
        "custom domain, e.g. https://img.yoursite.com"
    );
  }

  if (size === "original") {
    throw new Error(
      "getImageUrl() cannot be used for originals — they require a " +
        "signed URL. Use getSignedOriginalUrl() from lib/r2-client.ts."
    );
  }

  const folder = SIZE_FOLDER[size];
  const cleanPath = path.replace(/^\/+/, ""); 
  return `${STORAGE_BASE}/${folder}/${cleanPath}`;
}

export function getThumbnailUrl(path: string): string {
  return getImageUrl(path, "thumbnail");
}

export function getMediumUrl(path: string): string {
  return getImageUrl(path, "medium");
}

export function getStorageFolder(size: ImageSize): string {
  return SIZE_FOLDER[size];
}