import { FolderKanban } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.fullName?.split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : "Welcome"}
        description={`${user.workspace.name} · Track every project from signed deal to ready-to-start.`}
      />
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create a project, drop in the proposal or brief, and KickstartKit will build the client onboarding checklist for you."
      />
    </>
  );
}
