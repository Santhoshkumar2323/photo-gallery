import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} env var. Check .env.local.`);
  }
  return value;
}

let _publicClient: SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

function getPublicClient(): SupabaseClient {
  if (!_publicClient) {
    _publicClient = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_ANON_KEY")
    );
  }
  return _publicClient;
}

function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    if (typeof window !== "undefined") {
      throw new Error(
        "adminClient must never be created in the browser."
      );
    }
    _adminClient = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY")
    );
  }
  return _adminClient;
}

export interface Photo {
  id: string;
  friend_name: string;
  path: string;
  views: number;
  downloads: number;
  hype: number;
  last_viewed_at: string | null;
  last_downloaded_at: string | null;
  last_hyped_at: string | null;
  created_at: string;
}

export interface Highlights {
  mostViewed: Photo[];
  mostHyped: Photo[];
  mostDownloaded: Photo[];
}

const PHOTOS_PER_PAGE = 12;
const HIGHLIGHTS_ROW_SIZE = 5;

export async function getFriends(): Promise<string[]> {
  const { data, error } = await getPublicClient().rpc("get_distinct_friends");

  if (error) throw new Error(`getFriends failed: ${error.message}`);

  return (data ?? []).map((row: { friend_name: string }) => row.friend_name);
}

export async function getPhotosByFriend(
  friendName: string,
  page: number
): Promise<{ photos: Photo[]; hasMore: boolean }> {
  const from = (page - 1) * PHOTOS_PER_PAGE;
  const to = from + PHOTOS_PER_PAGE - 1;

  const { data, error, count } = await getPublicClient()
    .from("photos")
    .select("*", { count: "exact" })
    .eq("friend_name", friendName)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw new Error(`getPhotosByFriend failed: ${error.message}`);

  const photos = (data ?? []) as Photo[];
  const hasMore = count !== null && to + 1 < count;

  return { photos, hasMore };
}

export async function getHighlights(): Promise<Highlights> {
  const client = getPublicClient();

  // Secondary .order() only ever breaks a tie on the first column
  // — it never outranks a genuinely higher views/hype/downloads
  // count. nullsFirst: false keeps older rows (from before this
  // column existed) sorting after ones with real timestamps.
  const [viewedRes, hypedRes, downloadedRes] = await Promise.all([
    client
      .from("photos")
      .select("*")
      .order("views", { ascending: false })
      .order("last_viewed_at", { ascending: false, nullsFirst: false })
      .limit(HIGHLIGHTS_ROW_SIZE),
    client
      .from("photos")
      .select("*")
      .order("hype", { ascending: false })
      .order("last_hyped_at", { ascending: false, nullsFirst: false })
      .limit(HIGHLIGHTS_ROW_SIZE),
    client
      .from("photos")
      .select("*")
      .order("downloads", { ascending: false })
      .order("last_downloaded_at", { ascending: false, nullsFirst: false })
      .limit(HIGHLIGHTS_ROW_SIZE),
  ]);

  if (viewedRes.error) throw new Error(`getHighlights (views) failed: ${viewedRes.error.message}`);
  if (hypedRes.error) throw new Error(`getHighlights (hype) failed: ${hypedRes.error.message}`);
  if (downloadedRes.error) throw new Error(`getHighlights (downloads) failed: ${downloadedRes.error.message}`);

  return {
    mostViewed: (viewedRes.data ?? []) as Photo[],
    mostHyped: (hypedRes.data ?? []) as Photo[],
    mostDownloaded: (downloadedRes.data ?? []) as Photo[],
  };
}

export async function getPhotoById(photoId: string): Promise<Photo | null> {
  const { data, error } = await getPublicClient()
    .from("photos")
    .select("*")
    .eq("id", photoId)
    .maybeSingle();

  if (error) throw new Error(`getPhotoById failed: ${error.message}`);
  return (data as Photo) ?? null;
}

export async function incrementView(photoId: string): Promise<void> {
  const { error } = await getAdminClient().rpc("increment_view", {
    p_photo_id: photoId,
  });
  if (error) throw new Error(`incrementView failed: ${error.message}`);
}

export async function incrementDownload(photoId: string): Promise<void> {
  const { error } = await getAdminClient().rpc("increment_download", {
    p_photo_id: photoId,
  });
  if (error) throw new Error(`incrementDownload failed: ${error.message}`);
}

export async function addHype(photoId: string, deviceId: string): Promise<number> {
  const { data, error } = await getAdminClient().rpc("add_hype", {
    p_photo_id: photoId,
    p_device_id: deviceId,
  });
  if (error) throw new Error(`addHype failed: ${error.message}`);
  return data as number;
}

export async function insertPhoto(params: {
  friendName: string;
  path: string;
}): Promise<void> {
  const { error } = await getAdminClient().from("photos").insert({
    friend_name: params.friendName,
    path: params.path,
  });
  if (error) throw new Error(`insertPhoto failed: ${error.message}`);
}