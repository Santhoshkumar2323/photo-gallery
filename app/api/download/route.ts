import { NextRequest, NextResponse } from "next/server";
import { verifyAuthCookie, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getPhotoById, incrementDownload } from "@/lib/db";
import { getSignedOriginalUrl } from "@/lib/r2-client";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthCookie(token);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { photoId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { photoId } = body;
  if (typeof photoId !== "string" || photoId.trim().length === 0) {
    return NextResponse.json({ error: "A valid photoId is required." }, { status: 400 });
  }

  try {
    const photo = await getPhotoById(photoId);
    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    const signedUrl = await getSignedOriginalUrl(photo.path);

    incrementDownload(photoId).catch((err) => {
      console.error("incrementDownload failed (non-fatal):", err);
    });

    return NextResponse.json({ url: signedUrl });
  } catch (err) {
    console.error("download route failed:", err);
    return NextResponse.json({ error: "Couldn't prepare that download right now." }, { status: 500 });
  }
}