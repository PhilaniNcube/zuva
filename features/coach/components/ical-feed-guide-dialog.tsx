"use client";

import { useState } from "react";
import {
  Calendar,
  HelpCircle,
  ExternalLink,
  Info,
  Check,
  Copy,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IcalFeedGuideDialogProps {
  trigger?: React.ReactNode;
  variant?: "button" | "link" | "icon";
  className?: string;
}

export function IcalFeedGuideDialog({
  trigger,
  variant = "link",
  className,
}: IcalFeedGuideDialogProps) {
  const [open, setOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    toast.success(`Example format copied!`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const defaultTrigger =
    variant === "button" ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`gap-1.5 text-xs ${className ?? ""}`}
      >
        <HelpCircle className="size-3.5 text-muted-foreground" />
        <span>How to get feed URL</span>
      </Button>
    ) : variant === "icon" ? (
      <button
        type="button"
        className={`rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
          className ?? ""
        }`}
        title="How to get your iCal feed URL"
        aria-label="How to get your iCal feed URL"
      >
        <HelpCircle className="size-4" />
      </button>
    ) : (
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${
          className ?? ""
        }`}
      >
        <HelpCircle className="size-3.5" />
        <span>How to get your calendar feed URL</span>
      </button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ? (trigger as any) : defaultTrigger} />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                How to get your Calendar iCal Feed URL
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sync your existing calendar to automatically block busy times and avoid double bookings.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Quick Explainer Card */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground space-y-1">
            <div className="flex items-center gap-2 font-medium text-primary">
              <Info className="size-3.5 shrink-0" />
              <span>What is an iCal (.ics) feed URL?</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An iCal feed URL is a read-only calendar export link ending in <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">.ics</code>. ZUVA checks this feed to find times when you are marked as &ldquo;Busy&rdquo; and keeps scholars from booking during those hours.
            </p>
          </div>

          <Tabs defaultValue="google">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="google" className="text-xs">
                Google
              </TabsTrigger>
              <TabsTrigger value="outlook" className="text-xs">
                Outlook / 365
              </TabsTrigger>
              <TabsTrigger value="apple" className="text-xs">
                Apple iCloud
              </TabsTrigger>
              <TabsTrigger value="other" className="text-xs">
                Other
              </TabsTrigger>
            </TabsList>

            {/* Google Calendar Tab */}
            <TabsContent value="google" className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Google Calendar (Desktop Web)
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Most Popular
                </span>
              </div>

              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li className="leading-relaxed">
                  Open{" "}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    calendar.google.com
                    <ExternalLink className="size-3" />
                  </a>{" "}
                  on your computer browser.
                </li>
                <li className="leading-relaxed">
                  In the left sidebar under <strong>&ldquo;My calendars&rdquo;</strong>, find your calendar.
                </li>
                <li className="leading-relaxed">
                  Hover over your calendar name, click the <strong>Options menu (⋮ three vertical dots)</strong>, and click <strong>&ldquo;Settings and sharing&rdquo;</strong>.
                </li>
                <li className="leading-relaxed">
                  In the left navigation menu, scroll down and click <strong>&ldquo;Integrate calendar&rdquo;</strong>.
                </li>
                <li className="leading-relaxed">
                  Locate the box labelled <strong>&ldquo;Secret address in iCal format&rdquo;</strong>.
                </li>
                <li className="leading-relaxed">
                  Click the <strong>Copy icon</strong> to copy the URL to your clipboard.
                </li>
              </ol>

              {/* Warning/Tip for Google */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  Important Google Calendar Tip
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                  Use the <strong>Secret address in iCal format</strong>. Do <em>not</em> use the &ldquo;Public address&rdquo; (unless your calendar is public) and do <em>not</em> use the standard web page URL from your browser address bar.
                </p>
              </div>

              {/* Example URL */}
              <div className="rounded-lg border bg-muted/40 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Example Google URL format:</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        "https://calendar.google.com/calendar/ical/yourname%40gmail.com/private-xxxx/basic.ics",
                        "google"
                      )
                    }
                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    {copiedUrl === "google" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    Copy format
                  </button>
                </div>
                <code className="block font-mono text-[11px] text-foreground break-all">
                  https://calendar.google.com/calendar/ical/.../private-xxxx/basic.ics
                </code>
              </div>
            </TabsContent>

            {/* Microsoft Outlook Tab */}
            <TabsContent value="outlook" className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Microsoft Outlook / Office 365 (Web)
                </span>
              </div>

              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li className="leading-relaxed">
                  Log in to Outlook on the web at{" "}
                  <a
                    href="https://outlook.live.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    outlook.live.com
                    <ExternalLink className="size-3" />
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://outlook.office.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    outlook.office.com
                    <ExternalLink className="size-3" />
                  </a>.
                </li>
                <li className="leading-relaxed">
                  Click the <strong>Settings gear icon (⚙️)</strong> in the top right header.
                </li>
                <li className="leading-relaxed">
                  Navigate to <strong>Calendar</strong> &rarr; <strong>Shared calendars</strong>.
                </li>
                <li className="leading-relaxed">
                  Scroll down to the <strong>&ldquo;Publish a calendar&rdquo;</strong> section.
                </li>
                <li className="leading-relaxed">
                  Select your calendar from the dropdown, choose <strong>&ldquo;Can view all details&rdquo;</strong> (or &ldquo;Can view when I&apos;m busy&rdquo;), and click <strong>Publish</strong>.
                </li>
                <li className="leading-relaxed">
                  Click on the <strong>ICS link</strong> and select <strong>&ldquo;Copy link&rdquo;</strong>.
                </li>
              </ol>

              {/* Example URL */}
              <div className="rounded-lg border bg-muted/40 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Example Outlook URL format:</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        "https://outlook.office365.com/owa/calendar/xxxx@domain.com/xxxx/reachcalendar.ics",
                        "outlook"
                      )
                    }
                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    {copiedUrl === "outlook" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    Copy format
                  </button>
                </div>
                <code className="block font-mono text-[11px] text-foreground break-all">
                  https://outlook.office365.com/owa/calendar/.../reachcalendar.ics
                </code>
              </div>
            </TabsContent>

            {/* Apple iCloud Tab */}
            <TabsContent value="apple" className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Apple Calendar (Mac / iCloud)
                </span>
              </div>

              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li className="leading-relaxed">
                  Open the <strong>Calendar app on your Mac</strong> or visit{" "}
                  <a
                    href="https://www.icloud.com/calendar"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    icloud.com/calendar
                    <ExternalLink className="size-3" />
                  </a>.
                </li>
                <li className="leading-relaxed">
                  In the left sidebar, click the <strong>Share icon</strong> (broadcast / person icon) next to your calendar name.
                </li>
                <li className="leading-relaxed">
                  Turn on <strong>&ldquo;Public Calendar&rdquo;</strong>.
                </li>
                <li className="leading-relaxed">
                  Click <strong>&ldquo;Copy Link&rdquo;</strong>.
                </li>
              </ol>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <Info className="size-3.5 shrink-0" />
                  Automatic &ldquo;webcal://&rdquo; conversion
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Apple calendar URLs often start with <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">webcal://</code>. You can paste it directly into ZUVA — our system automatically converts it to secure <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">https://</code> for synchronization.
                </p>
              </div>

              {/* Example URL */}
              <div className="rounded-lg border bg-muted/40 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Example Apple iCloud URL format:</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        "webcal://p123-caldav.icloud.com/published/2/xxxx",
                        "apple"
                      )
                    }
                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    {copiedUrl === "apple" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    Copy format
                  </button>
                </div>
                <code className="block font-mono text-[11px] text-foreground break-all">
                  webcal://p123-caldav.icloud.com/published/2/xxxx
                </code>
              </div>
            </TabsContent>

            {/* Other Providers Tab */}
            <TabsContent value="other" className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-foreground">
                Calendly, Proton, Fastmail & Other Tools
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="rounded-lg border p-2.5 space-y-1">
                  <strong className="text-foreground block">Calendly</strong>
                  <p className="text-[11px]">
                    Go to <strong>Account</strong> &rarr; <strong>Calendar Connections</strong> &rarr; scroll to <strong>&ldquo;Sync with other calendars&rdquo;</strong> to copy your iCal subscription feed URL.
                  </p>
                </div>

                <div className="rounded-lg border p-2.5 space-y-1">
                  <strong className="text-foreground block">Proton Calendar</strong>
                  <p className="text-[11px]">
                    Go to <strong>Settings</strong> &rarr; <strong>Calendars</strong> &rarr; select calendar &rarr; <strong>&ldquo;Share outside Proton&rdquo;</strong> &rarr; Create a public/secret link in iCal format.
                  </p>
                </div>

                <div className="rounded-lg border p-2.5 space-y-1">
                  <strong className="text-foreground block">Other / Custom iCalendar feeds</strong>
                  <p className="text-[11px]">
                    Any standard iCalendar feed URL ending in <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">.ics</code> or served via <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">https://</code> / <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">webcal://</code> is supported.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Got it, close guide
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
