"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { syncCoachAvailability } from "../coach-sync-actions";

/** Coach self-service "sync my calendar" button. */
export function CoachSyncButton({ disabled }: { disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSync = () => {
    startTransition(async () => {
      const res = await syncCoachAvailability();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.data?.slotsCreated !== undefined
          ? `Sync complete! Synced ${res.data.slotsCreated} available slot(s).`
          : "Sync complete! Calendar schedule is up to date.",
      );
      router.refresh();
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
