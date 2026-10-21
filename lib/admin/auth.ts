import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Google } from "arctic";
import { siteOrigin } from "@/lib/site-url";
import { SESSION_COOKIE, isAllowedEmail, verifySession } from "./session";

/** Server-only env for the owner login. Throws early so a misconfigured deploy fails loudly. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

export function authSecret(): string {
  return requireEnv("AUTH_SECRET");
}

export function googleClient(): Google {
  return new Google(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET"),
    `${siteOrigin}/admin/auth/callback`,
  );
}

export const secureCookies = process.env.NODE_ENV === "production";

/**
 * The signed-in owner's email, or null. Re-checks the allowlist so removing an
 * address from ADMIN_EMAILS revokes its live sessions immediately.
 */
export async function getAdminEmail(): Promise<string | null> {
  const store = await cookies();
  const email = await verifySession(store.get(SESSION_COOKIE)?.value, authSecret());
  return email && isAllowedEmail(email, process.env.ADMIN_EMAILS) ? email : null;
}

/**
 * Gate for every /admin page and admin API route. Checked server-side on each
 * request rather than in the proxy, so a proxy bypass can't expose admin data.
 */
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/login");
  return email;
}
