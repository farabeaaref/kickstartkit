import { Badge } from "@/components/ui/badge";
import { extractionStatusMeta, projectStatusMeta } from "@/lib/projects/status";

export function ProjectStatusBadge({ status }: { status: string }) {
  const meta = projectStatusMeta(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function ExtractionStatusBadge({ status }: { status: string }) {
  const meta = extractionStatusMeta(status);
  return (
    <Badge variant={meta.variant} data-testid="extraction-status">
      {meta.label}
    </Badge>
  );
}
