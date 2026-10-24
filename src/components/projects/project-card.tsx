import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import type { ProjectSummary } from "@/lib/projects/queries";
import { formatDate, formatRelativeTime } from "@/lib/utils";

import { ProjectStatusBadge } from "./status-badge";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const dueDate = formatDate(project.dueDate);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs transition-all outline-none hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
      data-testid="project-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {project.clientName}
          </p>
          <h2 className="mt-1 line-clamp-2 font-semibold group-hover:text-primary">{project.projectName}</h2>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>
      <div className="grid gap-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Ready to start</span>
          <span className="font-medium">{project.readiness}%</span>
        </div>
        <Progress value={project.readiness} aria-label={`${project.projectName} readiness`} />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden />
          {dueDate ? `Due ${dueDate}` : "No due date"}
        </span>
        <span>Active {formatRelativeTime(project.updatedAt)}</span>
      </div>
    </Link>
  );
}
