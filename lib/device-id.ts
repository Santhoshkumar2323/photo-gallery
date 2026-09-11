const STORAGE_KEY = "gallery_device_id";
let cachedId: string | null = null;

export function getDeviceId(): string {
  if (cachedId) {
    return cachedId;
  }

  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    cachedId = existing;
    return existing;
  }

  const fresh = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, fresh);
  cachedId = fresh;
  return fresh;
}