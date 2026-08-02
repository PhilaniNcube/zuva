"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

interface CohortTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  cohortId: string;
  children: React.ReactNode;
}

export function CohortTableRow({
  cohortId,
  children,
  className = "",
  ...props
}: CohortTableRowProps) {
  const router = useRouter();

  return (
    <TableRow
      {...props}
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${className}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest(
            "button, a, [role='dialog'], [role='menuitem'], input, select, textarea"
          )
        ) {
          return;
        }
        router.push(`/cohorts/${cohortId}`);
      }}
    >
      {children}
    </TableRow>
  );
}
