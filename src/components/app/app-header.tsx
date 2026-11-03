"use client";

import Link from "next/link";
import { LogOut, Plus, ShieldCheck, UserRound } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";

export function AppHeader({
  email,
  name,
  avatarUrl,
  className,
  showNewCv = true,
}: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
  showNewCv?: boolean;
}) {
  const displayName = name?.trim() || email.split("@")[0] || "Account";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-onyx/[0.07] bg-mint/90 backdrop-blur-xl",
        className,
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/dashboard" aria-label="CVRabbit dashboard" className="shrink-0">
          <Logo markClassName="size-8 sm:size-9" wordmarkClassName="text-base sm:text-[1.05rem]" />
        </Link>

        <div className="flex items-center gap-1.5">
          {showNewCv ? (
            <Button asChild variant="ghost" size="sm" className="hidden h-9 px-3 sm:inline-flex">
              <Link href="/dashboard?new=1">
                <Plus className="size-3.5" />
                New CV
              </Link>
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-onyx/10 bg-white/70 py-1 pr-2 pl-1 transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                aria-label="Account menu"
              >
                <span className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-jet text-[0.65rem] font-bold text-mint">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    initials(displayName)
                  )}
                </span>
                <span className="hidden max-w-[10rem] truncate text-xs font-semibold text-onyx sm:block">
                  {displayName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <span className="flex items-center gap-2.5 py-1">
                  <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-charcoal">
                    <UserRound className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.8rem] font-semibold text-onyx">
                      {displayName}
                    </span>
                    <span className="block truncate text-[0.7rem] text-muted-foreground">{email}</span>
                  </span>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <ShieldCheck className="size-4 text-steel" />
                  Your CVs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="relative flex w-full cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-hidden select-none hover:bg-secondary focus:bg-secondary"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
