"use client";

import { useState, type ReactElement } from "react";
import { Clock, SlidersHorizontal } from "lucide-react";

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

export function AdminCoachWorkingHoursDialog({
  coachUserId,
  workingHours,
  trigger,
}: {
  coachUserId: string;
  workingHours?: WorkingHoursInput | null;
  trigger?: ReactElement;
}) {
  const [open, setOpen] = useState(false);

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
          <DialogTitle>Coach Working Hours & Booking Schedule</DialogTitle>
          <DialogDescription>
            Stipulate recurring days, start and end times, slot durations, and date overrides for this coach.
          </DialogDescription>
        </DialogHeader>
        <CoachWorkingHoursForm
          coachUserId={coachUserId}
          initialWorkingHours={workingHours}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
