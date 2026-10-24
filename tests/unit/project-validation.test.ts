import { describe, expect, it } from "vitest";

import { fileTypeFromName } from "@/lib/documents/constants";
import { createProjectSchema, documentUploadSchema, pastedTextSchema } from "@/lib/validation/projects";

const PROJECT_ID = "6f1c1c6e-6c1c-4c1c-9c1c-6c1c6c1c6c1c";

describe("createProjectSchema", () => {
  const valid = { projectName: " Brand refresh ", clientName: "Acme", dueDate: "", description: "" };

  it("trims and turns empty optionals into null", () => {
    expect(createProjectSchema.parse(valid)).toEqual({
      projectName: "Brand refresh",
      clientName: "Acme",
      dueDate: null,
      description: null,
    });
  });

  it("accepts a real date", () => {
    expect(createProjectSchema.parse({ ...valid, dueDate: "2026-12-15" }).dueDate).toBe("2026-12-15");
  });

  it.each(["2026-02-30", "15/12/2026", "1999-12-31", "abc"])("rejects bad due date %s", (dueDate) => {
    expect(createProjectSchema.safeParse({ ...valid, dueDate }).success).toBe(false);
  });

  it("requires names", () => {
    const result = createProjectSchema.safeParse({ ...valid, projectName: "  ", clientName: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0])).toEqual(["projectName", "clientName"]);
  });
});

describe("documentUploadSchema", () => {
  it.each(["proposal.pdf", "Brief.DOCX", "call notes.txt"])("accepts %s", (fileName) => {
    expect(documentUploadSchema.safeParse({ projectId: PROJECT_ID, fileName, fileSize: 1000 }).success).toBe(true);
  });

  it.each(["virus.exe", "old.doc", "image.png", "noextension", "pdf", "archive.pdf.zip"])("rejects %s", (fileName) => {
    expect(documentUploadSchema.safeParse({ projectId: PROJECT_ID, fileName, fileSize: 1000 }).success).toBe(false);
  });

  it("enforces size limits and a valid project id", () => {
    const base = { projectId: PROJECT_ID, fileName: "a.pdf" };
    expect(documentUploadSchema.safeParse({ ...base, fileSize: 0 }).success).toBe(false);
    expect(documentUploadSchema.safeParse({ ...base, fileSize: 10 * 1024 * 1024 + 1 }).success).toBe(false);
    expect(documentUploadSchema.safeParse({ ...base, projectId: "1; drop table", fileSize: 10 }).success).toBe(false);
  });
});

describe("pastedTextSchema", () => {
  it("requires a meaningful amount of text", () => {
    expect(pastedTextSchema.safeParse({ projectId: PROJECT_ID, text: "too short" }).success).toBe(false);
    expect(pastedTextSchema.safeParse({ projectId: PROJECT_ID, text: "word ".repeat(20) }).success).toBe(true);
  });
});

describe("fileTypeFromName", () => {
  it("maps extensions case-insensitively", () => {
    expect(fileTypeFromName("A.PDF")).toBe("pdf");
    expect(fileTypeFromName("x.docx")).toBe("docx");
    expect(fileTypeFromName("txt")).toBeNull();
  });
});
