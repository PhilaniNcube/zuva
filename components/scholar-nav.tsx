"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/features/user/components/sign-out-button";

const LINKS = [
  { href: "/pathway", label: "Pathway" },
  { href: "/sessions", label: "Sessions" },
  { href: "/submissions", label: "Submissions" },
  { href: "/library", label: "Library" },
];

export function ScholarNav() {
  const pathname = usePathname();
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <div className="flex items-center gap-6">
        <span className="font-semibold">ZUVA</span>
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
      <SignOutButton />
    </header>
  );
}
