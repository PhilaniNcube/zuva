"use client";

import { useTransition } from "react";

import { deleteResource } from "../resource-actions";

export function DeleteResourceButton({ resourceId }: { resourceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteResource(resourceId);
        })
      }
      className="text-xs text-red-600 underline"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
