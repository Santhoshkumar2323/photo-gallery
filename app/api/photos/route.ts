import { NextRequest, NextResponse } from "next/server";
import { verifyAuthCookie, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getPhotosByFriend } from "@/lib/db";
import { getThumbnailUrl, getMediumUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthCookie(token);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const friend = request.nextUrl.searchParams.get("friend");
  const pageParam = request.nextUrl.searchParams.get("page") ?? "1";

  if (!friend || friend.trim().length === 0) {
    return NextResponse.json({ error: "A friend name is required." }, { status: 400 });
  }

  const page = Number.parseInt(pageParam, 10);
  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: "Page must be a positive whole number." }, { status: 400 });
  }

  try {
    const { photos, hasMore } = await getPhotosByFriend(friend, page);

    const result = photos.map((photo) => ({
      id: photo.id,
      path: photo.path,
      thumbnailUrl: getThumbnailUrl(photo.path),
      mediumUrl: getMediumUrl(photo.path),
      views: photo.views,
      downloads: photo.downloads,
      hype: photo.hype,
    }));

    return NextResponse.json({ photos: result, hasMore });
  } catch (err) {
    console.error("photos route failed:", err);
    return NextResponse.json({ error: "Couldn't load photos right now." }, { status: 500 });
  }
}