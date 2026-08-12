"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminSyncCoachAvailability } from "../coach-sync-actions";

export function AdminCoachSyncButton({
  coachUserId,
  disabled,
}: {
  coachUserId: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const res = await adminSyncCoachAvailability(coachUserId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.data?.slotsCreated !== undefined
          ? `Sync complete! Synced ${res.data.slotsCreated} available slot(s).`
          : "Sync complete! Coach calendar schedule is up to date.",
      );
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isPending || disabled}
      className="gap-1.5 text-xs"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Syncing..." : "Sync Calendar Now"}
    </Button>
  );
}
