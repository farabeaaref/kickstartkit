import { FolderKanban, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listProjects } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Dashboard" };

// Per-user data on every request: navigations stream behind loading.tsx rather than being instant.
export const instant = false;

export default async function DashboardPage() {
  const [user, projects] = await Promise.all([requireUser(), listProjects()]);
  const firstName = user.fullName?.split(" ")[0];

  const newProjectButton = (
    <Button asChild>
      <Link href="/projects/new">
        <Plus /> New project
      </Link>
    </Button>
  );

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : "Welcome"}
        description={`${user.workspace.name} · Track every project from signed deal to ready-to-start.`}
        actions={projects.length > 0 ? newProjectButton : undefined}
      />
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project, drop in the proposal or brief, and KickstartKit will build the client onboarding checklist for you."
          action={newProjectButton}
        />
      ) : (
        <section aria-label="Projects" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      )}
    </>
  );
}
