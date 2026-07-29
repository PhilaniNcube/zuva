import { listCoachSlots } from "../session-queries";
import { CoachSlotsView } from "./coach-slots-view";

export async function CoachSlots({ coachId }: { coachId: string }) {
  const slots = await listCoachSlots(coachId);
  return <CoachSlotsView slots={slots} />;
}

export function CoachSlotsSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-3 h-10 animate-pulse rounded-lg bg-zinc-100"
        />
      ))}
    </div>
  );
}
