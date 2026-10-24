import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/utils/redirect";

describe("safeNextPath", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/projects/abc?tab=checklist", "/projects/abc?tab=checklist"],
    ["/settings#billing", "/settings#billing"],
  ])("allows same-origin path %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "dashboard",
    "",
    "/foo\nbar",
    "/" + "a".repeat(600),
  ])("rejects unsafe value %j", (input) => {
    expect(safeNextPath(input)).toBe("/dashboard");
  });

  it("rejects non-strings and supports a custom fallback", () => {
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath(null, "/settings")).toBe("/settings");
    expect(safeNextPath(["/x"])).toBe("/dashboard");
  });
});
