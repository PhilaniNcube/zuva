"use client";

import { useState } from "react";
import { UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditScholarDialog, type CohortOption, type ScholarProfileData } from "@/features/user/components/edit-scholar-dialog";

export function AdminScholarEditButton({
  scholar,
  cohorts = [],
}: {
  scholar: ScholarProfileData;
  cohorts?: CohortOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <UserPen className="size-3.5 text-primary" />
        Edit Profile
      </Button>
      {open && (
        <EditScholarDialog
          scholar={scholar}
          cohorts={cohorts}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
