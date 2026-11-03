"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { TemplateThumb } from "@/components/templates/template-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { displayName, sectionHasContent } from "@/lib/cv/format";
import { TEMPLATES, ACCENT_OPTIONS, FONT_OPTIONS } from "@/lib/cv/templates";
import { RENDER_SECTION_LABELS } from "@/lib/cv/types";
import { useEditor } from "@/lib/editor/store";
import { downloadBlob, generateCvBlob } from "@/lib/pdf/generate";
import { cn, sanitizeFilename } from "@/lib/utils";

type PdfDocumentComponent = ComponentType<{
  file: string;
  onLoadSuccess?: (data: { numPages: number }) => void;
  onLoadError?: (error: Error) => void;
  loading?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}>;

type PdfPageComponent = ComponentType<{
  pageNumber: number;
  width?: number;
  renderTextLayer?: boolean;
  renderAnnotationLayer?: boolean;
  className?: string;
}>;

export function GenerateCvDialog({
  open,
  onOpenChange,
  saveStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveStatus: "saved" | "saving" | "error" | "offline";
}) {
  const title = useEditor((state) => state.title);
  const data = useEditor((state) => state.data);
  const settings = useEditor((state) => state.settings);
  const setSettings = useEditor((state) => state.setSettings);
  const toggleSection = useEditor((state) => state.toggleSection);
  const moveSection = useEditor((state) => state.moveSection);

  const [mobileTab, setMobileTab] = useState<"design" | "preview">("design");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [PdfDocument, setPdfDocument] = useState<PdfDocumentComponent | null>(null);
  const [PdfPage, setPdfPage] = useState<PdfPageComponent | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const [previewNode, setPreviewNode] = useState<HTMLDivElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void import("react-pdf").then((mod) => {
      if (cancelled) return;
      mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.preview.min.mjs";
      setPdfDocument(() => mod.Document as unknown as PdfDocumentComponent);
      setPdfPage(() => mod.Page as unknown as PdfPageComponent);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !previewNode) return;
    const measure = () => setContainerWidth(previewNode.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(previewNode);
    return () => observer.disconnect();
  }, [open, previewNode, mobileTab]);

  useEffect(() => {
    if (!open) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timer = window.setTimeout(() => {
      setGenerating(true);
      void generateCvBlob(data, settings)
        .then((blob) => {
          if (requestIdRef.current !== requestId) return;
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setBlobUrl(url);
          setPdfError("");
          setGenerating(false);
        })
        .catch((error) => {
          if (requestIdRef.current !== requestId) return;
          setPdfError(
            error instanceof Error
              ? error.message
              : "The preview could not be generated. You can still try downloading.",
          );
          setGenerating(false);
        });
    }, 420);

    return () => window.clearTimeout(timer);
  }, [open, data, settings]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const fitWidth = Math.max(230, Math.min(containerWidth - 32, 760));
  const pageWidth = Math.max(210, fitWidth * zoom);

  const filename = useMemo(
    () => `${sanitizeFilename(data.personal.fullName || title || "CV")}-CV.pdf`,
    [data.personal.fullName, title],
  );

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await generateCvBlob(data, settings);
      downloadBlob(blob, filename);
      toast.success("Your PDF is ready");
    } catch (error) {
      toast.error("Could not generate the PDF", {
        description:
          error instanceof Error ? error.message : "Try again, or reduce the amount of content.",
      });
    } finally {
      setDownloading(false);
    }
  }, [data, downloading, filename, settings]);

  const resetDesign = () => {
    setSettings({
      accent: "#1c3738",
      font: "lato",
      density: "comfortable",
    });
    toast.message("Design reset");
  };

  const isAts = settings.templateId === "ats";
  const visibleName = displayName(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:p-0",
          "top-0 left-0 translate-x-0 translate-y-0",
          "md:top-1/2 md:left-1/2 md:h-[92dvh] md:w-[96vw] md:max-w-[1440px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border",
          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
        )}
        onEscapeKeyDown={(event) => {
          if (downloading) event.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">Generate CV</DialogTitle>

        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-onyx/8 px-4 sm:h-16 sm:px-5">
          <div className="min-w-0">
            <p className="truncate font-serif text-lg leading-none tracking-[-0.01em] text-onyx sm:text-xl">
              Generate CV
            </p>
            <p className="mt-1 hidden text-[0.68rem] text-muted-foreground sm:block">
              A4 PDF · preview matches the download
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[0.66rem] text-muted-foreground sm:inline">
              {saveStatus === "saved"
                ? "Using your latest saved edits"
                : saveStatus === "saving"
                  ? "Saving in the background…"
                  : "Unsaved edits are still included"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close generate panel"
              className="rounded-full"
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <Tabs
          value={mobileTab}
          onValueChange={(value) => setMobileTab(value as "design" | "preview")}
          className="shrink-0 gap-0 border-b border-onyx/8 px-3 py-2 md:hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex min-h-0 flex-1">
          <aside
            className={cn(
              "min-h-0 w-full shrink-0 flex-col border-onyx/8 bg-card md:flex md:w-[350px] md:border-r lg:w-[380px]",
              mobileTab === "design" ? "flex" : "hidden",
            )}
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              <div>
                <p className="text-[0.66rem] font-bold tracking-[0.16em] text-charcoal/60 uppercase">
                  Template
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {TEMPLATES.map((template) => {
                    const selected = settings.templateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setSettings({ templateId: template.id })
                        }
                        className={cn(
                          "group relative rounded-xl border p-1.5 text-left transition-[border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.99]",
                          selected
                            ? "border-jet bg-mint/60 shadow-[0_0_0_1px_var(--jet)]"
                            : "border-onyx/10 bg-white hover:border-steel/60 hover:bg-mint/30",
                        )}
                      >
                        <div className="overflow-hidden rounded-md border border-onyx/8">
                          <TemplateThumb
                            template={template.id}
                            accent={settings.accent}
                            name={visibleName}
                            role={data.personal.professionalTitle || "Professional Title"}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
                          <span className="truncate text-[0.7rem] font-semibold text-onyx">
                            {template.shortName}
                          </span>
                          {selected ? (
                            <span className="flex size-4 items-center justify-center rounded-full bg-jet text-mint">
                              <Check className="size-2.5" strokeWidth={3} />
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[0.68rem] leading-relaxed text-muted-foreground">
                  {TEMPLATES.find((template) => template.id === settings.templateId)?.description}
                </p>
              </div>

              <div className="mt-5 border-t border-onyx/8 pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[0.66rem] font-bold tracking-[0.16em] text-charcoal/60 uppercase">
                    Accent colour
                  </p>
                  {isAts ? (
                    <Badge variant="outline" className="px-1.5 py-0 text-[0.56rem]">
                      Not used by ATS
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-2.5 grid grid-cols-4 gap-2">
                  {ACCENT_OPTIONS.map((accent) => {
                    const selected = settings.accent.toLowerCase() === accent.value.toLowerCase();
                    return (
                      <button
                        key={accent.value}
                        type="button"
                        aria-label={accent.name}
                        aria-pressed={selected}
                        onClick={() => setSettings({ accent: accent.value })}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 transition-colors duration-150",
                          selected
                            ? "border-jet bg-mint/60"
                            : "border-transparent hover:bg-mint/40",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full ring-1 ring-black/10",
                            selected && "ring-2 ring-jet ring-offset-2 ring-offset-white",
                          )}
                          style={{ backgroundColor: accent.value }}
                        >
                          {selected ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
                        </span>
                        <span className="text-[0.6rem] text-charcoal/75">{accent.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 border-t border-onyx/8 pt-5">
                <p className="text-[0.66rem] font-bold tracking-[0.16em] text-charcoal/60 uppercase">
                  Typeface
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((font) => {
                    const selected = settings.font === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSettings({ font: font.id })}
                        className={cn(
                          "rounded-xl border px-2 py-2 text-left transition-colors duration-150",
                          selected
                            ? "border-jet bg-mint/60"
                            : "border-onyx/10 bg-white hover:border-steel/60",
                        )}
                      >
                        <span
                          className="block text-lg leading-none text-onyx"
                          style={{ fontFamily: font.stack }}
                        >
                          Aa
                        </span>
                        <span className="mt-1 block text-[0.66rem] font-semibold text-onyx">
                          {font.name}
                        </span>
                        <span className="block text-[0.58rem] text-muted-foreground">
                          {font.note}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 border-t border-onyx/8 pt-5">
                <p className="text-[0.66rem] font-bold tracking-[0.16em] text-charcoal/60 uppercase">
                  Density
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "comfortable", label: "Comfortable", note: "More air" },
                      { value: "compact", label: "Compact", note: "More per page" },
                    ] as const
                  ).map((option) => {
                    const selected = settings.density === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSettings({ density: option.value })}
                        className={cn(
                          "rounded-xl border px-2.5 py-2 text-left transition-colors duration-150",
                          selected
                            ? "border-jet bg-mint/60"
                            : "border-onyx/10 bg-white hover:border-steel/60",
                        )}
                      >
                        <span className="block text-[0.75rem] font-semibold text-onyx">
                          {option.label}
                        </span>
                        <span className="block text-[0.6rem] text-muted-foreground">
                          {option.note}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 border-t border-onyx/8 pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[0.66rem] font-bold tracking-[0.16em] text-charcoal/60 uppercase">
                    Sections
                  </p>
                  <button
                    type="button"
                    onClick={resetDesign}
                    className="inline-flex items-center gap-1 text-[0.62rem] font-medium text-charcoal/60 hover:text-onyx"
                  >
                    <RotateCcw className="size-2.5" />
                    Reset design
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {settings.sectionOrder.map((key, index) => {
                    const visible = settings.sectionVisibility[key];
                    const hasContent = sectionHasContent(data, key);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-mint/30"
                      >
                        <Switch
                          checked={visible}
                          onCheckedChange={() => toggleSection(key)}
                          aria-label={`Show ${RENDER_SECTION_LABELS[key]}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.74rem] font-medium text-onyx">
                            {RENDER_SECTION_LABELS[key]}
                          </p>
                          {!hasContent ? (
                            <p className="text-[0.58rem] text-muted-foreground/70">No content yet</p>
                          ) : null}
                        </div>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => moveSection(key, -1)}
                            disabled={index === 0}
                            aria-label={`Move ${RENDER_SECTION_LABELS[key]} up`}
                            className="size-7 text-charcoal/60"
                          >
                            <ArrowUp className="size-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => moveSection(key, 1)}
                            disabled={index === settings.sectionOrder.length - 1}
                            aria-label={`Move ${RENDER_SECTION_LABELS[key]} down`}
                            className="size-7 text-charcoal/60"
                          >
                            <ArrowDown className="size-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-mint/60 px-3 py-2.5 text-[0.66rem] leading-relaxed text-charcoal/70">
                Empty fields are left out automatically. Nothing is padded, invented, or
                rewritten to fill a page.
              </div>
            </div>

            <div className="hidden shrink-0 border-t border-onyx/8 p-4 md:block">
              <Button
                type="button"
                size="lg"
                className="h-11 w-full"
                onClick={() => void handleDownload()}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {downloading ? "Preparing PDF…" : "Download PDF"}
              </Button>
              <p className="mt-2 text-center text-[0.62rem] text-muted-foreground">
                A4 · selectable text · links preserved
              </p>
            </div>
          </aside>

          <main
            className={cn(
              "min-h-0 min-w-0 flex-1 flex-col bg-[#e8efeb] md:flex",
              mobileTab === "preview" ? "flex" : "hidden",
            )}
          >
            <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-onyx/8 bg-white/60 px-3 backdrop-blur sm:px-4">
              <div className="flex items-center gap-2 text-[0.68rem] text-charcoal/70">
                <span className="font-semibold">A4</span>
                <span className="text-charcoal/30">·</span>
                <span>{numPages > 0 ? `${numPages} ${numPages === 1 ? "page" : "pages"}` : "…"}</span>
                {generating ? (
                  <span className="inline-flex items-center gap-1 text-charcoal/50">
                    <Loader2 className="size-2.5 animate-spin" />
                    Updating
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setZoom((current) => Math.max(0.6, Math.round((current - 0.1) * 10) / 10))}
                  disabled={zoom <= 0.6}
                  aria-label="Zoom out"
                  className="size-7"
                >
                  <Minus className="size-3" />
                </Button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="min-w-9 rounded px-1 text-center text-[0.66rem] font-medium text-charcoal/70 hover:bg-onyx/5"
                  aria-label="Reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setZoom((current) => Math.min(1.6, Math.round((current + 0.1) * 10) / 10))}
                  disabled={zoom >= 1.6}
                  aria-label="Zoom in"
                  className="size-7"
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>

            <div
              ref={setPreviewNode}
              className="min-h-0 flex-1 overflow-auto overscroll-contain px-2 py-4 sm:px-4 sm:py-6"
            >
              {pdfError ? (
                <div className="mx-auto flex max-w-sm flex-col items-center rounded-xl border border-destructive/20 bg-white p-6 text-center">
                  <AlertCircle className="size-5 text-destructive" />
                  <p className="mt-3 text-sm font-semibold text-onyx">Preview unavailable</p>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal/70">{pdfError}</p>
                  <Button className="mt-4" size="sm" onClick={() => void handleDownload()}>
                    <Download className="size-3.5" />
                    Try downloading instead
                  </Button>
                </div>
              ) : !PdfDocument || !PdfPage || !blobUrl ? (
                <div className="mx-auto w-full max-w-[560px] animate-pulse rounded-sm bg-white p-6 shadow-soft">
                  <div className="mx-auto h-6 w-2/3 rounded bg-mint" />
                  <div className="mx-auto mt-3 h-2 w-1/3 rounded bg-mint" />
                  <div className="mx-auto mt-6 h-px w-full bg-mint" />
                  <div className="mt-6 space-y-2">
                    {Array.from({ length: 14 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-2 rounded bg-mint"
                        style={{ width: `${60 + ((index * 13) % 38)}%` }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-fit flex-col items-center gap-4">
                  <PdfDocument
                    file={blobUrl}
                    onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}
                    onLoadError={(error) => setPdfError(error.message)}
                    loading={
                      <div className="flex h-40 items-center justify-center gap-2 text-xs text-charcoal/60">
                        <Loader2 className="size-4 animate-spin" />
                        Rendering preview…
                      </div>
                    }
                  >
                    {Array.from({ length: numPages || 1 }).map((_, index) => (
                      <PdfPage
                        key={index}
                        pageNumber={index + 1}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="overflow-hidden rounded-[2px] bg-white shadow-[0_18px_40px_-24px_rgba(0,15,8,0.45)]"
                      />
                    ))}
                  </PdfDocument>
                  <p className="pb-2 text-[0.62rem] text-charcoal/45">
                    Preview is a rendered PDF · zoom to inspect
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>

        <div className="shrink-0 border-t border-onyx/8 bg-card p-3 safe-bottom md:hidden">
          <Button
            type="button"
            size="lg"
            className="h-11 w-full"
            onClick={() => void handleDownload()}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
