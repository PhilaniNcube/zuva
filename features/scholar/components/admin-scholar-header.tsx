import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  Clock,
  ExternalLink,
  Globe,
  GraduationCap,
  Mail,
  MessageCircle,
  Shield,
  UserCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCohort, listCohorts } from "@/features/cohort/cohort-queries";
import { getUser, getScholarProfile } from "@/features/user/user-queries";
import { waLink } from "@/lib/whatsapp";
import { AdminScholarEditButton } from "./admin-scholar-edit-button";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function AdminScholarHeader({ scholarId }: { scholarId: string }) {
  const [user, profile, cohorts] = await Promise.all([
    getUser(scholarId),
    getScholarProfile(scholarId),
    listCohorts(),
  ]);
  if (!user || user.role !== "scholar") notFound();

  const cohortRow = profile?.cohortId ? await getCohort(profile.cohortId) : null;

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-2xl">
            {getInitials(user.name)}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {user.name}
                  </h1>
                  <Badge variant="secondary" className="capitalize text-xs font-semibold px-3 py-1">
                    <Shield className="mr-1 size-3" /> Scholar
                  </Badge>
                  {profile?.onboardingCompletedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <UserCheck className="size-3" /> Onboarded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                      <Clock className="size-3" /> Onboarding pending
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="size-3.5" /> {user.email}
                </p>
              </div>

              <div className="flex items-center gap-2 self-center sm:self-auto">
                {cohortRow ? (
                  <Link
                    href={`/cohorts/${cohortRow.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <GraduationCap className="size-3.5 text-primary" />
                    {cohortRow.name}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <GraduationCap className="size-3.5" /> No cohort
                  </span>
                )}
                <AdminScholarEditButton
                  scholar={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    country: profile?.country,
                    degree: profile?.degree,
                    institution: profile?.institution,
                    whatsappNumber: profile?.whatsappNumber,
                    linkedinUrl: profile?.linkedinUrl,
                    bio: profile?.bio,
                    mtpText: profile?.mtpText,
                    cohortId: profile?.cohortId,
                  }}
                  cohorts={cohorts}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
              {profile?.country ? (
                <span className="inline-flex items-center gap-1">
                  <Globe className="size-3.5" /> {profile.country}
                </span>
              ) : null}
              {profile?.institution ? (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Building2 className="size-3.5 text-primary" /> {profile.institution}
                </span>
              ) : null}
              {profile?.degree ? (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <GraduationCap className="size-3.5 text-primary" /> {profile.degree}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> Joined{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {profile?.whatsappNumber ? (
                <a
                  href={waLink(
                    profile.whatsappNumber,
                    `Hi ${user.name}, reaching out regarding ZUVA programme.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle className="size-3.5" /> WhatsApp
                </a>
              ) : null}
              {profile?.linkedinUrl ? (
                <a
                  href={
                    profile.linkedinUrl.startsWith("http")
                      ? profile.linkedinUrl
                      : `https://${profile.linkedinUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline"
                >
                  <ExternalLink className="size-3.5" /> LinkedIn
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminScholarHeaderSkeleton() {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="flex-1 space-y-3 w-full">
            <div className="space-y-2">
              <Skeleton className="h-7 w-44 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-56 mx-auto sm:mx-0" />
            </div>
            <div className="pt-3 border-t border-border">
              <Skeleton className="h-4 w-40 mx-auto sm:mx-0" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
