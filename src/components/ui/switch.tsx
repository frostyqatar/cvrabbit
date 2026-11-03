"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent transition-colors duration-150 outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-steel/30",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4.5 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out",
          "data-[state=checked]:translate-x-[1.15rem] data-[state=unchecked]:translate-x-[0.15rem]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
