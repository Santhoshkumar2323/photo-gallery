import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "gallery_auth";
const COOKIE_MAX_AGE_SECONDS = 60 * 10; 

function getCookieSecretKey(): Uint8Array {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error("Missing COOKIE_SECRET env var. Check .env.local.");
  }
  return new TextEncoder().encode(secret);
}

function normalizeAnswer(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function checkRiddleAnswer(rawGuess: string): Promise<boolean> {
  const expectedHash = process.env.RIDDLE_ANSWER_HASH;
  if (!expectedHash) {
    throw new Error("Missing RIDDLE_ANSWER_HASH env var. Check .env.local.");
  }
  const guessHash = await sha256Hex(normalizeAnswer(rawGuess));
  return guessHash === expectedHash;
}

export async function createAuthCookie(): Promise<string> {
  const key = getCookieSecretKey();
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE_SECONDS}s`)
    .sign(key);
}


export async function verifyAuthCookie(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const key = getCookieSecretKey();
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE_SECONDS,
};