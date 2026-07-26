import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCoaches } from "../coach-queries";
import { SPECIALTIES } from "../specialties";
import { CoachEditForm } from "./coach-edit-form";

export async function CoachDirectory() {
  const coaches = await listCoaches();
  if (coaches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No coaches yet — add the first one above.
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Coach</TableHead>
          <TableHead>Specialty</TableHead>
          <TableHead>WhatsApp</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {coaches.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {getInitials(c.name)}
                </div>
                <div>
                  <span className="font-medium text-foreground text-sm">{c.name}</span>
                  {c.bio ? (
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{c.bio}</p>
                  ) : null}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                {SPECIALTIES[c.specialty]}
              </span>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {c.whatsappNumber}
            </TableCell>
            <TableCell className="text-muted-foreground">{c.email}</TableCell>
            <TableCell className="text-right">
              <CoachEditForm
                coachUserId={c.id}
                initial={{
                  specialty: c.specialty,
                  whatsappNumber: c.whatsappNumber,
                  bio: c.bio ?? "",
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CoachDirectorySkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-3 h-10 animate-pulse rounded-lg bg-muted/60"
        />
      ))}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
