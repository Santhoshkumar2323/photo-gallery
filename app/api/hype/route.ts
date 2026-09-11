import { NextRequest, NextResponse } from "next/server";
import { verifyAuthCookie, AUTH_COOKIE_NAME } from "@/lib/auth";
import { addHype } from "@/lib/db";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthCookie(token);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { photoId?: unknown; deviceId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { photoId, deviceId } = body;

  if (typeof photoId !== "string" || photoId.trim().length === 0) {
    return NextResponse.json({ error: "A valid photoId is required." }, { status: 400 });
  }
  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    return NextResponse.json({ error: "A valid deviceId is required." }, { status: 400 });
  }

  try {
    const newHypeCount = await addHype(photoId, deviceId);
    return NextResponse.json({ hype: newHypeCount });
  } catch (err) {
    console.error("hype route failed:", err);
    return NextResponse.json({ error: "Couldn't register that right now." }, { status: 500 });
  }
}