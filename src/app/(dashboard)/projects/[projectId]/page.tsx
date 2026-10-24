import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentIntake } from "@/components/projects/document-intake";
import { DocumentList } from "@/components/projects/document-list";
import { ProjectStatusBadge } from "@/components/projects/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProject } from "@/lib/projects/queries";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Project" };

// Per-user data on every request: navigations stream behind loading.tsx rather than being instant.
export const instant = false;

export default async function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const dueDate = formatDate(project.dueDate);
  const extractedCount = project.documents.filter((doc) => doc.status === "extracted").length;

  return (
    <>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> All projects
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{project.clientName}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight break-words sm:text-3xl">{project.projectName}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <ProjectStatusBadge status={project.status} />
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              {dueDate ? `Due ${dueDate}` : "No due date"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              Updated {formatRelativeTime(project.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Source documents</CardTitle>
            <CardDescription>
              Add the proposal, brief, contract, email thread, or discovery-call transcript. We&apos;ll pull out the
              text so KickstartKit can build your client checklist.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <DocumentIntake projectId={project.id} />
            <DocumentList documents={project.documents} />
          </CardContent>
        </Card>

        <div className="grid h-fit gap-6">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-base">Readiness</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold tracking-tight">{project.readiness}%</span>
                <span className="text-xs text-muted-foreground">of required items</span>
              </div>
              <Progress value={project.readiness} aria-label="Project readiness" />
              <p className="text-xs text-muted-foreground">
                {extractedCount > 0
                  ? `${extractedCount} document${extractedCount === 1 ? "" : "s"} ready for the checklist.`
                  : "Add a document to get started."}
              </p>
            </CardContent>
          </Card>

          {project.description ? (
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-base">About this project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
