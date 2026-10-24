import "server-only";

import { requireUser } from "@/lib/auth/session";
import { countWords } from "@/lib/documents/text";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validation/projects";

export type ProjectSummary = {
  id: string;
  projectName: string;
  clientName: string;
  status: string;
  dueDate: string | null;
  readiness: number;
  updatedAt: string;
};

export type SourceDocumentView = {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  error: string | null;
  /** Whether an original file is stored (false for pasted text and rejected files). */
  hasFile: boolean;
  text: string | null;
  wordCount: number;
  createdAt: string;
};

export type ProjectDetail = ProjectSummary & {
  description: string | null;
  createdAt: string;
  documents: SourceDocumentView[];
};

/** All projects in the current user's workspace (RLS-scoped), most recently active first. */
export async function listProjects(): Promise<ProjectSummary[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, project_name, client_name, status, due_date, readiness_percentage, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Failed to load projects: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    projectName: row.project_name,
    clientName: row.client_name,
    status: row.status,
    dueDate: row.due_date,
    readiness: row.readiness_percentage,
    updatedAt: row.updated_at,
  }));
}

/** Returns null for malformed ids and for projects outside the user's workspace. */
export async function getProject(projectId: string): Promise<ProjectDetail | null> {
  await requireUser();
  if (!idSchema.safeParse(projectId).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `id, project_name, client_name, description, status, due_date, readiness_percentage, created_at, updated_at,
       source_documents (id, file_name, file_type, file_path, extraction_status, extraction_error, raw_text, created_at)`,
    )
    .eq("id", projectId)
    .order("created_at", { referencedTable: "source_documents", ascending: false })
    .maybeSingle();
  if (error) throw new Error(`Failed to load project: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    projectName: data.project_name,
    clientName: data.client_name,
    description: data.description,
    status: data.status,
    dueDate: data.due_date,
    readiness: data.readiness_percentage,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    documents: data.source_documents.map((doc) => ({
      id: doc.id,
      fileName: doc.file_name ?? "Untitled",
      fileType: doc.file_type,
      status: doc.extraction_status,
      error: doc.extraction_error,
      hasFile: Boolean(doc.file_path),
      text: doc.raw_text,
      wordCount: doc.raw_text ? countWords(doc.raw_text) : 0,
      createdAt: doc.created_at,
    })),
  };
}
