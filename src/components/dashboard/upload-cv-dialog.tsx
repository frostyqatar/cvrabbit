"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  ChevronDown,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { createEmptyData } from "@/lib/cv/defaults";
import { extractCvFile, validateCvFile } from "@/lib/cv/extract";
import { parseCvText, type ParseResult } from "@/lib/cv/parse";
import type { CvRecord } from "@/lib/cv/types";
import { createCv, finalizeCv, updateExtractionStatus } from "@/lib/supabase/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatFileSize, truncate } from "@/lib/utils";

type Step = "choose" | "working" | "review" | "error";

function baseTitle(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) || "Imported CV"
  );
}

function confidenceLabel(confidence: number) {
  if (confidence >= 75) return { label: "Strong match", tone: "success" as const };
  if (confidence >= 45) return { label: "Partial match", tone: "warning" as const };
  return { label: "Needs review", tone: "destructive" as const };
}

export function UploadCvDialog({
  open,
  onOpenChange,
  userId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated?: (cv: CvRecord) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [cvId, setCvId] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [rawText, setRawText] = useState("");

  const reset = useCallback(() => {
    setStep("choose");
    setFile(null);
    setMessage("");
    setProgress(0);
    setError("");
    setCvId(null);
    setParsed(null);
    setPageCount(0);
    setConfirming(false);
    setRawText("");
    setDragging(false);
  }, []);

  const handleOpen = (next: boolean) => {
    if (!next && (step === "working" || confirming)) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const processFile = async (selected: File) => {
    const validation = validateCvFile(selected);
    if (!validation.ok) {
      setFile(null);
      setError(validation.message);
      setStep("error");
      return;
    }

    setFile(selected);
    setStep("working");
    setError("");
    setMessage("Preparing your file…");
    setProgress(8);

    const supabase = getSupabaseBrowserClient();
    const id = crypto.randomUUID();
    const extension = validation.kind === "pdf" ? "pdf" : "docx";
    const path = `${userId}/${id}/original.${extension}`;
    const contentType =
      validation.kind === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    try {
      const { error: uploadError } = await supabase.storage
        .from("cv-originals")
        .upload(path, selected, { contentType, upsert: false });

      if (uploadError) {
        throw new Error(
          uploadError.message.includes("Bucket not found")
            ? "The private CV storage bucket is missing. Apply the CVRabbit migration first."
            : `The file could not be uploaded: ${uploadError.message}`,
        );
      }

      setCvId(id);
      setProgress(22);
      setMessage("Setting up your private CV record…");

      await createCv(supabase, userId, {
        id,
        title: baseTitle(selected.name),
        data: createEmptyData(),
        sourceFilePath: path,
        sourceFileName: selected.name,
        sourceFileType: contentType,
        sourceFileSize: selected.size,
        extractionStatus: "processing",
      });

      setProgress(34);
      const extraction = await extractCvFile(selected, (nextMessage) => {
        setMessage(nextMessage);
        setProgress((current) => Math.max(current, 45));
      });

      setRawText(extraction.text);
      setPageCount(extraction.pageCount);

      if (!extraction.text || extraction.text.replace(/\s/g, "").length < 40) {
        await updateExtractionStatus(supabase, userId, id, "failed");
        setError(
          "We couldn't find enough readable text in this file. Your original has been kept privately, so you can enter the details manually.",
        );
        setStep("error");
        return;
      }

      setProgress(78);
      setMessage("Organising the text into sections…");
      const result = parseCvText(extraction.text);

      if (extraction.warnings.length > 0) {
        result.warnings = [...extraction.warnings, ...result.warnings];
      }

      setParsed(result);
      setProgress(100);
      setStep("review");
    } catch (caught) {
      const messageText =
        caught instanceof Error ? caught.message : "Something went wrong while reading the file.";
      setError(messageText);
      setStep("error");

      if (cvId || id) {
        try {
          await updateExtractionStatus(supabase, userId, id, "failed");
        } catch {
          // The record may not exist if creation failed.
        }
      }
    }
  };

  const finish = async (useExtracted: boolean) => {
    if (!cvId || !parsed) return;
    setConfirming(true);
    const supabase = getSupabaseBrowserClient();

    const data = useExtracted ? parsed.data : createEmptyData();
    const title = useExtracted && data.personal.fullName.trim()
      ? data.personal.fullName.trim().slice(0, 100)
      : baseTitle(file?.name ?? "Imported CV");
    const status = useExtracted
      ? parsed.confidence >= 65 && parsed.warnings.length === 0
        ? "complete"
        : "partial"
      : "partial";

    try {
      const record = await finalizeCv(supabase, userId, cvId, {
        title,
        data,
        settings: {
          templateId: "classic",
          accent: "#1c3738",
          font: "lato",
          density: "comfortable",
          sectionOrder: ["summary", "experience", "education", "skills", "additional"],
          sectionVisibility: {
            summary: true,
            experience: true,
            education: true,
            skills: true,
            additional: true,
          },
        },
        extractionStatus: status,
      });

      toast.success(
        useExtracted ? "CV imported — review the details" : "CV created — add your details",
      );
      onCreated?.(record);
      reset();
      onOpenChange(false);
      router.push(`/cv/${record.id}`);
      router.refresh();
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "We could not save the imported CV.",
      );
    } finally {
      setConfirming(false);
    }
  };

  const busy = step === "working" || confirming;
  const tone = parsed ? confidenceLabel(parsed.confidence) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        showCloseButton={!busy}
        className={cn(
          "p-0",
          step === "review" ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <DialogHeader>
            <DialogTitle>
              {step === "review" ? "Here's what we found." : "Bring your existing CV"}
            </DialogTitle>
            <DialogDescription>
              {step === "review"
                ? "Nothing has been invented or rewritten. Check the details, then continue to the editor."
                : "PDF or DOCX, up to 15 MB. Reading happens on your device; the original is stored privately."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          {step === "choose" ? (
            <div className="space-y-4">
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  event.target.value = "";
                  if (selected) void processFile(selected);
                }}
              />

              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const selected = event.dataTransfer.files?.[0];
                  if (selected) void processFile(selected);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-9 text-center transition-[border-color,background-color,transform] duration-200 ease-out",
                  dragging
                    ? "scale-[1.01] border-steel bg-steel/10"
                    : "border-onyx/15 bg-mint/50 hover:border-steel hover:bg-steel/5",
                )}
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-white text-jet shadow-soft">
                  <UploadCloud className="size-5" strokeWidth={1.8} />
                </span>
                <p className="mt-3 text-sm font-semibold text-onyx">
                  Drop your CV here, or choose a file
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  On mobile, this opens your files app.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                  <span className="rounded-full border border-onyx/10 bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-charcoal">
                    PDF
                  </span>
                  <span className="rounded-full border border-onyx/10 bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-charcoal">
                    DOCX
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg bg-mint/70 px-3 py-2.5 text-[0.72rem] leading-relaxed text-charcoal">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-steel" />
                Stored in a private bucket. There is no public link to your original file.
              </div>

              {error ? (
                <div className="flex gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  {error}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "working" ? (
            <div className="py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
                  <Loader2 className="size-5 animate-spin text-jet" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-onyx">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file ? formatFileSize(file.size) : ""} · please keep this tab open
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Progress value={progress} className="h-1.5" />
                <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
                  <span>{message}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-[0.72rem] text-charcoal/70">
                <p className="flex items-center gap-2">
                  <Check className={cn("size-3.5", progress > 20 ? "text-success" : "text-border")} />
                  Uploading to private storage
                </p>
                <p className="flex items-center gap-2">
                  <Check className={cn("size-3.5", progress > 45 ? "text-success" : "text-border")} />
                  Reading text on this device
                </p>
                <p className="flex items-center gap-2">
                  <Check className={cn("size-3.5", progress > 80 ? "text-success" : "text-border")} />
                  Organising sections
                </p>
              </div>
            </div>
          ) : null}

          {step === "review" && parsed ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold",
                    tone?.tone === "success" && "bg-success/10 text-success",
                    tone?.tone === "warning" && "bg-warning/10 text-warning",
                    tone?.tone === "destructive" && "bg-destructive/10 text-destructive",
                  )}
                >
                  <BadgeCheck className="size-3.5" />
                  {tone?.label} · {parsed.confidence}%
                </span>
                {pageCount > 0 ? (
                  <span className="text-[0.68rem] text-muted-foreground">
                    {pageCount} {pageCount === 1 ? "page" : "pages"} read
                  </span>
                ) : null}
              </div>

              <div className="rounded-xl border border-onyx/10 bg-mint/50 p-4">
                <p className="font-serif text-xl tracking-[-0.01em] text-onyx">
                  {parsed.data.personal.fullName || "Name not detected"}
                </p>
                <p className="mt-0.5 text-xs text-charcoal">
                  {parsed.data.personal.professionalTitle || "No professional title detected"}
                </p>
                <p className="mt-2 text-[0.72rem] text-muted-foreground">
                  {[parsed.data.personal.email, parsed.data.personal.phone, parsed.data.personal.location]
                    .filter(Boolean)
                    .join(" · ") || "No contact details detected"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { icon: Briefcase, label: "Roles", value: parsed.detected.experience },
                  { icon: GraduationCap, label: "Education", value: parsed.detected.education },
                  { icon: Wrench, label: "Skill groups", value: parsed.detected.skills },
                  { icon: BadgeCheck, label: "Extra sections", value: parsed.detected.additional },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-onyx/10 bg-white px-3 py-2.5"
                  >
                    <item.icon className="size-3.5 text-steel" />
                    <p className="mt-1.5 text-lg leading-none font-semibold text-onyx">
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              {parsed.warnings.length > 0 ? (
                <div className="space-y-1.5 rounded-xl border border-warning/25 bg-warning/[0.06] p-3">
                  <p className="text-[0.7rem] font-bold tracking-[0.08em] text-warning uppercase">
                    Worth checking
                  </p>
                  {parsed.warnings.map((warning) => (
                    <p key={warning} className="flex gap-2 text-[0.72rem] leading-relaxed text-charcoal">
                      <AlertCircle className="mt-0.5 size-3 shrink-0 text-warning" />
                      {warning}
                    </p>
                  ))}
                </div>
              ) : null}

              {rawText ? (
                <details className="group rounded-xl border border-onyx/10 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold text-charcoal">
                    View the text we read
                    <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="max-h-44 overflow-y-auto border-t border-onyx/8 px-3.5 py-3">
                    <pre className="font-mono text-[0.65rem] leading-relaxed whitespace-pre-wrap text-charcoal/80">
                      {truncate(rawText, 6000)}
                    </pre>
                  </div>
                </details>
              ) : null}

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={() => void finish(false)}
                  disabled={confirming}
                  className="text-charcoal"
                >
                  Start with empty sections
                </Button>
                <Button onClick={() => void finish(true)} disabled={confirming} className="gap-2">
                  {confirming ? <Loader2 className="size-4 animate-spin" /> : null}
                  Review in editor
                  <ArrowRight className="size-4" />
                </Button>
              </div>
              <p className="text-center text-[0.66rem] text-muted-foreground">
                You can correct every field after this step.
              </p>
            </div>
          ) : null}

          {step === "error" ? (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">We hit a problem</p>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal">{error}</p>
                </div>
              </div>

              {cvId ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Your uploaded file has been kept privately. You can open the CV and enter the
                  sections manually without uploading again.
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    reset();
                    inputRef.current?.click();
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="size-4" />
                  Try another file
                </Button>
                {cvId ? (
                  <Button
                    onClick={() => {
                      const id = cvId;
                      reset();
                      onOpenChange(false);
                      router.push(`/cv/${id}`);
                      router.refresh();
                    }}
                    className="gap-2"
                  >
                    <FileText className="size-4" />
                    Open and enter manually
                  </Button>
                ) : (
                  <Button onClick={() => reset()}>Choose a file</Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
