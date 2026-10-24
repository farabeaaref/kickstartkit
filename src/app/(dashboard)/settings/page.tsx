import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and workspace." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Profile & workspace</CardTitle>
            <CardDescription>Update how you and your agency appear in KickstartKit.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm fullName={user.fullName ?? ""} workspaceName={user.workspace.name} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Avatar className="size-11">
              <AvatarFallback className="text-sm">{initials(user.fullName, user.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{user.fullName || "—"}</p>
              <p className="truncate text-sm text-muted-foreground" data-testid="account-email">
                {user.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
