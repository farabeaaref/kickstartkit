"use client";

import { LayoutDashboard, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: ["/dashboard", "/projects/"] },
  { href: "/projects/new", label: "New project", icon: Plus, match: ["/projects/new"] },
  { href: "/settings", label: "Settings", icon: Settings, match: ["/settings"] },
] as const;

type Orientation = "vertical" | "horizontal";

/**
 * Reading the pathname is request-time data, so it sits behind Suspense; the
 * fallback renders the same links without the active highlight.
 */
export function DashboardNav({ orientation = "vertical" }: { orientation?: Orientation }) {
  return (
    <Suspense fallback={<NavLinks orientation={orientation} />}>
      <ActiveNavLinks orientation={orientation} />
    </Suspense>
  );
}

function ActiveNavLinks({ orientation }: { orientation: Orientation }) {
  return <NavLinks orientation={orientation} active={activeHref(usePathname())} />;
}

function NavLinks({ orientation, active: activeItem }: { orientation: Orientation; active?: string }) {
  return (
    <nav aria-label="Main" className={cn("flex gap-1", orientation === "vertical" ? "flex-col" : "flex-row")}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = activeItem === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className={cn(orientation === "horizontal" && "sr-only sm:not-sr-only")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Most specific nav item for the current path (project pages count as "Dashboard"). */
function activeHref(pathname: string): string | undefined {
  if (pathname === "/projects/new") return "/projects/new";
  return NAV_ITEMS.find(({ match }) => match.some((prefix) => pathname === prefix || pathname.startsWith(prefix)))
    ?.href;
}
