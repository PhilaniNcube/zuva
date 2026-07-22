"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserDropdown } from "@/features/user/components/user-dropdown";

const LINKS = [
  { href: "/approvals", label: "Approvals" },
  { href: "/reports", label: "Reports" },
];

export function MindsNav() {
  const pathname = usePathname();
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <div className="flex items-center gap-6">
        <span className="font-semibold">ZUVA MINDS</span>
        <nav className="flex gap-4 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                pathname.startsWith(l.href)
                  ? "font-medium text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
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
