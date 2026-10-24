import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const PROJECT_STATUSES = ["draft", "awaiting_client", "in_progress", "ready", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "muted" },
  awaiting_client: { label: "Awaiting client", variant: "info" },
  in_progress: { label: "In progress", variant: "warning" },
  ready: { label: "Ready", variant: "success" },
  archived: { label: "Archived", variant: "outline" },
};

export const EXTRACTION_STATUSES = ["uploaded", "processing", "extracted", "failed"] as const;
export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];

export const EXTRACTION_STATUS_META: Record<ExtractionStatus, { label: string; variant: BadgeVariant }> = {
  uploaded: { label: "Uploaded", variant: "muted" },
  processing: { label: "Processing", variant: "info" },
  extracted: { label: "Extracted", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

export function projectStatusMeta(status: string) {
  return PROJECT_STATUS_META[status as ProjectStatus] ?? PROJECT_STATUS_META.draft;
}

export function extractionStatusMeta(status: string) {
  return EXTRACTION_STATUS_META[status as ExtractionStatus] ?? EXTRACTION_STATUS_META.uploaded;
}
