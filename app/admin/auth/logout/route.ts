import { NextResponse, type NextRequest } from "next/server";
import { HINT_COOKIE, SESSION_COOKIE } from "@/lib/admin/session";

/** POST only, and only from our own pages, so other sites can't sign the owner out. */
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return new NextResponse(null, { status: 403 });
  }
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.delete({ name: SESSION_COOKIE, path: "/admin" });
  response.cookies.delete({ name: HINT_COOKIE, path: "/" });
  return response;
}
