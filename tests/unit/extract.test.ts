import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { extractText, sniffFileType } from "@/lib/documents/extract";

const fixture = (name: string) => new Uint8Array(readFileSync(join(__dirname, "..", "fixtures", name)));

describe("sniffFileType", () => {
  it("detects real file types from bytes", () => {
    expect(sniffFileType(fixture("short-proposal.pdf"))).toBe("pdf");
    expect(sniffFileType(fixture("project-brief.docx"))).toBe("docx");
    expect(sniffFileType(fixture("discovery-call.txt"))).toBe("txt");
  });

  it("flags executables and empty input", () => {
    expect(sniffFileType(fixture("malicious-renamed.pdf"))).toBe("binary");
    expect(sniffFileType(new Uint8Array())).toBe("unknown");
  });
});

describe("extractText", () => {
  it("extracts a short proposal PDF", async () => {
    const result = await extractText(fixture("short-proposal.pdf"), "pdf");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toContain("Brand Refresh for Acme Coffee Co.");
    expect(result.text).toContain("access to the Instagram account");
    expect(result.truncated).toBe(false);
  });

  it("extracts every fragment from a PDF with unclear structure across pages", async () => {
    const result = await extractText(fixture("unclear-structure.pdf"), "pdf");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const fragment of ["website redesign", "hosting login", "approve sitemap", "GA4 access"]) {
      expect(result.text).toContain(fragment);
    }
  });

  it("extracts a DOCX brief", async () => {
    const result = await extractText(fixture("project-brief.docx"), "docx");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toContain("Launch Video for Globex Fitness App");
    expect(result.text).toContain("YouTube channel manager invite");
  });

  it("extracts a messy transcript with no deadline as-is", async () => {
    const result = await extractText(fixture("discovery-call.txt"), "txt");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toContain("[00:00:31] Alex: perfect, don't send the password");
    expect(result.text.split("\n")).toHaveLength(12);
  });

  it("extracts a long email thread", async () => {
    const result = await extractText(fixture("long-email-thread.txt"), "txt");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text.length).toBeGreaterThan(40_000);
    expect(result.text).toContain("launch the campaign on 1 December 2026");
  });

  it("falls back to Windows-1252 for non-UTF-8 text", async () => {
    const result = await extractText(fixture("windows-1252.txt"), "txt");
    expect(result.ok && result.text).toContain("€5,000 for the “Summer Launch”");
  });

  it("reports PDFs without a text layer", async () => {
    const result = await extractText(fixture("scanned-no-text.pdf"), "pdf");
    expect(result).toMatchObject({ ok: false, reason: "no_text" });
  });

  describe("malicious uploads", () => {
    it.each([
      ["malicious-renamed.pdf", "pdf"],
      ["malicious-renamed.txt", "txt"],
      ["script-as.pdf", "pdf"],
      ["not-a-docx.docx", "docx"],
      ["short-proposal.pdf", "docx"],
      ["project-brief.docx", "pdf"],
    ] as const)("rejects %s declared as %s", async (name, declared) => {
      const result = await extractText(fixture(name), declared);
      expect(result).toMatchObject({ ok: false, reason: "invalid_file" });
    });

    it("rejects corrupt PDFs without crashing", async () => {
      const bytes = new TextEncoder().encode("%PDF-1.7\n garbage garbage garbage");
      const result = await extractText(bytes, "pdf");
      expect(result.ok).toBe(false);
    });
  });
});
