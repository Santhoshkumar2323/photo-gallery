import { NextRequest, NextResponse } from "next/server";
import { verifyAuthCookie, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getHighlights } from "@/lib/db";
import { getThumbnailUrl, getMediumUrl } from "@/lib/storage";
import type { Photo } from "@/lib/db";

export const dynamic = "force-dynamic";

function toResponsePhoto(photo: Photo) {
  return {
    id: photo.id,
    friendName: photo.friend_name,
    thumbnailUrl: getThumbnailUrl(photo.path),
    mediumUrl: getMediumUrl(photo.path),
    views: photo.views,
    downloads: photo.downloads,
    hype: photo.hype,
  };
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthCookie(token);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const { mostViewed, mostHyped, mostDownloaded } = await getHighlights();

    return NextResponse.json({
      mostViewed: mostViewed.map(toResponsePhoto),
      mostHyped: mostHyped.map(toResponsePhoto),
      mostDownloaded: mostDownloaded.map(toResponsePhoto),
    });
  } catch (err) {
    console.error("highlights route failed:", err);
    return NextResponse.json({ error: "Couldn't load highlights right now." }, { status: 500 });
  }
}