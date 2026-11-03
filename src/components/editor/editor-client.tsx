"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CloudOff,
  FileDown,
  GraduationCap,
  Layers,
  Loader2,
  RotateCw,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CvRecord } from "@/lib/cv/types";
import { EditorProvider, useEditor, useEditorStoreApi } from "@/lib/editor/store";
import { useAutosave } from "@/lib/editor/use-autosave";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { AdditionalSection } from "./additional-section";
import { EducationSection } from "./education-section";
import { ExperienceSection } from "./experience-section";
import { GenerateCvDialog } from "./generate-dialog";
import { PersonalSection } from "./personal-section";
import { SaveStatus } from "./editor-ui";
import { SkillsSection } from "./skills-section";

const SECTIONS = [
  { id: "personal", label: "Personal", icon: UserRound },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "additional", label: "Additional", icon: Layers },
] as const;

function EditorInner({ cv, userId }: { cv: CvRecord; userId: string }) {
  const router = useRouter();
  const store = useEditorStoreApi();
  const supabase = getSupabaseBrowserClient();
  const title = useEditor((state) => state.title);
  const setTitle = useEditor((state) => state.setTitle);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const scrollFrame = useRef<number | null>(null);

  const autosave = useAutosave({ store, supabase, userId, cv });

  useEffect(() => {
    const handleScroll = () => {
      if (scrollFrame.current) return;
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = null;
        const offset = window.innerWidth < 768 ? 148 : 158;
        let current = SECTIONS[0].id as string;
        for (const section of SECTIONS) {
          const element = document.getElementById(section.id);
          if (element && element.getBoundingClientRect().top <= offset) {
            current = section.id;
          }
        }
        setActiveSection(current);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollFrame.current) cancelAnimationFrame(scrollFrame.current);
    };
  }, []);

  const scrollToSection = useCallback((id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goBack = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await autosave.flush();
    } catch {
      // The local draft still protects the changes.
    }
    router.push("/dashboard");
  };

  const showSaveWarning = autosave.status === "error" || autosave.status === "offline";

  return (
    <div className="min-h-dvh bg-mint">
      <div className="sticky top-0 z-40 border-b border-onyx/[0.07] bg-mint/92 backdrop-blur-xl">
        <header className="container-page flex h-14 items-center gap-2 sm:h-16">
          <button
            type="button"
            onClick={() => void goBack()}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-charcoal transition-colors hover:bg-white/70 hover:text-onyx active:scale-[0.98]"
            aria-label="Back to all CVs"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">All CVs</span>
          </button>

          <div className="min-w-0 flex-1 border-l border-onyx/10 pl-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-label="CV name"
              maxLength={120}
              className="h-7 w-full max-w-[26rem] border-transparent bg-transparent px-1 text-[0.92rem] font-semibold tracking-[-0.015em] shadow-none hover:border-onyx/10 focus-visible:border-steel focus-visible:bg-card sm:text-base"
            />
            <div className="mt-0.5 pl-1">
              <span className="hidden sm:inline">
                <SaveStatus
                  status={autosave.status}
                  lastSavedAt={autosave.lastSavedAt}
                  errorMessage={autosave.errorMessage}
                  onRetry={autosave.retry}
                />
              </span>
              <span className="sm:hidden">
                <SaveStatus
                  compact
                  status={autosave.status}
                  lastSavedAt={autosave.lastSavedAt}
                  errorMessage={autosave.errorMessage}
                  onRetry={autosave.retry}
                />
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setGenerateOpen(true)}
            className="hidden h-9 shrink-0 gap-1.5 px-3.5 sm:inline-flex"
          >
            <FileDown className="size-3.5" />
            Generate CV
          </Button>
          <Button
            type="button"
            size="icon"
            onClick={() => setGenerateOpen(true)}
            className="size-9 shrink-0 sm:hidden"
            aria-label="Generate CV"
          >
            <FileDown className="size-4" />
          </Button>
        </header>

        <nav
          aria-label="CV sections"
          className="border-t border-onyx/[0.05] bg-mint/80"
        >
          <div className="container-page">
            <div className="hide-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto py-1.5">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold whitespace-nowrap transition-[background-color,color] duration-150",
                      active
                        ? "bg-jet text-mint shadow-[0_1px_2px_rgba(0,15,8,0.18)]"
                        : "text-charcoal/70 hover:bg-white/70 hover:text-onyx",
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.9} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {autosave.recoveredDraft ? (
        <div className="border-b border-warning/20 bg-warning/[0.08]">
          <div className="container-page flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <p className="text-[0.78rem] font-semibold text-onyx">
                  Unsaved changes found on this device
                </p>
                <p className="text-[0.68rem] text-charcoal/70">
                  From{" "}
                  {new Date(autosave.recoveredDraft.savedAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  . Restore them, or discard the local backup.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-6 sm:pl-0">
              <Button variant="ghost" size="sm" onClick={autosave.discardDraft}>
                Discard
              </Button>
              <Button size="sm" onClick={autosave.restoreDraft}>
                Restore changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showSaveWarning ? (
        <div
          className={cn(
            "border-b",
            autosave.status === "offline"
              ? "border-warning/20 bg-warning/[0.07]"
              : "border-destructive/20 bg-destructive/[0.05]",
          )}
        >
          <div className="container-page flex flex-col justify-between gap-2 py-2.5 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-[0.74rem] text-charcoal">
              {autosave.status === "offline" ? (
                <CloudOff className="size-3.5 text-warning" />
              ) : (
                <AlertTriangle className="size-3.5 text-destructive" />
              )}
              {autosave.status === "offline"
                ? "You're offline. Your changes are kept on this device and will save when the connection returns."
                : "We couldn't save to the server. Your changes are kept on this device and we'll keep trying."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={autosave.retry}
              className="h-8 w-fit gap-1.5"
            >
              <RotateCw className="size-3" />
              Retry now
            </Button>
          </div>
        </div>
      ) : null}

      <main className="container-page max-w-[940px] py-7 pb-32 sm:py-10 md:pb-16">
        <div className="space-y-10 sm:space-y-12">
          <PersonalSection />
          <ExperienceSection />
          <EducationSection />
          <SkillsSection />
          <AdditionalSection />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-onyx/10 bg-white/70 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-mint text-jet">
              <FileDown className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-onyx">Ready to see it finished?</p>
              <p className="mt-0.5 text-[0.76rem] text-charcoal/70">
                Preview each design with this exact content, then download an A4 PDF.
              </p>
            </div>
          </div>
          <Button onClick={() => setGenerateOpen(true)} className="w-full gap-1.5 sm:w-auto">
            <FileDown className="size-4" />
            Generate CV
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[0.66rem] text-charcoal/45">
          <ShieldCheck className="size-3.5" />
          Private to your account · changes save automatically
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-onyx/10 bg-mint/95 px-4 pt-2.5 backdrop-blur-xl safe-bottom md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <SaveStatus
              status={autosave.status}
              lastSavedAt={autosave.lastSavedAt}
              errorMessage={autosave.errorMessage}
              onRetry={autosave.retry}
              compact
            />
          </div>
          <Button onClick={() => setGenerateOpen(true)} className="h-10 shrink-0 gap-1.5 px-4">
            <FileDown className="size-4" />
            Generate CV
          </Button>
        </div>
      </div>

      <GenerateCvDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        saveStatus={autosave.status}
      />

      {leaving ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-mint/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-medium text-charcoal shadow-soft">
            <Loader2 className="size-3.5 animate-spin" />
            Finishing your save…
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EditorClient({ cv, userId }: { cv: CvRecord; userId: string }) {
  return (
    <EditorProvider initial={{ title: cv.title, data: cv.data, settings: cv.settings }}>
      <EditorInner cv={cv} userId={userId} />
    </EditorProvider>
  );
}
