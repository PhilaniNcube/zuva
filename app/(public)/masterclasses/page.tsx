import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { listPublishedMasterclasses } from "@/features/masterclass/masterclass-queries";

export const metadata: Metadata = {
  title: "Masterclasses | ZUVA Scholar Hub",
  description:
    "The ZUVA masterclass series — Academic Writing, Data and Decisions, and Leadership Beyond Your Degree.",
};

async function MasterclassGrid() {
  const masterclasses = await listPublishedMasterclasses();

  if (masterclasses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Masterclass pages are coming soon.
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {masterclasses.map((masterclass) => (
        <Link
          key={masterclass.slug}
          href={`/masterclasses/${masterclass.slug}`}
          className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
        >
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {masterclass.name}
          </h2>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            {masterclass.headline}
          </p>
          {masterclass.facilitator ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Facilitated by {masterclass.facilitator.name}
            </p>
          ) : null}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            View details
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

function MasterclassGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-xl border border-border bg-muted/60"
        />
      ))}
    </div>
  );
}

export default function MasterclassesPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          The ZUVA Masterclass Series
        </h1>
        <p className="mt-3 text-muted-foreground">
          Three intensive sessions designed to strengthen postgraduate research
          and leadership. Enrolled scholars can reserve a spot and join straight
          from the Scholar Hub.
        </p>
      </div>

      <Suspense fallback={<MasterclassGridSkeleton />}>
        <MasterclassGrid />
      </Suspense>
    </div>
  );
}
