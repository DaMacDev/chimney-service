/**
 * Owner session for /admin: a stateless, HMAC-SHA256-signed cookie holding the
 * signed-in email and an expiry. One allowlisted owner, so no session store —
 * see docs/adr/0002-owner-admin-auth-and-media-storage.md.
 */

export const SESSION_COOKIE = "na_admin_session";
/** Non-secret flag readable by the public site, only to show an "edit" link. */
export const HINT_COOKIE = "na_admin_hint";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

interface SessionPayload {
  email: string;
  exp: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(text, "base64url"));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  if (secret.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(
  email: string,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const payload: SessionPayload = {
    email,
    exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

/** Returns the session email, or null for a missing, forged or expired cookie. */
export async function verifySession(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<string | null> {
  if (!token) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;

  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    fromBase64Url(sig),
    encoder.encode(body),
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
    return payload.exp > Math.floor(now / 1000) ? payload.email : null;
  } catch {
    return null;
  }
}

/** `ADMIN_EMAILS` is a comma-separated allowlist; comparison ignores case and spaces. */
export function isAllowedEmail(email: string, allowlist: string | undefined): boolean {
  const wanted = email.trim().toLowerCase();
  return (allowlist ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .some((entry) => entry !== "" && entry === wanted);
}
