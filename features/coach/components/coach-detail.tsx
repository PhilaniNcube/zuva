import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MessageSquare,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LocalTime } from "@/components/local-time";
import { getCoachDetail } from "../coach-queries";
import { SPECIALTIES } from "../specialties";
import { CoachEditForm } from "./coach-edit-form";

interface CoachDetailProps {
  id: Promise<string> | string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function CoachDetail({ id }: CoachDetailProps) {
  const coachUserId = typeof id === "string" ? id : await id;
  const coach = await getCoachDetail(coachUserId);

  if (!coach) {
    notFound();
  }

  const specialtyLabel = SPECIALTIES[coach.specialty] ?? coach.specialty;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation */}
      <div>
        <Link
          href="/coaches"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="size-3.5" />
          Back to Coaches
        </Link>
      </div>

      {/* Coach Profile Banner / Header */}
      <div className="rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shrink-0 border border-indigo-500/20">
              {getInitials(coach.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {coach.name}
                </h1>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  {specialtyLabel}
                </span>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
                  {coach.role}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{coach.email}</p>
              {coach.bio ? (
                <p className="text-sm text-foreground/80 mt-2 max-w-2xl line-clamp-2">
                  {coach.bio}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center">
            <CoachEditForm
              coachUserId={coach.id}
              initial={{
                name: coach.name,
                specialty: coach.specialty,
                whatsappNumber: coach.whatsappNumber,
                bio: coach.bio ?? "",
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact & Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Coach Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2.5">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <span className="truncate">{coach.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageSquare className="size-4 text-muted-foreground shrink-0" />
              <a
                href={`https://wa.me/${coach.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-primary hover:underline"
              >
                {coach.whatsappNumber}
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                Joined: {format(new Date(coach.createdAt), "dd MMM yyyy")}
              </span>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Calendar Integration
              </p>
              {coach.icalUrl ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  <span>iCal sync active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>No calendar URL linked</span>
                </div>
              )}
              {coach.lastSyncedAt && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Last synced: <LocalTime value={new Date(coach.lastSyncedAt)} />
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions Hosted */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Recent Programme Sessions</CardTitle>
              <CardDescription>Sessions assigned to or hosted by this coach</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {coach.sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No sessions hosted by this coach yet.
              </p>
            ) : (
              <div className="divide-y text-xs">
                {coach.sessions.map((s) => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground text-sm">{s.title}</p>
                      <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                        <Clock className="size-3" />
                        <span>
                          <LocalTime value={new Date(s.startsAt)} /> — <LocalTime value={new Date(s.endsAt)} />
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.meetLink && (
                        <a
                          href={s.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Video className="size-3.5" />
                          Meet
                        </a>
                      )}
                      <Badge variant="outline" className="capitalize text-[11px]">
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CoachDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-28 animate-pulse rounded-xl bg-muted/60" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
        <div className="md:col-span-2 h-48 animate-pulse rounded-xl bg-muted/60" />
      </div>
    </div>
  );
}
