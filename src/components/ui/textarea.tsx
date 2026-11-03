import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[96px] w-full resize-y rounded-xl border border-input bg-card px-3.5 py-3 text-[0.95rem] leading-relaxed text-foreground shadow-[inset_0_1px_0_rgba(0,15,8,0.03)] transition-[border-color,box-shadow] duration-150 ease-out",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-steel focus-visible:ring-[3px] focus-visible:ring-steel/25 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
