"use client";

import { useState } from "react";
import { FileDown, FlaskConical, RotateCcw } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { GenerateCvDialog } from "@/components/editor/generate-dialog";
import { TemplateThumb } from "@/components/templates/template-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MINIMAL_SAMPLE_DATA, SAMPLE_DATA, SAMPLE_SETTINGS } from "@/lib/cv/sample";
import { TEMPLATES } from "@/lib/cv/templates";
import {
  EditorProvider,
  useEditor,
  useEditorStoreApi,
} from "@/lib/editor/store";

function LabInner() {
  const [open, setOpen] = useState(false);
  const [sample, setSample] = useState<"full" | "minimal">("full");
  const data = useEditor((state) => state.data);
  const settings = useEditor((state) => state.settings);
  const setSettings = useEditor((state) => state.setSettings);
  const setData = useEditor((state) => state.setData);
  const store = useEditorStoreApi();

  const swapSample = (next: "full" | "minimal") => {
    setSample(next);
    setData(next === "full" ? SAMPLE_DATA : MINIMAL_SAMPLE_DATA, SAMPLE_SETTINGS);
  };

  return (
    <div className="min-h-dvh bg-mint">
      <header className="border-b border-onyx/8">
        <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-3">
            <Logo markClassName="size-8" wordmarkClassName="text-base" />
            <Badge variant="outline" className="hidden gap-1 sm:inline-flex">
              <FlaskConical className="size-3" />
              Design lab
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => swapSample(sample === "full" ? "minimal" : "full")}
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">
                {sample === "full" ? "Minimal sample" : "Full sample"}
              </span>
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <FileDown className="size-3.5" />
              <span className="hidden sm:inline">Preview PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container-page py-8 sm:py-12">
        <p className="text-[0.7rem] font-bold tracking-[0.2em] text-steel uppercase">
          Internal QA
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-[-0.02em] text-onyx">
          Template & PDF testing
        </h1>
        <p className="mt-2 max-w-xl text-sm text-charcoal">
          Fictional data only. This route is disabled in production. Select a template, open
          the generate panel, and check pagination, type, and download fidelity.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {TEMPLATES.map((template) => {
            const selected = settings.templateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setSettings({ templateId: template.id });
                  setOpen(true);
                }}
                className={`rounded-xl border p-1.5 text-left transition-colors ${
                  selected ? "border-jet bg-white" : "border-onyx/10 hover:bg-white/70"
                }`}
              >
                <div className="overflow-hidden rounded-md border border-onyx/8">
                  <TemplateThumb
                    template={template.id}
                    accent={settings.accent}
                    name={data.personal.fullName || "Your Name"}
                    role={data.personal.professionalTitle || "Title"}
                  />
                </div>
                <p className="mt-1.5 px-0.5 text-[0.7rem] font-semibold text-onyx">
                  {template.shortName}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-onyx/10 bg-white p-5">
          <p className="text-xs font-semibold text-onyx">Store snapshot</p>
          <p className="mt-1 text-[0.72rem] text-muted-foreground">
            {data.experience.length} roles · {data.education.length} education ·{" "}
            {data.skills.length} skill groups · {data.additional.length} additional sections
          </p>
          <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-mint/60 p-3 text-[0.65rem] text-charcoal">
            {JSON.stringify({ settings, store: Boolean(store) }, null, 2)}
          </pre>
        </div>
      </main>

      <GenerateCvDialog open={open} onOpenChange={setOpen} saveStatus="saved" />
    </div>
  );
}

export function DesignLab() {
  return (
    <EditorProvider
      initial={{ title: "Design lab", data: SAMPLE_DATA, settings: SAMPLE_SETTINGS }}
    >
      <LabInner />
    </EditorProvider>
  );
}
