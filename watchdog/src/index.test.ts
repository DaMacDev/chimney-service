import { describe, it, expect, vi, afterEach } from "vitest";
import { check, type Env } from "./index";
import { FREE_TIER } from "./usage";

const env: Env = {
  ACCOUNT_ID: "acct",
  BUCKET: "media-bucket",
  GITHUB_REPO: "owner/repo",
  CF_API_TOKEN: "cf",
  GITHUB_TOKEN: "gh",
};

function analytics(classB: number, storageBytes = 0) {
  return {
    data: {
      viewer: {
        accounts: [
          {
            ops: [{ sum: { requests: classB }, dimensions: { actionType: "GetObject" } }],
            storage: [{ max: { payloadSize: storageBytes, metadataSize: 0 } }],
          },
        ],
      },
    },
  };
}

/** Routes the Worker's outbound calls; records them for assertions. */
function mockNetwork(classB: number, existingIssues = 0) {
  const calls: { method: string; url: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ method: init?.method ?? "GET", url });
      if (url.endsWith("/graphql")) return Response.json(analytics(classB));
      if (url.includes("/search/issues")) return Response.json({ total_count: existingIssues });
      return new Response("{}", { status: 200 });
    }),
  );
  return calls;
}

const disabled = (calls: { method: string; url: string }[]) =>
  calls.some((c) => c.method === "PUT" && c.url.endsWith("/domains/managed"));
const issueOpened = (calls: { method: string; url: string }[]) =>
  calls.some((c) => c.method === "POST" && c.url.endsWith("/repos/owner/repo/issues"));

describe("watchdog check", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing under 50%", async () => {
    const calls = mockNetwork(FREE_TIER.classB * 0.1);
    expect(await check(env)).toBe("ok");
    expect(disabled(calls) || issueOpened(calls)).toBe(false);
  });

  it("opens an issue at 50% without switching anything off", async () => {
    const calls = mockNetwork(FREE_TIER.classB * 0.6);
    expect(await check(env)).toBe("warn");
    expect(issueOpened(calls)).toBe(true);
    expect(disabled(calls)).toBe(false);
  });

  it("switches off the public URL and alerts at 90%", async () => {
    const calls = mockNetwork(FREE_TIER.classB * 0.92);
    expect(await check(env)).toBe("kill");
    expect(disabled(calls)).toBe(true);
    expect(issueOpened(calls)).toBe(true);
  });

  it("does not repeat an issue already opened this month", async () => {
    const calls = mockNetwork(FREE_TIER.classB * 0.92, 1);
    await check(env);
    expect(disabled(calls)).toBe(true);
    expect(issueOpened(calls)).toBe(false);
  });

  it("fails loudly when analytics errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ errors: [{ message: "no access" }] })),
    );
    await expect(check(env)).rejects.toThrow("analytics query failed");
  });
});
