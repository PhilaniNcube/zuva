"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CoachWorkingHoursForm } from "@/features/session/components/coach-working-hours-form";
import type { WorkingHoursInput } from "../working-hours";

/**
 * Coach self-service working-hours dialog. Unlike the admin variant, it omits
 * `coachUserId` so the underlying form saves via the coach-scoped action.
 */
export function CoachWorkingHoursDialog({
  workingHours,
  trigger,
}: {
  workingHours?: WorkingHoursInput | null;
  trigger?: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Clock className="size-3.5" />
              Configure Working Hours
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="sr-only">
          <DialogTitle>Working Hours & Booking Schedule</DialogTitle>
          <DialogDescription>
            Stipulate recurring days, start and end times, slot durations, and date overrides for your 1:1 coaching bookings.
          </DialogDescription>
        </DialogHeader>
        <CoachWorkingHoursForm
          initialWorkingHours={workingHours}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
