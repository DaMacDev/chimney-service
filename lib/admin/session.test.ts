import { describe, it, expect } from "vitest";
import { isAllowedEmail, signSession, verifySession, SESSION_TTL_SECONDS } from "./session";

const KEY = "k".repeat(40);
const OTHER_KEY = "o".repeat(40);

describe("session cookie", () => {
  it("round-trips the email", async () => {
    const token = await signSession("owner@example.com", KEY);
    expect(await verifySession(token, KEY)).toBe("owner@example.com");
  });

  it("rejects a token signed with another key", async () => {
    const token = await signSession("owner@example.com", OTHER_KEY);
    expect(await verifySession(token, KEY)).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await signSession("owner@example.com", KEY);
    const [, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ email: "attacker@example.com", exp: 9_999_999_999 }),
    ).toString("base64url");
    expect(await verifySession(`${forged}.${sig}`, KEY)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const issued = Date.now();
    const token = await signSession("owner@example.com", KEY, issued);
    const later = issued + (SESSION_TTL_SECONDS + 1) * 1000;
    expect(await verifySession(token, KEY, later)).toBeNull();
  });

  it.each([undefined, "", "garbage", "a.b.c"])("rejects malformed token %j", async (token) => {
    expect(await verifySession(token, KEY)).toBeNull();
  });

  it("refuses a short key", async () => {
    await expect(signSession("owner@example.com", "short")).rejects.toThrow();
  });
});

describe("isAllowedEmail", () => {
  it("matches case-insensitively in a comma list", () => {
    expect(isAllowedEmail("Owner@Example.com", "a@x.com, owner@example.com")).toBe(true);
  });

  it.each([
    ["stranger@example.com", "owner@example.com"],
    ["owner@example.com", undefined],
    ["owner@example.com", ""],
    ["", " , "],
  ])("refuses %s against %j", (email, list) => {
    expect(isAllowedEmail(email, list)).toBe(false);
  });
});
