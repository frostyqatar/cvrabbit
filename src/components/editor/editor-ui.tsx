"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CloudOff,
  Loader2,
  MoreHorizontal,
  RotateCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "@/lib/editor/use-autosave";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
  optional,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>
          {label}
          {optional ? (
            <span className="font-normal text-muted-foreground/70">optional</span>
          ) : null}
        </Label>
        {hint ? (
          <span className="text-[0.65rem] leading-none text-muted-foreground/70">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function SectionCard({
  id,
  index,
  title,
  description,
  action,
  children,
  className,
}: {
  id: string;
  index: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-[8.5rem]", className)}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="flex gap-3">
          <span className="mt-1 font-serif text-sm text-steel/80">{index}</span>
          <div>
            <h2 className="font-serif text-[1.8rem] leading-none tracking-[-0.02em] text-onyx sm:text-[2rem]">
              {title}
            </h2>
            <p className="mt-1.5 max-w-lg text-[0.82rem] leading-relaxed text-charcoal/75">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0 pl-6 sm:pl-0">{action}</div> : null}
      </div>
      <div className="mt-4 rounded-2xl border border-onyx/[0.09] bg-card p-4 shadow-soft sm:mt-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

export function SaveStatus({
  status,
  lastSavedAt,
  errorMessage,
  onRetry,
  compact = false,
}: {
  status: SaveStatus;
  lastSavedAt: string;
  errorMessage?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium text-charcoal/70">
        <Loader2 className="size-3 animate-spin" />
        {!compact ? "Saving…" : "Saving"}
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-destructive">
        <AlertCircle className="size-3" />
        {!compact ? "Unable to save" : "Error"}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[0.62rem] font-semibold transition-colors hover:bg-destructive/15"
            title={errorMessage}
          >
            <RotateCw className="size-2.5" />
            Retry
          </button>
        ) : null}
      </span>
    );
  }

  if (status === "offline") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-warning">
        <CloudOff className="size-3" />
        {!compact ? "Offline — kept on device" : "Offline"}
      </span>
    );
  }

  const time = new Date(lastSavedAt);
  const timeLabel = Number.isNaN(time.getTime())
    ? ""
    : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium text-charcoal/60"
      title={timeLabel ? `Saved at ${timeLabel}` : "Saved"}
    >
      <Check className="size-3 text-success" strokeWidth={2.8} />
      {!compact ? "Saved" : ""}
    </span>
  );
}

export function ItemMenu({
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  deleteLabel = "Delete",
  extra,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  deleteLabel?: string;
  extra?: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-charcoal/70"
          aria-label="More actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {extra}
        <DropdownMenuItem onClick={onMoveUp} disabled={!canMoveUp}>
          <ArrowUp className="size-4" />
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMoveDown} disabled={!canMoveDown}>
          <ArrowDown className="size-4" />
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-onyx/12 bg-mint/40 px-4 py-5 text-center text-[0.78rem] leading-relaxed text-charcoal/70">
      {children}
    </p>
  );
}
