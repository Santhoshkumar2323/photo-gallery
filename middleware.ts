import { NextRequest, NextResponse } from "next/server";
import { verifyAuthCookie, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthCookie(token);

  if (!isAuthenticated) {
    const gateUrl = new URL("/gate", request.url);
    return NextResponse.redirect(gateUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|gate|_next/static|_next/image|favicon.ico).*)"],
};