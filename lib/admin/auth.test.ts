import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { signSession } from "./session";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { value };
    },
  }),
}));

const { getAdminEmail } = await import("./auth");

describe("getAdminEmail", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "k".repeat(40));
    cookieJar.clear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a valid session for an allowlisted email", async () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
    cookieJar.set("na_admin_session", await signSession("owner@example.com", "k".repeat(40)));
    expect(await getAdminEmail()).toBe("owner@example.com");
  });

  it("revokes a still-valid session once the email leaves the allowlist", async () => {
    vi.stubEnv("ADMIN_EMAILS", "someone-else@example.com");
    cookieJar.set("na_admin_session", await signSession("owner@example.com", "k".repeat(40)));
    expect(await getAdminEmail()).toBeNull();
  });

  it("returns null without a cookie", async () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
    expect(await getAdminEmail()).toBeNull();
  });
});
