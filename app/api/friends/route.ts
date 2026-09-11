import { NextRequest, NextResponse } from "next/server";
import { verifyAuthCookie, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getFriends } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthCookie(token);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const friends = await getFriends();
    return NextResponse.json({ friends });
  } catch (err) {
    console.error("friends route failed:", err);
    return NextResponse.json({ error: "Couldn't load friends right now." }, { status: 500 });
  }
}