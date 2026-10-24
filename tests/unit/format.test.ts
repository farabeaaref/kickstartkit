import { describe, expect, it } from "vitest";

import { formatBytes, formatDate, formatRelativeTime, initials } from "@/lib/utils/format";

describe("initials", () => {
  it("uses first and last name", () => expect(initials("Alex de la Rivera")).toBe("AR"));
  it("handles a single name", () => expect(initials("alex")).toBe("AL"));
  it("falls back to email", () => expect(initials(null, "jo.smith@x.com")).toBe("JS"));
  it("handles nothing", () => expect(initials("", "")).toBe("?"));
});

describe("formatDate", () => {
  it("formats date-only values without timezone drift", () => {
    expect(formatDate("2026-12-01")).toBe("Dec 1, 2026");
    expect(formatDate(null)).toBeNull();
    expect(formatDate("nope")).toBeNull();
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-10-24T12:00:00Z");
  it.each([
    ["2026-10-24T11:59:30Z", "just now"],
    ["2026-10-24T09:00:00Z", "3 hours ago"],
    ["2026-10-23T12:00:00Z", "yesterday"],
    ["2026-10-10T12:00:00Z", "2 weeks ago"],
  ])("%s → %s", (value, expected) => expect(formatRelativeTime(value, now)).toBe(expected));
});

describe("formatBytes", () => {
  it("uses human units", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(10 * 1024 * 1024)).toBe("10 MB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});
