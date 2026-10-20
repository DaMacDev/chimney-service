import { NextResponse } from "next/server";
import { generateCodeVerifier, generateState } from "arctic";
import { googleClient, secureCookies } from "@/lib/admin/auth";

const OAUTH_COOKIE = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: "lax",
  path: "/admin/auth",
  maxAge: 10 * 60,
} as const;

/** Starts Google sign-in (authorization code + PKCE). */
export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = googleClient().createAuthorizationURL(state, codeVerifier, ["openid", "email"]);
  url.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(url);
  response.cookies.set("na_oauth_state", state, OAUTH_COOKIE);
  response.cookies.set("na_oauth_verifier", codeVerifier, OAUTH_COOKIE);
  return response;
}
