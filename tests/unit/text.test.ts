import { describe, expect, it } from "vitest";

import { countWords, normalizeText } from "@/lib/documents/text";

describe("normalizeText", () => {
  it("normalises line endings, strips control chars and NULs, and trims", () => {
    const { text } = normalizeText("  Hello\r\nworld\u0000\u0007  \r\n\r\n\r\n\r\nBye\t \n");
    expect(text).toBe("Hello\nworld\n\nBye");
  });

  it("keeps tabs inside lines", () => {
    expect(normalizeText("a\tb").text).toBe("a\tb");
  });

  it("truncates to the limit and flags it", () => {
    const result = normalizeText("x".repeat(50), 10);
    expect(result).toEqual({ text: "x".repeat(10), truncated: true });
  });
});

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("  one two\nthree\tfour ")).toBe(4);
    expect(countWords("")).toBe(0);
  });
});
