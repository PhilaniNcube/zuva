"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Calendar,
  FileText,
  BookOpen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SignOutButton } from "@/features/user/components/sign-out-button";

const navItems = [
  {
    title: "Pathway",
    url: "/pathway",
    icon: Compass,
  },
  {
    title: "Sessions",
    url: "/sessions",
    icon: Calendar,
  },
  {
    title: "Submissions",
    url: "/submissions",
    icon: FileText,
  },
  {
    title: "Library",
    url: "/library",
    icon: BookOpen,
  },
];

export function ScholarSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link
          href="/pathway"
          className="flex items-center gap-3 font-semibold text-sidebar-foreground"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            Z
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-sm">ZUVA Scholar</span>
            <span className="text-xs text-sidebar-foreground/60">
              Coaching Hub
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.url);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.url} />}
                    >
                      <Icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between w-full">
          <SignOutButton />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
