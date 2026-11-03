"use client";

import { useState } from "react";
import { Eraser, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEditor } from "@/lib/editor/store";

export function ClearAllFields() {
  const clearAllFields = useEditor((state) => state.clearAllFields);
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const advance = () => {
    setStep(0);
    window.setTimeout(() => setStep(2), 180);
  };

  const clear = () => {
    clearAllFields();
    setStep(0);
    toast.success("All fields cleared", {
      description: "The CV and its uploaded file are still in your workspace.",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setStep(1)}
        className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-charcoal/55 transition-colors hover:text-destructive"
      >
        <Eraser className="size-3" />
        Clear all fields
      </button>

      <AlertDialog open={step === 1} onOpenChange={(open) => !open && setStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all fields?</AlertDialogTitle>
            <AlertDialogDescription>
              This empties every section of this CV: personal details, experience, education,
              skills, and additional information. The CV itself, its design settings, and any
              uploaded original stay in your workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my content</AlertDialogCancel>
            <AlertDialogAction onClick={advance}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={step === 2} onOpenChange={(open) => !open && setStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This cannot be undone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure? Every entered field will be removed. You would need to
              re-enter the information or upload the original CV again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={clear}>
              <Trash2 className="size-4" />
              Yes, clear everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
