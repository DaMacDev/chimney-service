import { describe, it, expect } from "vitest";
import { FREE_TIER, classify, level, monthStart, sumOperations } from "./usage";

describe("classify", () => {
  it.each([
    ["GetObject", "classB"],
    ["HeadObject", "classB"],
    ["PutObject", "classA"],
    ["ListObjects", "classA"],
    ["DeleteObject", "free"],
    ["SomethingNew", "classA"],
  ])("%s is %s", (action, expected) => {
    expect(classify(action)).toBe(expected);
  });
});

describe("sumOperations", () => {
  it("totals by class and ignores free operations", () => {
    expect(
      sumOperations([
        { actionType: "GetObject", requests: 100 },
        { actionType: "HeadObject", requests: 5 },
        { actionType: "PutObject", requests: 7 },
        { actionType: "DeleteObject", requests: 50 },
      ]),
    ).toEqual({ classA: 7, classB: 105 });
  });
});

describe("level", () => {
  const none = { storageBytes: 0, classA: 0, classB: 0 };

  it("is ok well under the free tier", () => {
    expect(level({ ...none, classB: FREE_TIER.classB * 0.49 })).toBe("ok");
  });

  it("warns at 50% of any metric", () => {
    expect(level({ ...none, classA: FREE_TIER.classA * 0.5 })).toBe("warn");
  });

  it("kills at 90% of any metric", () => {
    expect(level({ ...none, storageBytes: FREE_TIER.storageBytes * 0.9 })).toBe("kill");
    expect(level({ ...none, classB: FREE_TIER.classB * 0.95 })).toBe("kill");
  });
});

describe("monthStart", () => {
  it("is the first of the month in UTC", () => {
    expect(monthStart(new Date("2026-10-21T15:30:00Z")).toISOString()).toBe(
      "2026-10-01T00:00:00.000Z",
    );
  });
});
