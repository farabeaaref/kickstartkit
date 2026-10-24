import { describe, expect, it } from "vitest";

import { isProtectedPath } from "@/lib/supabase/proxy";

describe("isProtectedPath", () => {
  it.each(["/dashboard", "/projects/new", "/projects/123/checklist", "/settings", "/billing"])("protects %s", (path) =>
    expect(isProtectedPath(path)).toBe(true),
  );

  it.each(["/", "/login", "/signup", "/onboard/abc", "/dashboards", "/projectsx", "/api/webhooks/stripe"])(
    "leaves %s public",
    (path) => expect(isProtectedPath(path)).toBe(false),
  );
});
