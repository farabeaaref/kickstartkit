import { z } from "zod";

import {
  MAX_SOURCE_FILE_BYTES,
  MAX_STORED_TEXT_CHARS,
  MIN_PASTED_TEXT_CHARS,
  fileTypeFromName,
} from "@/lib/documents/constants";

/** Optional calendar date from an `<input type="date">` ("" means not set). */
const optionalDate = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
      .refine(isRealDate, "Enter a valid date.")
      .refine((value) => value >= "2000-01-01" && value <= "2100-12-31", "Enter a realistic date.")
      .nullable(),
  );

export const createProjectSchema = z.object({
  projectName: z.string().trim().min(1, "Enter a project name.").max(200, "Keep it under 200 characters."),
  clientName: z.string().trim().min(1, "Enter the client's name.").max(200, "Keep it under 200 characters."),
  dueDate: optionalDate,
  description: z
    .string()
    .trim()
    .max(2000, "Keep the description under 2,000 characters.")
    .transform((value) => value || null),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;

export const idSchema = z.uuid("Invalid id.");

export const documentUploadSchema = z.object({
  projectId: idSchema,
  fileName: z
    .string()
    .trim()
    .min(1, "Choose a file.")
    .max(255, "That file name is too long — rename it and try again.")
    .refine((name) => fileTypeFromName(name) !== null, "Upload a PDF, DOCX, or TXT file."),
  fileSize: z
    .number()
    .int()
    .positive("This file is empty.")
    .max(MAX_SOURCE_FILE_BYTES, `Files must be ${MAX_SOURCE_FILE_BYTES / 1024 / 1024} MB or smaller.`),
});

export const pastedTextSchema = z.object({
  projectId: idSchema,
  text: z
    .string()
    .trim()
    .min(MIN_PASTED_TEXT_CHARS, "Paste a bit more — the full proposal, brief, or email thread works best.")
    .max(
      MAX_STORED_TEXT_CHARS,
      `That's too long. Paste up to ${MAX_STORED_TEXT_CHARS.toLocaleString("en-US")} characters.`,
    ),
});

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
