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
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
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
          ? `Calendar synced! Created ${res.data.slotsCreated} open slot(s) tagged #zuva.`
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
        res.data?.slotsCreated
          ? `Sync complete! Imported ${res.data.slotsCreated} new #zuva slot(s).`
          : "Sync complete! Calendar schedule is up to date.",
      );
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4  p-3">
        {/* Header & Overview */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
              <Calendar className="h-5 w-5 text-zinc-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900">
                  Calendar iCal Feed
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  ★ Single Source of Truth
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Manage your availability in your own calendar. Simply title events with <code className="font-semibold text-zinc-800">#zuva</code> or <code className="font-semibold text-zinc-800">ZUVA</code> to publish open 1:1 coaching slots.
              </p>
            </div>
          </div>

          {initialIcalUrl && (
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing..." : "Sync Calendar Now"}
            </button>
          )}
        </div>

        {/* Feed URL Form */}
        <form onSubmit={handleSaveUrl} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-zinc-400" />
              Calendar iCal Address (.ics Feed URL)
            </label>

            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
                    How to get your feed URL
                  </button>
                }
              />
              <PopoverContent className="w-96 p-4 text-xs space-y-3">
                <PopoverHeader>
                  <PopoverTitle className="text-xs font-semibold text-zinc-900">
                    How to get your Calendar iCal Feed URL
                  </PopoverTitle>
                </PopoverHeader>
                <div className="space-y-2.5 text-[11px] text-zinc-600">
                  {/* Google Calendar */}
                  <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-200/80 space-y-1">
                    <span className="font-semibold text-zinc-900 flex items-center justify-between">
                      <span>Google Calendar</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                        Popular
                      </span>
                    </span>
                    <ol className="list-decimal list-inside text-zinc-600 text-[11px] space-y-0.5">
                      <li>Go to <code className="text-zinc-800 font-mono">calendar.google.com</code> on desktop.</li>
                      <li>On the left sidebar under <strong>"My calendars"</strong>, hover over your calendar and click <strong>⋮ (3 dots)</strong> → <strong>Settings and sharing</strong>.</li>
                      <li>Scroll down the left panel to <strong>"Integrate calendar"</strong>.</li>
                      <li>Copy the URL inside <strong>"Secret address in iCal format"</strong> (ends with <code className="text-zinc-800 font-mono">.ics</code>).</li>
                    </ol>
                  </div>

                  {/* Outlook */}
                  <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-200/80 space-y-1">
                    <span className="font-semibold text-zinc-900">Outlook / Office 365</span>
                    <ol className="list-decimal list-inside text-zinc-600 text-[11px] space-y-0.5">
                      <li>Open Outlook Web → Click <strong>Settings ⚙️</strong> → <strong>Calendar</strong> → <strong>Shared calendars</strong>.</li>
                      <li>Under <strong>"Publish a calendar"</strong>, select your calendar, set permissions to <em>"Can view all details"</em>, and click <strong>Publish</strong>.</li>
                      <li>Copy the <strong>ICS link</strong>.</li>
                    </ol>
                  </div>

                  {/* Apple Calendar */}
                  <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-200/80 space-y-1">
                    <span className="font-semibold text-zinc-900">Apple iCloud Calendar</span>
                    <ol className="list-decimal list-inside text-zinc-600 text-[11px] space-y-0.5">
                      <li>Open iCloud Calendar or Mac Calendar app.</li>
                      <li>Click the <strong>Share icon</strong> next to your calendar name.</li>
                      <li>Check <strong>"Public Calendar"</strong> and copy the link.</li>
                    </ol>
                  </div>

                  {/* Calendly */}
                  <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-200/80 space-y-1">
                    <span className="font-semibold text-zinc-900">Calendly</span>
                    <p className="text-zinc-600">
                      Go to Account Settings → Calendar Connections → Export iCal feed URL.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
