"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronsUpDown } from "lucide-react";

import { useSession, signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UserDropdownProps {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  showDetails?: boolean;
}

export function UserDropdown({
  align = "end",
  side = "bottom",
  showDetails = true,
}: UserDropdownProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const user = session?.user;
  const initials = getInitials(user?.name);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg p-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer group">
        <Avatar className="size-8">
          {user?.image ? (
            <AvatarImage src={user.image} alt={user.name || "User avatar"} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        {showDetails && (
          <div className="flex flex-col text-left leading-tight hidden sm:flex">
            <span className="font-medium text-xs text-foreground truncate max-w-[120px]">
              {user?.name || "User"}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {user?.role || "Account"}
            </span>
          </div>
        )}
        <ChevronsUpDown className="size-3.5 text-muted-foreground ml-auto group-hover:text-foreground transition-colors" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} side={side} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user?.email || ""}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <Link
                href="/profile"
                className="flex items-center w-full cursor-pointer"
              />
            }
          >
            <User className="mr-2 size-4 text-muted-foreground" />
            <span>Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleSignOut}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
