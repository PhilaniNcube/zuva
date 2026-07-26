"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserDropdown } from "@/features/user/components/user-dropdown";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/editing", label: "Editing" },
  { href: "/cohorts", label: "Cohorts" },
  { href: "/coaches", label: "Coaches" },
  { href: "/schedule", label: "Schedule" },
  { href: "/resources", label: "Resources" },
  { href: "/users", label: "Users" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/85 backdrop-blur-md px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-heading font-bold text-lg text-foreground tracking-tight">ZUVA Admin</span>
        <nav className="flex gap-4 text-sm font-medium">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                pathname.startsWith(l.href)
                  ? "font-semibold text-primary border-b-2 border-primary pb-0.5"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <UserDropdown side="bottom" align="end" />
    </header>
  );
}
