"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import {
  MAX_SOURCE_FILE_BYTES,
  SOURCE_DOCUMENTS_BUCKET,
  UPLOADABLE_FILE_TYPES,
  fileTypeFromName,
  type UploadableFileType,
} from "@/lib/documents/constants";
import { extractText } from "@/lib/documents/extract";
import { normalizeText } from "@/lib/documents/text";
import { createClient } from "@/lib/supabase/server";
import {
  createProjectSchema,
  documentUploadSchema,
  idSchema,
  pastedTextSchema,
  type CreateProjectInput,
} from "@/lib/validation/projects";

/** Generous per-project cap to stop runaway uploads. */
const MAX_DOCUMENTS_PER_PROJECT = 20;

type FieldErrors<T> = Partial<Record<keyof T, string[]>>;

export type CreateProjectState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: FieldErrors<CreateProjectInput>;
      values?: Partial<Record<keyof CreateProjectInput, string>>;
    };

export async function createProject(_prev: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
  const user = await requireUser();
  const values = {
    projectName: String(formData.get("projectName") ?? ""),
    clientName: String(formData.get("clientName") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
  const parsed = createProjectSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: user.workspace.id,
      project_name: parsed.data.projectName,
      client_name: parsed.data.clientName,
      due_date: parsed.data.dueDate,
      description: parsed.data.description,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) {
    return { status: "error", message: "We couldn't create the project. Please try again.", values };
  }

  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}`);
}

// ---------------------------------------------------------------------------
// Source documents
// ---------------------------------------------------------------------------

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; message: string };

/**
 * Step 1 of a file upload: validate, reserve a row, and issue a one-time signed
 * upload URL. The browser then uploads straight to Storage (bypassing the
 * serverless request-size limit) and calls `processDocument`.
 */
export async function createDocumentUpload(input: {
  projectId: string;
  fileName: string;
  fileSize: number;
}): Promise<ActionResult<{ documentId: string; path: string; token: string; contentType: string }>> {
  const user = await requireUser();
  const parsed = documentUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid file." };

  const { projectId, fileName } = parsed.data;
  const fileType = fileTypeFromName(fileName) as UploadableFileType;
  const supabase = await createClient();

  const guard = await assertCanAddDocument(supabase, projectId);
  if (!guard.ok) return guard;

  const path = `${user.workspace.id}/${projectId}/${randomUUID()}.${UPLOADABLE_FILE_TYPES[fileType].extension}`;
  const { data: signed, error: signError } = await supabase.storage
    .from(SOURCE_DOCUMENTS_BUCKET)
    .createSignedUploadUrl(path);
  if (signError || !signed) return { ok: false, message: "We couldn't start the upload. Please try again." };

  const { data: doc, error } = await supabase
    .from("source_documents")
    .insert({
      project_id: projectId,
      file_name: fileName,
      file_path: path,
      file_type: fileType,
      extraction_status: "uploaded",
    })
    .select("id")
    .single();
  if (error || !doc) return { ok: false, message: "We couldn't start the upload. Please try again." };

  return {
    ok: true,
    documentId: doc.id,
    path: signed.path,
    token: signed.token,
    contentType: UPLOADABLE_FILE_TYPES[fileType].mimeType,
  };
}

/**
 * Step 2 (also used for "Try again"): download the stored file, verify its real
 * type from its bytes, extract plain text, and save it. Files that fail the
 * content check are deleted from Storage.
 */
export async function processDocument(documentId: string): Promise<ActionResult> {
  await requireUser();
  if (!idSchema.safeParse(documentId).success) return { ok: false, message: "Document not found." };

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("source_documents")
    .select("id, project_id, file_path, file_type, extraction_status")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { ok: false, message: "Document not found." };
  if (doc.extraction_status === "extracted") return { ok: true };
  if (doc.file_type === "pasted_text" || !doc.file_path) {
    return { ok: false, message: "This file was removed. Please upload it again." };
  }

  const fileType = doc.file_type as UploadableFileType;
  const filePath = doc.file_path;
  const fail = async (message: string, removeFile = false) => {
    if (removeFile) await supabase.storage.from(SOURCE_DOCUMENTS_BUCKET).remove([filePath]);
    await supabase
      .from("source_documents")
      .update({
        extraction_status: "failed",
        extraction_error: message,
        ...(removeFile ? { file_path: null } : {}),
      })
      .eq("id", doc.id);
    revalidatePath(`/projects/${doc.project_id}`);
    return { ok: false as const, message };
  };

  await supabase
    .from("source_documents")
    .update({ extraction_status: "processing", extraction_error: null })
    .eq("id", doc.id);

  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from(SOURCE_DOCUMENTS_BUCKET)
      .download(filePath);
    if (downloadError || !blob) {
      return await fail("We couldn't find the uploaded file — the upload may not have finished. Please try again.");
    }
    if (blob.size > MAX_SOURCE_FILE_BYTES) {
      return await fail(`Files must be ${MAX_SOURCE_FILE_BYTES / 1024 / 1024} MB or smaller.`, true);
    }

    const result = await extractText(new Uint8Array(await blob.arrayBuffer()), fileType);
    if (!result.ok) return await fail(result.message, result.reason === "invalid_file");

    const { error } = await supabase
      .from("source_documents")
      .update({ raw_text: result.text, extraction_status: "extracted", extraction_error: null })
      .eq("id", doc.id);
    if (error) return await fail("We couldn't save the extracted text. Please try again.");

    await touchProject(supabase, doc.project_id);
    revalidatePath(`/projects/${doc.project_id}`);
    return { ok: true };
  } catch {
    return await fail("Something went wrong while reading this file. Please try again.");
  }
}

export type PasteTextState = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

export async function createPastedDocument(_prev: PasteTextState, formData: FormData): Promise<PasteTextState> {
  await requireUser();
  const parsed = pastedTextSchema.safeParse({
    projectId: formData.get("projectId"),
    text: formData.get("text"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid text." };

  const supabase = await createClient();
  const guard = await assertCanAddDocument(supabase, parsed.data.projectId);
  if (!guard.ok) return { status: "error", message: guard.message };

  const { text } = normalizeText(parsed.data.text);
  const { error } = await supabase.from("source_documents").insert({
    project_id: parsed.data.projectId,
    file_name: "Pasted text",
    file_path: null,
    file_type: "pasted_text",
    raw_text: text,
    extraction_status: "extracted",
  });
  if (error) return { status: "error", message: "We couldn't save that text. Please try again." };

  await touchProject(supabase, parsed.data.projectId);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { status: "success" };
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  await requireUser();
  if (!idSchema.safeParse(documentId).success) return { ok: false, message: "Document not found." };

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("source_documents")
    .select("id, project_id, file_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { ok: false, message: "Document not found." };

  if (doc.file_path) {
    const { error } = await supabase.storage.from(SOURCE_DOCUMENTS_BUCKET).remove([doc.file_path]);
    if (error) return { ok: false, message: "We couldn't delete the file. Please try again." };
  }
  const { error } = await supabase.from("source_documents").delete().eq("id", doc.id);
  if (error) return { ok: false, message: "We couldn't delete the document. Please try again." };

  revalidatePath(`/projects/${doc.project_id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/** RLS hides other workspaces' projects, so "not found" also covers "not yours". */
async function assertCanAddDocument(supabase: ServerClient, projectId: string): Promise<ActionResult> {
  const { data: project } = await supabase.from("projects").select("id, status").eq("id", projectId).maybeSingle();
  if (!project) return { ok: false, message: "Project not found." };
  if (project.status === "archived") return { ok: false, message: "This project is archived." };

  const { count } = await supabase
    .from("source_documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) >= MAX_DOCUMENTS_PER_PROJECT) {
    return { ok: false, message: `A project can have up to ${MAX_DOCUMENTS_PER_PROJECT} documents.` };
  }
  return { ok: true };
}

/** Bumps `updated_at` so the dashboard's "last activity" reflects document changes. */
async function touchProject(supabase: ServerClient, projectId: string) {
  await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
}
