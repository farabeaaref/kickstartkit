import Link from "next/link";
import { Suspense } from "react";

import { DashboardNav } from "@/components/dashboard/nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Logo, LogoMark } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-muted/40 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r bg-background px-4 py-5 lg:flex">
        <Logo href="/dashboard" className="px-2" />
        <DashboardNav />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/dashboard" aria-label="KickstartKit dashboard">
              <LogoMark />
            </Link>
            <DashboardNav orientation="horizontal" />
          </div>
          <div className="hidden lg:block" />
          <Suspense fallback={<Skeleton className="h-9 w-40 rounded-lg" />}>
            <UserMenu />
          </Suspense>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
