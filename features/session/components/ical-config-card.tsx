"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  Clock,
  HelpCircle,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { LocalTime } from "@/components/local-time";
import { Button } from "@/components/ui/button";
import { IcalFeedGuideDialog } from "@/features/coach/components/ical-feed-guide-dialog";
import {
  saveCoachIcalUrl,
  syncCoachAvailability,
} from "@/features/coach/coach-sync-actions";

interface IcalConfigCardProps {
  icalUrl?: string | null;
  lastSyncedAt?: Date | null;
}

export function IcalConfigCard({
  icalUrl: initialIcalUrl,
  lastSyncedAt,
}: IcalConfigCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isSyncing, startSyncTransition] = useTransition();

  const [icalUrl, setIcalUrl] = useState(initialIcalUrl ?? "");

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveCoachIcalUrl({ icalUrl });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(
        res.data?.slotsCreated
          ? `Calendar feed saved! Synced ${res.data.slotsCreated} available slot(s).`
          : "Calendar feed saved & synced successfully.",
      );
    });
  };

  const handleSyncNow = () => {
    startSyncTransition(async () => {
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
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4 p-3">
        {/* Header & Overview */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
              <Calendar className="h-5 w-5 text-zinc-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900">
                  External Calendar Feed (Busy-Time Integration)
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  ★ Conflict Prevention
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Link your Google, Outlook, or Apple Calendar feed. ZUVA checks your external calendar for busy events and automatically blocks those times during your accepted booking windows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IcalFeedGuideDialog variant="button" />

            {initialIcalUrl && (
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing ? "Syncing..." : "Sync Calendar Now"}
              </button>
            )}
          </div>
        </div>

        {/* Feed URL Form */}
        <form onSubmit={handleSaveUrl} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-zinc-400" />
              Calendar iCal Address (.ics Feed URL)
            </label>

            <IcalFeedGuideDialog variant="link" />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <input
              type="url"
              required
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-hidden"
            />
            <Button type="submit" disabled={isPending} size="sm">
              {isPending ? "Saving & Syncing..." : "Save & Sync Feed"}
            </Button>
          </div>
        </form>

        {lastSyncedAt && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Last synced: <LocalTime value={new Date(lastSyncedAt)} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
