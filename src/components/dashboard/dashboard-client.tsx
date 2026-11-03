"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { TemplateThumb } from "@/components/templates/template-thumb";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCv, deleteCv, duplicateCv, getCv, renameCv } from "@/lib/supabase/data";
import type { CvRecord, CvSummary } from "@/lib/cv/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";

import { UploadCvDialog } from "./upload-cv-dialog";

interface DashboardClientProps {
  userId: string;
  initialCvs: CvSummary[];
  autoNew?: boolean;
}

export function DashboardClient({ userId, initialCvs, autoNew = false }: DashboardClientProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [cvs, setCvs] = useState<CvSummary[]>(initialCvs);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"upload" | "ai">("upload");
  const [uploadSession, setUploadSession] = useState(0);
  const [creating, setCreating] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CvSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CvSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const autoCreated = useRef(false);

  const createNew = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const cv = await createCv(supabase, userId, { title: "Untitled CV" });
      router.push(`/cv/${cv.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create a new CV.");
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!autoNew || autoCreated.current) return;
    autoCreated.current = true;
    router.replace("/dashboard");
    void createNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNew]);

  const openUpload = (nextMode: "upload" | "ai") => {
    setUploadMode(nextMode);
    setUploadSession((current) => current + 1);
    setUploadOpen(true);
  };

  const handleCreated = (record: CvRecord) => {
    setCvs((current) => [
      {
        id: record.id,
        title: record.title,
        data: record.data,
        settings: record.settings,
        source_file_name: record.source_file_name,
        created_at: record.created_at,
        updated_at: record.updated_at,
      },
      ...current,
    ]);
  };

  const openRename = (cv: CvSummary) => {
    setRenameTarget(cv);
    setRenameValue(cv.title);
  };

  const saveRename = async () => {
    if (!renameTarget) return;
    const title = renameValue.trim();
    if (!title) {
      toast.error("Give the CV a name first.");
      return;
    }
    setRenaming(true);
    try {
      await renameCv(supabase, userId, renameTarget.id, title);
      setCvs((current) =>
        current.map((cv) => (cv.id === renameTarget.id ? { ...cv, title } : cv)),
      );
      setRenameTarget(null);
      toast.success("CV renamed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not rename this CV.");
    } finally {
      setRenaming(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const target = deleteTarget;
    const snapshot = cvs;
    setCvs((current) => current.filter((cv) => cv.id !== target.id));

    try {
      const full = await getCv(supabase, userId, target.id);
      await deleteCv(supabase, userId, {
        id: target.id,
        source_file_path: full?.source_file_path ?? null,
      });
      setDeleteTarget(null);
      toast.success("CV and original file deleted");
    } catch (error) {
      setCvs(snapshot);
      toast.error(error instanceof Error ? error.message : "Could not delete this CV.");
    } finally {
      setDeleting(false);
    }
  };

  const duplicate = async (cv: CvSummary) => {
    try {
      const full = await getCv(supabase, userId, cv.id);
      if (!full) throw new Error("This CV could not be found.");
      const copy = await duplicateCv(supabase, userId, full);
      handleCreated(copy);
      toast.success("CV duplicated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not duplicate this CV.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[0.7rem] font-bold tracking-[0.2em] text-steel uppercase">
            Your workspace
          </p>
          <h1 className="mt-2 font-serif text-[2.5rem] leading-none tracking-[-0.02em] text-onyx sm:text-[3rem]">
            Your CVs
          </h1>
          <p className="mt-2 text-sm text-charcoal">
            {cvs.length === 0
              ? "Start with the CV you already have, let AI polish it, or begin with a clean page."
              : `${cvs.length} ${cvs.length === 1 ? "CV" : "CVs"}, each private to your account.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => openUpload("upload")}
            className="gap-2"
          >
            <Upload className="size-4" />
            Upload CV
          </Button>
          <Button
            variant="outline"
            onClick={() => openUpload("ai")}
            className="gap-2 border-jet/30 bg-jet text-mint hover:bg-jet/90 hover:text-mint"
          >
            <Sparkles className="size-4" />
            AI import
          </Button>
          <Button onClick={() => void createNew()} disabled={creating} className="gap-2">
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            New CV
          </Button>
        </div>
      </div>

      {cvs.length === 0 ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => openUpload("upload")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openUpload("upload");
              }
            }}
            className="group flex min-h-[19rem] cursor-pointer flex-col items-start justify-between rounded-2xl border border-dashed border-onyx/15 bg-white/60 p-6 text-left transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-steel hover:bg-white sm:p-7"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-jet text-mint shadow-soft">
              <Upload className="size-5" />
            </div>
            <div className="mt-8">
              <h2 className="font-serif text-[1.6rem] leading-tight tracking-[-0.01em] text-onyx">
                Bring your existing CV
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-charcoal">
                Drop in a PDF or DOCX. We read it on your device and organise the text into
                sections without inventing anything.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-jet">
                Choose a file
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => openUpload("ai")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openUpload("ai");
              }
            }}
            className="group relative flex min-h-[19rem] cursor-pointer flex-col items-start justify-between overflow-hidden rounded-2xl border border-jet/30 bg-jet p-6 text-left text-mint shadow-soft transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift sm:p-7"
          >
            <span className="pointer-events-none absolute -top-16 -right-12 size-44 rounded-full bg-steel/15 blur-2xl" />
            <div className="relative flex w-full items-start justify-between gap-2">
              <div className="flex size-11 items-center justify-center rounded-xl bg-mint/15 text-mint">
                <Wand2 className="size-5" />
              </div>
              <span className="rounded-full border border-mint/20 bg-mint/10 px-2.5 py-1 text-[0.58rem] font-bold tracking-[0.12em] text-mint/85 uppercase">
                Optional
              </span>
            </div>
            <div className="relative mt-8">
              <h2 className="flex items-center gap-1.5 font-serif text-[1.6rem] leading-tight tracking-[-0.01em]">
                Let AI do the work
                <Sparkles className="size-4 text-mint/70" />
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-mint/70">
                Use your own OpenAI, Claude, DeepSeek or Gemini key. We rewrite the wording and
                fill every field, then you review it line by line.
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {["OpenAI", "Claude", "DeepSeek", "Gemini"].map((provider) => (
                  <span
                    key={provider}
                    className="rounded-full border border-mint/15 bg-mint/10 px-2 py-0.5 text-[0.6rem] font-semibold text-mint/75"
                  >
                    {provider}
                  </span>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-mint">
                Choose a provider
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>

          <div className="flex min-h-[19rem] flex-col justify-between rounded-2xl border border-onyx/10 bg-white p-6 shadow-soft sm:p-7">
            <div>
              <span className="flex size-10 items-center justify-center rounded-xl border border-onyx/10 bg-mint text-jet">
                <Pencil className="size-4" />
              </span>
              <h2 className="mt-5 font-serif text-[1.6rem] leading-tight tracking-[-0.01em] text-onyx">
                Or start from scratch
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-charcoal">
                A blank, structured CV. Add only what is relevant — empty fields never appear
                in the generated document.
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-6 w-full"
              onClick={() => void createNew()}
              disabled={creating}
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create a blank CV
            </Button>
          </div>

          <div className="rounded-2xl border border-onyx/10 bg-mint/50 p-5 lg:col-span-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.72rem] text-charcoal">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-steel" />
                Private storage bucket
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="size-3.5 text-steel" />
                PDF and DOCX up to 15 MB
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-success" strokeWidth={2.5} />
                AI keys are never stored on our servers
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-onyx/10 bg-white shadow-soft transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift"
            >
              <Link href={`/cv/${cv.id}`} className="block p-3 pb-0">
                <div className="relative overflow-hidden rounded-xl bg-mint/70 p-3">
                  <div className="mx-auto max-w-[10.5rem] transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                    <TemplateThumb
                      template={cv.settings.templateId}
                      accent={cv.settings.accent}
                      name={cv.data.personal.fullName || "Your Name"}
                      role={cv.data.personal.professionalTitle || "Professional Title"}
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="outline"
                      className="border-white/60 bg-white/90 text-[0.58rem] text-charcoal backdrop-blur"
                    >
                      {cv.settings.templateId === "ats" ? "ATS" : cv.settings.templateId}
                    </Badge>
                  </div>
                </div>
              </Link>

              <div className="flex flex-1 items-start justify-between gap-2 p-4 pt-3.5">
                <div className="min-w-0">
                  <Link
                    href={`/cv/${cv.id}`}
                    className="block truncate text-sm font-semibold tracking-[-0.01em] text-onyx hover:underline"
                  >
                    {cv.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {cv.data.personal.professionalTitle ||
                      truncate(cv.data.personal.email, 28) ||
                      "No title yet"}
                  </p>
                  <p className="mt-2 text-[0.65rem] text-charcoal/55">
                    Edited {formatRelativeTime(cv.updated_at)}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${cv.title}`}
                      className="shrink-0 text-charcoal"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/cv/${cv.id}`}>
                        <FileText className="size-4" />
                        Open editor
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openRename(cv)}>
                      <Pencil className="size-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void duplicate(cv)}>
                      <Copy className="size-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(cv)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => openUpload("upload")}
            className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-onyx/15 bg-white/40 p-6 text-center transition-colors duration-150 hover:border-steel hover:bg-white/70"
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-onyx/10 bg-white text-jet">
              <Plus className="size-4" />
            </span>
            <span className="text-sm font-semibold text-onyx">Add another CV</span>
            <span className="max-w-[11rem] text-xs text-muted-foreground">
              Upload a different version or start a new one.
            </span>
          </button>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-2 rounded-xl border border-onyx/8 bg-white/50 px-4 py-3 text-[0.7rem] text-charcoal/65 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-steel" />
          Your CVs and originals are visible only to your account.
        </span>
        <span className={cn("inline-flex items-center gap-1.5", creating && "text-jet")}>
          {creating ? "Creating a new CV…" : "Changes save automatically in the editor."}
        </span>
      </div>

      <UploadCvDialog
        key={`${uploadMode}-${uploadSession}`}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        userId={userId}
        onCreated={handleCreated}
        initialMode={uploadMode}
      />

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename this CV</DialogTitle>
            <DialogDescription>
              A clear name makes it easier to find the right version later.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveRename();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="cv-title">CV name</Label>
              <Input
                id="cv-title"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                maxLength={120}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renaming}>
                {renaming ? <Loader2 className="size-4 animate-spin" /> : null}
                Save name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this CV?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-onyx">{deleteTarget?.title}</span> and its
              original uploaded file will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
