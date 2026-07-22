import Link from "next/link";
import { ArrowLeft, User, Mail, Shield, Calendar, Edit, Globe, Phone, FileText } from "lucide-react";

import { requireUser } from "@/lib/rbac";
import { roleHome, type Role } from "@/lib/roles";
import { getScholarProfile } from "@/features/user/user-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function ProfileContent() {
  const session = await requireUser();
  const user = session.user;
  const role = user.role as Role;

  const scholarDetails = role === "scholar" ? await getScholarProfile(user.id) : null;
  const initials = getInitials(user.name);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={roleHome(role)}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Hub
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Header Profile Card */}
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <Avatar className="size-20 border-2 border-primary/10">
                {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      {user.name}
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <Mail className="size-3.5" />
                      {user.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs font-semibold px-3 py-1 self-center sm:self-start">
                    <Shield className="mr-1 size-3" />
                    {role}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scholar Specific Profile Information */}
        {role === "scholar" && (
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Scholar Details</CardTitle>
                <CardDescription>Your personal and research profile details</CardDescription>
              </div>
              <Link
                href="/onboarding"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Edit className="mr-1.5 size-3.5" />
                Update Profile
              </Link>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Globe className="size-3.5" />
                    Country
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {scholarDetails?.country || "Not specified"}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Phone className="size-3.5" />
                    WhatsApp Number
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {scholarDetails?.whatsappNumber || "Not specified"}
                  </div>
                </div>
              </div>

              {scholarDetails?.bio && (
                <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <User className="size-3.5" />
                    Bio
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {scholarDetails.bio}
                  </p>
                </div>
              )}

              {scholarDetails?.mtpText && (
                <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <FileText className="size-3.5" />
                    Massive Transformative Purpose (MTP)
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {scholarDetails.mtpText}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

export function ProfileContentSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="grid gap-6">
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Skeleton className="size-20 rounded-full" />
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-44" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="pt-2 border-t border-border">
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="h-8 w-28" />
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
