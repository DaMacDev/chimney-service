import { NextResponse, type NextRequest } from "next/server";
import { decodeIdToken } from "arctic";
import { authSecret, googleClient, secureCookies } from "@/lib/admin/auth";
import {
  HINT_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  isAllowedEmail,
  signSession,
} from "@/lib/admin/session";

interface GoogleClaims {
  email?: string;
  email_verified?: boolean;
}

function fail(request: NextRequest, reason: "denied" | "failed") {
  const response = NextResponse.redirect(new URL(`/admin/login?error=${reason}`, request.url));
  response.cookies.delete({ name: "na_oauth_state", path: "/admin/auth" });
  response.cookies.delete({ name: "na_oauth_verifier", path: "/admin/auth" });
  return response;
}

/** Google redirects here; only a verified, allowlisted email gets a session. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("na_oauth_state")?.value;
  const codeVerifier = request.cookies.get("na_oauth_verifier")?.value;
  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return fail(request, "failed");
  }

  let claims: GoogleClaims;
  try {
    const tokens = await googleClient().validateAuthorizationCode(code, codeVerifier);
    // The ID token comes straight from Google's token endpoint over TLS, so its
    // signature needn't be re-verified (OIDC Core 3.1.3.7).
    claims = decodeIdToken(tokens.idToken()) as GoogleClaims;
  } catch {
    return fail(request, "failed");
  }

  if (
    !claims.email ||
    claims.email_verified !== true ||
    !isAllowedEmail(claims.email, process.env.ADMIN_EMAILS)
  ) {
    return fail(request, "denied");
  }

  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.delete({ name: "na_oauth_state", path: "/admin/auth" });
  response.cookies.delete({ name: "na_oauth_verifier", path: "/admin/auth" });
  response.cookies.set(SESSION_COOKIE, await signSession(claims.email, authSecret()), {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
  response.cookies.set(HINT_COOKIE, "1", {
    secure: secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
