"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

import { approveCertificate } from "../certificate-actions";

async function action(
  certificateId: string,
  _prev: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  return approveCertificate({ certificateId });
}

export function ApproveButton({ certificateId }: { certificateId: string }) {
  const [state, formAction, isPending] = useActionState(
    action.bind(null, certificateId),
    null,
  );

  useEffect(() => {
    if (state?.ok) toast.success("Certificate approved and issued");
    if (state && !state.ok) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Approving…" : "Approve & issue"}
      </Button>
    </form>
  );
}
