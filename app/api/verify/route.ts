import { NextRequest, NextResponse } from "next/server";
import { checkRiddleAnswer, createAuthCookie, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { answer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.answer !== "string" || body.answer.trim().length === 0) {
    return NextResponse.json({ error: "An answer is required." }, { status: 400 });
  }

  let isCorrect: boolean;
  try {
    isCorrect = await checkRiddleAnswer(body.answer);
  } catch (err) {
    console.error("verify route failed:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }

  if (!isCorrect) {
    return NextResponse.json({ error: "That's not quite right." }, { status: 401 });
  }

  const token = await createAuthCookie();
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  return response;
}