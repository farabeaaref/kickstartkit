import { describe, expect, it } from "vitest";

import { initials } from "@/lib/utils/format";

describe("initials", () => {
  it("uses first and last name", () => expect(initials("Alex de la Rivera")).toBe("AR"));
  it("handles a single name", () => expect(initials("alex")).toBe("AL"));
  it("falls back to email", () => expect(initials(null, "jo.smith@x.com")).toBe("JS"));
  it("handles nothing", () => expect(initials("", "")).toBe("?"));
});
