import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectForm } from "@/components/projects/project-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New project"
        description="Start with the basics. Next, you'll add the proposal, brief, or call transcript."
      />
      <Card>
        <CardContent>
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
