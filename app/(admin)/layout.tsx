import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminGate } from "@/lib/role-gate";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

function AdminNavFallback() {
  return (
    <div className="flex h-16 items-center border-b px-4">
      <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
              Admin Portal
            </span>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Suspense fallback={<AdminNavFallback />}>
            <AdminGate>{children}</AdminGate>
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
