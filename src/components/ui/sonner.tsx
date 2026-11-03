"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      offset={16}
      gap={10}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-border/80 !bg-card !text-foreground !shadow-lift !font-sans",
          title: "!text-sm !font-semibold",
          description: "!text-xs !text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground !rounded-lg",
          cancelButton: "!bg-secondary !text-secondary-foreground !rounded-lg",
          success: "!border-success/25",
          error: "!border-destructive/25",
        },
      }}
    />
  );
}
