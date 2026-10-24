import { describe, expect, it } from "vitest";

import { extractionStatusMeta, projectStatusMeta } from "@/lib/projects/status";

describe("status metadata", () => {
  it("labels every project status", () => {
    expect(projectStatusMeta("awaiting_client").label).toBe("Awaiting client");
    expect(projectStatusMeta("ready").variant).toBe("success");
    expect(projectStatusMeta("unknown").label).toBe("Draft");
  });

  it("labels extraction statuses", () => {
    expect(extractionStatusMeta("failed")).toEqual({ label: "Failed", variant: "danger" });
    expect(extractionStatusMeta("processing").label).toBe("Processing");
  });
});
