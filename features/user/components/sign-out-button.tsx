"use client";

import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() =>
        signOut().then(() => {
          router.push("/login");
          router.refresh();
        })
      }
      className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
    >
      Sign out
    </button>
  );
}
