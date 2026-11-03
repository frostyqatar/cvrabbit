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
  Sparkles,
  UploadCloud,
  Wand2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { AiImportSetup } from "@/components/dashboard/ai-import-setup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  AiRequestError,
  clearStoredAiKey,
  loadStoredAiKey,
  requestAiExtraction,
  storeAiKey,
  type AiUsage,
} from "@/lib/ai/client";
import {
  AI_PROVIDERS,
  DEFAULT_AI_PROVIDER,
  defaultModelFor,
  getAiProvider,
  looksLikeApiKey,
  type AiProviderId,
} from "@/lib/ai/providers";
import { createEmptyData } from "@/lib/cv/defaults";
import { extractCvFile, validateCvFile } from "@/lib/cv/extract";
import { normalizeData } from "@/lib/cv/normalize";
import { parseCvText, type ParseResult } from "@/lib/cv/parse";
import type { CvData, CvRecord } from "@/lib/cv/types";
import { createCv, finalizeCv, updateExtractionStatus } from "@/lib/supabase/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatFileSize, truncate } from "@/lib/utils";

type Step = "choose" | "ai" | "working" | "review" | "error";
type ImportMode = "local" | "ai";

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

function buildParseResult(data: CvData, warnings: string[], confidence: number): ParseResult {
  return {
    data,
    warnings,
    confidence,
    detected: {
      name: Boolean(data.personal.fullName.trim()),
      title: Boolean(data.personal.professionalTitle.trim()),
      summary: Boolean(data.personal.summary.trim()),
      experience: data.experience.length,
      education: data.education.length,
      skills: data.skills.length,
      additional: data.additional.length,
    },
  };
}

function hasUsableContent(data: CvData) {
  return Boolean(
    data.personal.fullName.trim() ||
      data.personal.summary.trim() ||
      data.personal.email.trim() ||
      data.experience.length ||
      data.education.length ||
      data.skills.length ||
      data.additional.length,
  );
}

function formatTokens(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return "";
  return value.toLocaleString("en");
}

function readStoredAiSetup() {
  const stored = loadStoredAiKey();
  const provider = getAiProvider(stored?.provider);
  const model = provider?.models.find((option) => option.id === stored?.model);
  return {
    provider: provider?.id ?? DEFAULT_AI_PROVIDER,
    model: model?.id ?? provider?.models[0]?.id ?? defaultModelFor(DEFAULT_AI_PROVIDER),
    apiKey: stored?.apiKey ?? "",
  };
}

export function UploadCvDialog({
  open,
  onOpenChange,
  userId,
  onCreated,
  initialMode = "upload",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated?: (cv: CvRecord) => void;
  initialMode?: "upload" | "ai";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<ImportMode>(initialMode === "ai" ? "ai" : "local");
  const [initialAi] = useState(readStoredAiSetup);
  const [step, setStep] = useState<Step>(initialMode === "ai" ? "ai" : "choose");
  const [mode, setMode] = useState<ImportMode>(initialMode === "ai" ? "ai" : "local");
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
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);

  const [aiProvider, setAiProvider] = useState<AiProviderId>(initialAi.provider);
  const [aiModel, setAiModel] = useState(initialAi.model);
  const [apiKey, setApiKey] = useState(initialAi.apiKey);
  const [rememberKey, setRememberKey] = useState(true);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const [aiMeta, setAiMeta] = useState<{
    providerName: string;
    modelLabel: string;
    truncated: boolean;
  } | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiAttempts, setAiAttempts] = useState(0);
  const [aiRetryable, setAiRetryable] = useState(true);

  const reset = useCallback(() => {
    setStep("choose");
    setMode("local");
    modeRef.current = "local";
    setFile(null);
    setMessage("");
    setProgress(0);
    setError("");
    setCvId(null);
    setParsed(null);
    setPageCount(0);
    setConfirming(false);
    setRawText("");
    setExtractionWarnings([]);
    setAiUsage(null);
    setAiMeta(null);
    setAiError("");
    setAiAttempts(0);
    setAiRetryable(true);
    setDragging(false);
  }, []);

  const handleOpen = (next: boolean) => {
    if (!next && (step === "working" || confirming)) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleProviderChange = (next: AiProviderId) => {
    setAiProvider(next);
    setAiModel(defaultModelFor(next));
  };

  const rememberKeyForTab = () => {
    if (rememberKey) {
      storeAiKey({ provider: aiProvider, model: aiModel, apiKey: apiKey.trim() });
    } else {
      clearStoredAiKey();
    }
  };

  const openPicker = (nextMode: ImportMode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
    inputRef.current?.click();
  };

  const applyExtractionFallback = () => {
    if (!rawText) return;
    const result = parseCvText(rawText);
    if (extractionWarnings.length > 0) {
      result.warnings = [...extractionWarnings, ...result.warnings];
    }
    setParsed(result);
    setAiMeta(null);
    setAiUsage(null);
    setAiError("");
    setProgress(100);
    setStep("review");
  };

  const runAi = async (text: string, recordId: string, warnings: string[]) => {
    const provider = getAiProvider(aiProvider) ?? AI_PROVIDERS[0];
    const model = provider.models.find((option) => option.id === aiModel) ?? provider.models[0];

    setStep("working");
    setAiError("");
    setProgress(72);
    setMessage(`Asking ${provider.name} to organise and rewrite your CV…`);

    try {
      const response = await requestAiExtraction({
        provider: provider.id,
        model: model.id,
        apiKey: apiKey.trim(),
        text,
      });

      const data = normalizeData(response.data);
      if (!hasUsableContent(data)) {
        throw new AiRequestError(
          `${provider.name} could not find structured CV content. Try local reading instead.`,
          "no_content",
          false,
        );
      }

      const nextWarnings = [...warnings];
      if (response.truncated) {
        nextWarnings.push(
          "This CV was longer than the AI input limit, so the final part was not sent. Check the last sections carefully.",
        );
      }
      if (response.outputTruncated) {
        nextWarnings.push(
          "The model reached its output limit, so the last section may be incomplete. Check the end of your experience and additional sections.",
        );
      }
      nextWarnings.push(
        "AI-polished wording: confirm names, dates, numbers and job titles against your original.",
      );

      setParsed(
        buildParseResult(
          data,
          nextWarnings,
          98,
        ),
      );
      setAiUsage(response.usage);
      setAiMeta({
        providerName: provider.name,
        modelLabel: model.label,
        truncated: response.truncated,
      });
      setProgress(100);
      setStep("review");
      rememberKeyForTab();
    } catch (caught) {
      const requestError =
        caught instanceof AiRequestError
          ? caught
          : new AiRequestError(
              caught instanceof Error
                ? caught.message
                : `${provider.name} could not process this CV.`,
              "unknown",
              true,
            );

      setAiError(requestError.message);
      setAiRetryable(requestError.retryable);
      setStep("error");
      await updateExtractionStatus(
        getSupabaseBrowserClient(),
        userId,
        recordId,
        "partial",
      ).catch(() => undefined);
    }
  };

  const processFile = async (selected: File, modeOverride?: ImportMode) => {
    const useAi = (modeOverride ?? modeRef.current) === "ai";

    if (useAi && !looksLikeApiKey(aiProvider, apiKey)) {
      setStep("ai");
      setError("Add a valid API key for the provider you chose.");
      return;
    }

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
    setMessage(useAi ? "Preparing your private copy…" : "Preparing your file…");
    setProgress(8);
    setAiError("");
    setAiMeta(null);
    setAiUsage(null);
    setAiAttempts(0);

    const supabase = getSupabaseBrowserClient();
    const id = crypto.randomUUID();
    const extension = validation.kind === "pdf" ? "pdf" : "docx";
    const path = `${userId}/${id}/original.${extension}`;
    const contentType =
      validation.kind === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    let created = false;

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

      created = true;
      setCvId(id);
      setProgress(34);
      const extraction = await extractCvFile(selected, (nextMessage) => {
        setMessage(nextMessage);
        setProgress((current) => Math.max(current, 45));
      });

      setRawText(extraction.text);
      setPageCount(extraction.pageCount);
      setExtractionWarnings(extraction.warnings);

      if (!extraction.text || extraction.text.replace(/\s/g, "").length < 40) {
        await updateExtractionStatus(supabase, userId, id, "failed");
        setError(
          "We couldn't find enough readable text in this file. Your original has been kept privately, so you can enter the details manually.",
        );
        setStep("error");
        return;
      }

      if (useAi) {
        setAiAttempts(1);
        await runAi(extraction.text, id, extraction.warnings);
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

      if (created) {
        try {
          await updateExtractionStatus(supabase, userId, id, "failed");
        } catch {
          // The record still exists; the editor can be used manually.
        }
      } else {
        try {
          await supabase.storage.from("cv-originals").remove([path]);
        } catch {
          // Best-effort cleanup for an upload that never became a CV record.
        }
      }
    }
  };

  const retryAi = async () => {
    if (!rawText || !cvId) return;
    if (aiAttempts >= 2) return;
    setAiAttempts((current) => current + 1);
    await runAi(rawText, cvId, extractionWarnings);
  };

  const finish = async (useExtracted: boolean) => {
    if (!cvId || !parsed) return;
    setConfirming(true);
    const supabase = getSupabaseBrowserClient();

    const data = useExtracted ? parsed.data : createEmptyData();
    const title =
      useExtracted && data.personal.fullName.trim()
        ? data.personal.fullName.trim().slice(0, 100)
        : baseTitle(file?.name ?? "Imported CV");
    const status = useExtracted
      ? aiMeta || (parsed.confidence >= 65 && parsed.warnings.length === 0)
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
        useExtracted
          ? aiMeta
            ? "AI import ready — check every detail"
            : "CV imported — review the details"
          : "CV created — add your details",
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
  const activeProvider = getAiProvider(aiProvider) ?? AI_PROVIDERS[0];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        showCloseButton={!busy}
        className={cn(
          "max-h-[92vh] overflow-y-auto p-0",
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
              {step === "review"
                ? "Here's what we found."
                : step === "ai"
                  ? "AI-assisted import"
                  : "Bring your existing CV"}
            </DialogTitle>
            <DialogDescription>
              {step === "review"
                ? aiMeta
                  ? "Your facts are unchanged — only the wording was polished. Check the details, then continue."
                  : "Nothing has been invented or rewritten. Check the details, then continue to the editor."
                : step === "ai"
                  ? "Choose a provider and model, then add your own API key. Only the extracted text is sent."
                  : "Read a PDF or DOCX on your device, or let an AI model organise and rewrite it for you."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              event.target.value = "";
              if (selected) void processFile(selected, modeRef.current);
            }}
          />

          {step === "choose" ? (
            <div className="space-y-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  openPicker("local");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPicker("local");
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
                  setMode("local");
                  modeRef.current = "local";
                  const selected = event.dataTransfer.files?.[0];
                  if (selected) void processFile(selected, "local");
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-8 text-center transition-[border-color,background-color,transform] duration-200 ease-out",
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
                  Read on this device · PDF or DOCX · up to 15 MB
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-onyx/10" />
                <span className="text-[0.62rem] font-bold tracking-[0.16em] text-charcoal/50 uppercase">
                  or
                </span>
                <span className="h-px flex-1 bg-onyx/10" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode("ai");
                  setStep("ai");
                }}
                className="group flex w-full items-start gap-3 rounded-xl border border-jet/20 bg-jet p-4 text-left text-mint transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.995]"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-mint/15">
                  <Wand2 className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    Let AI do the work
                    <Sparkles className="size-3.5 text-mint/70" />
                  </span>
                  <span className="mt-0.5 block text-[0.72rem] leading-relaxed text-mint/70">
                    Your own OpenAI, Claude, DeepSeek or Gemini key. We rewrite the wording and
                    structure it into every field, then you review everything.
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1">
                    {AI_PROVIDERS.map((provider) => (
                      <span
                        key={provider.id}
                        className="rounded-full border border-mint/15 bg-mint/10 px-2 py-0.5 text-[0.6rem] font-semibold text-mint/80"
                      >
                        {provider.shortName}
                      </span>
                    ))}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-mint/60 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              <div className="flex items-start gap-2.5 rounded-lg bg-mint/70 px-3 py-2.5 text-[0.72rem] leading-relaxed text-charcoal">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-steel" />
                Originals stay in a private bucket with no public link. AI keys are never stored on
                our servers.
              </div>

              {error ? (
                <div className="flex gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  {error}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "ai" ? (
            <AiImportSetup
              provider={aiProvider}
              model={aiModel}
              apiKey={apiKey}
              remember={rememberKey}
              onProviderChange={handleProviderChange}
              onModelChange={setAiModel}
              onApiKeyChange={setApiKey}
              onRememberChange={setRememberKey}
              onBack={() => {
                setMode("local");
                setError("");
                setStep("choose");
              }}
              onStart={() => {
                setError("");
                openPicker("ai");
              }}
            />
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
                <div className="flex items-center justify-between gap-3 text-[0.7rem] text-muted-foreground">
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
                {mode === "ai" ? (
                  <p className="flex items-center gap-2">
                    <Sparkles
                      className={cn("size-3.5", progress >= 72 ? "text-jet" : "text-border")}
                    />
                    Rewriting with {activeProvider.name} · one request
                  </p>
                ) : (
                  <p className="flex items-center gap-2">
                    <Check
                      className={cn("size-3.5", progress > 80 ? "text-success" : "text-border")}
                    />
                    Organising sections
                  </p>
                )}
              </div>
              {mode === "ai" ? (
                <p className="mt-4 rounded-lg bg-mint/60 px-3 py-2 text-[0.68rem] leading-relaxed text-charcoal/75">
                  A dense CV can take up to a minute. We make a single request and never retry
                  automatically, so you stay in control of token use.
                </p>
              ) : null}
            </div>
          ) : null}

          {step === "review" && parsed ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {aiMeta ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-jet px-2.5 py-1 text-[0.68rem] font-bold text-mint">
                    <Sparkles className="size-3.5" />
                    AI organised
                  </span>
                ) : (
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
                )}
                {aiMeta ? (
                  <span className="text-[0.68rem] text-muted-foreground">
                    {aiMeta.providerName} · {aiMeta.modelLabel}
                  </span>
                ) : null}
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

              {aiMeta && (aiUsage?.inputTokens || aiUsage?.outputTokens) ? (
                <p className="text-[0.66rem] text-muted-foreground">
                  One request used
                  {aiUsage?.inputTokens
                    ? ` ${formatTokens(aiUsage.inputTokens)} input`
                    : ""}
                  {aiUsage?.inputTokens && aiUsage?.outputTokens ? " and" : ""}
                  {aiUsage?.outputTokens
                    ? ` ${formatTokens(aiUsage.outputTokens)} output`
                    : ""}{" "}
                  tokens on your {aiMeta.providerName} account.
                </p>
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
                {aiMeta
                  ? "Facts are unchanged. Correct anything that looks off after this step."
                  : "You can correct every field after this step."}
              </p>
            </div>
          ) : null}

          {step === "error" ? (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    {aiError ? "The AI step did not finish" : "We hit a problem"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal">
                    {aiError || error}
                  </p>
                </div>
              </div>

              {aiError && cvId && rawText ? (
                <div className="rounded-xl border border-onyx/10 bg-mint/50 p-3.5">
                  <p className="text-[0.72rem] leading-relaxed text-charcoal">
                    Your file is still here and nothing was saved from the AI response. You can use
                    the local reader for free, or spend one more AI request.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button onClick={applyExtractionFallback} className="flex-1 gap-2">
                      <FileText className="size-4" />
                      Use local reading instead
                    </Button>
                    {aiRetryable && aiAttempts < 2 ? (
                      <Button
                        variant="outline"
                        onClick={() => void retryAi()}
                        className="flex-1 gap-2"
                      >
                        <RefreshCw className="size-4" />
                        Try AI once more
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[0.64rem] text-muted-foreground">
                    {aiAttempts >= 2
                      ? "You have used both AI attempts for this CV. Local reading is still available."
                      : "Each AI attempt is one billable request on your own key."}
                  </p>
                </div>
              ) : null}

              {error && cvId ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Your uploaded file has been kept privately. You can open the CV and enter the
                  sections manually without uploading again.
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    const retryMode = modeRef.current;
                    reset();
                    openPicker(retryMode);
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
