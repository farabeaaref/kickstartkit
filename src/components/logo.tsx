import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4.5" strokeWidth={2.5} stroke="currentColor">
        <path d="M6 4v16M6 12l9-8M9.5 9.5 18 20" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-lg">KickstartKit</span>
    </Link>
  );
}
