"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-red-50 text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        We couldn&apos;t load this page. Please try again — if it keeps happening, contact support.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
