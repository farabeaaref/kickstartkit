import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to see which projects are ready to start."
      footer={
        <>
          New to KickstartKit?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Start a free trial
          </Link>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-5">
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-11" />
    </div>
  );
}
