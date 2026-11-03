import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3.5 py-2 text-[0.95rem] text-foreground shadow-[inset_0_1px_0_rgba(0,15,8,0.03)] transition-[border-color,box-shadow] duration-150 ease-out",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-steel focus-visible:ring-[3px] focus-visible:ring-steel/25 focus-visible:outline-none",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
