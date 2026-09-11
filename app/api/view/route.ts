import { NextRequest, NextResponse } from "next/server";
import { verifyAuthCookie, AUTH_COOKIE_NAME } from "@/lib/auth";
import { incrementView } from "@/lib/db";

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
    await incrementView(photoId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("view route failed:", err);
    return NextResponse.json({ error: "Couldn't register that right now." }, { status: 500 });
  }
}