import { NextResponse, type NextRequest } from "next/server";
import { HINT_COOKIE, SESSION_COOKIE } from "@/lib/admin/session";

/** POST only; the SameSite=Lax session cookie keeps cross-site posts from reaching it. */
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.delete({ name: SESSION_COOKIE, path: "/admin" });
  response.cookies.delete({ name: HINT_COOKIE, path: "/" });
  return response;
}
