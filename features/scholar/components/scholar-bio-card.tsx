"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  markScholarBioReviewed,
  updateScholarBioRewriteStatus,
} from "@/features/user/user-actions";
import { LocalTime } from "@/components/local-time";

interface ScholarBioCardProps {
  scholarUserId: string;
  bio: string | null;
  mtpText: string | null;
  bioReviewedAt?: Date | string | null;
  bioRewriteNeeded?: boolean;
  bioRewriteCompletedAt?: Date | string | null;
}

export function ScholarBioCard({
  scholarUserId,
  bio,
  mtpText,
  bioReviewedAt,
  bioRewriteNeeded = false,
  bioRewriteCompletedAt,
}: ScholarBioCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedBio, setEditedBio] = useState(bio ?? "");

  const isReviewed = Boolean(bioReviewedAt);
  const isRewriteCompleted = Boolean(bioRewriteCompletedAt);

  const handleToggleReviewed = () => {
    startTransition(async () => {
      const res = await markScholarBioReviewed({
        scholarUserId,
        reviewed: !isReviewed,
      });
      if (res.ok) {
        toast.success(
          isReviewed ? "Bio marked as unreviewed" : "Bio marked as reviewed"
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleToggleRewriteNeeded = () => {
    startTransition(async () => {
      const res = await updateScholarBioRewriteStatus({
        scholarUserId,
        rewriteNeeded: !bioRewriteNeeded,
      });
      if (res.ok) {
        toast.success(
          !bioRewriteNeeded
            ? "Flagged bio as needing update/rewrite"
            : "Cleared bio rewrite flag"
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleToggleRewriteCompleted = () => {
    startTransition(async () => {
      const res = await updateScholarBioRewriteStatus({
        scholarUserId,
        completed: !isRewriteCompleted,
      });
      if (res.ok) {
        toast.success(
          !isRewriteCompleted
            ? "Bio update/rewrite marked as completed"
            : "Bio rewrite completed status cleared"
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleSaveBio = () => {
    startTransition(async () => {
      const res = await updateScholarBioRewriteStatus({
        scholarUserId,
        updatedBio: editedBio,
        completed: true,
      });
      if (res.ok) {
        toast.success("Scholar bio updated & rewrite marked completed");
        setEditDialogOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/50">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            Scholar Bio & MTP
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Review the scholar&apos;s biography and Massive Transformative Purpose (MTP).
          </p>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {isReviewed ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-3" /> Reviewed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Clock className="size-3" /> Bio Review Pending
            </span>
          )}

          {isRewriteCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
              <Sparkles className="size-3" /> Rewrite Completed
            </span>
          ) : bioRewriteNeeded ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
              <AlertCircle className="size-3" /> Rewrite Needed
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {/* MTP Section */}
        <div className="space-y-2 rounded-lg bg-muted/30 p-3.5 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
            <Target className="size-3.5" />
            Massive Transformative Purpose (MTP)
          </div>
          <p className="text-sm font-medium text-foreground">
            {mtpText || <span className="italic text-muted-foreground">No MTP provided yet.</span>}
          </p>
        </div>

        {/* Bio Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Biography
            </span>
            {bioReviewedAt && (
              <span className="text-xs text-muted-foreground">
                Reviewed on <LocalTime value={new Date(bioReviewedAt)} format="date" />
              </span>
            )}
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-foreground leading-relaxed whitespace-pre-line">
            {bio || <span className="italic text-muted-foreground">No biography provided yet.</span>}
          </div>
        </div>

        {/* Admin Action Controls */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mark Reviewed Button */}
            <Button
              variant={isReviewed ? "outline" : "default"}
              size="sm"
              onClick={handleToggleReviewed}
              disabled={isPending}
              className="gap-1.5 text-xs"
            >
              {isPending ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              {isReviewed ? "Mark Unreviewed" : "Mark as Reviewed"}
            </Button>

            {/* Flag / Unflag Rewrite Needed Button */}
            <Button
              variant={bioRewriteNeeded ? "secondary" : "outline"}
              size="sm"
              onClick={handleToggleRewriteNeeded}
              disabled={isPending}
              className="gap-1.5 text-xs"
            >
              <AlertCircle className="size-3.5" />
              {bioRewriteNeeded ? "Clear Rewrite Flag" : "Flag Rewrite Needed"}
            </Button>

            {/* Complete Rewrite Button */}
            <Button
              variant={isRewriteCompleted ? "outline" : "secondary"}
              size="sm"
              onClick={handleToggleRewriteCompleted}
              disabled={isPending}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="size-3.5" />
              {isRewriteCompleted
                ? "Mark Rewrite Incomplete"
                : "Mark Rewrite Completed"}
            </Button>
          </div>

          {/* Edit / Rewrite Bio Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Edit3 className="size-3.5 text-primary" />
                  Edit / Rewrite Bio
                </Button>
              }
            />
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Edit3 className="size-5 text-primary" />
                  Edit & Rewrite Scholar Bio
                </DialogTitle>
                <DialogDescription>
                  Update the scholar&apos;s biography directly. Saving will save the changes and mark the bio rewrite as completed.
                </DialogDescription>
              </DialogHeader>

              <div className="py-3 space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Scholar Bio Text
                </label>
                <Textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  rows={8}
                  placeholder="Enter updated scholar biography..."
                  className="text-sm font-normal leading-relaxed"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveBio}
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : "Save & Complete Rewrite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScholarBioCardSkeleton() {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-60 animate-pulse rounded bg-muted mt-1" />
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="h-16 w-full animate-pulse rounded-lg bg-muted/40" />
        <div className="h-28 w-full animate-pulse rounded-lg bg-muted/40" />
      </CardContent>
    </Card>
  );
}
