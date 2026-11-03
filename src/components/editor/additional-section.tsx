"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgeCheck,
  ChevronDown,
  FolderKanban,
  HeartHandshake,
  Languages,
  Layers,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ADDITIONAL_KIND_LABELS, type AdditionalKind, type AdditionalSection as Section } from "@/lib/cv/types";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

import { EmptyHint, Field, ItemMenu, SectionCard } from "./editor-ui";

const KIND_ICONS: Record<AdditionalKind, LucideIcon> = {
  certifications: BadgeCheck,
  projects: FolderKanban,
  languages: Languages,
  awards: Trophy,
  volunteering: HeartHandshake,
  memberships: Award,
  custom: Layers,
};

const KIND_ORDER: AdditionalKind[] = [
  "certifications",
  "projects",
  "languages",
  "awards",
  "volunteering",
  "memberships",
  "custom",
];

const FIELD_LABELS: Record<
  AdditionalKind,
  { title: string; subtitle: string; text: string; link: string }
> = {
  certifications: {
    title: "Certification",
    subtitle: "Issuer or year",
    text: "Details (optional)",
    link: "Verification link (optional)",
  },
  projects: {
    title: "Project",
    subtitle: "Role or year",
    text: "Description (optional)",
    link: "Project link (optional)",
  },
  languages: {
    title: "Language",
    subtitle: "Proficiency",
    text: "Note (optional)",
    link: "",
  },
  awards: {
    title: "Award",
    subtitle: "Issuer or year",
    text: "Details (optional)",
    link: "Link (optional)",
  },
  volunteering: {
    title: "Role",
    subtitle: "Organisation or dates",
    text: "Description (optional)",
    link: "Link (optional)",
  },
  memberships: {
    title: "Membership",
    subtitle: "Organisation or year",
    text: "Details (optional)",
    link: "Link (optional)",
  },
  custom: {
    title: "Title",
    subtitle: "Subtitle (optional)",
    text: "Description (optional)",
    link: "Link (optional)",
  },
};

interface DeleteTarget {
  type: "section" | "item";
  sectionId: string;
  itemId?: string;
  label: string;
}

function AdditionalCard({
  section,
  index,
  total,
  open,
  onToggle,
  onDelete,
  onDeleteItem,
}: {
  section: Section;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDeleteItem: (itemId: string, label: string) => void;
}) {
  const updateSection = useEditor((state) => state.updateAdditionalSection);
  const moveSection = useEditor((state) => state.moveAdditionalSection);
  const addItem = useEditor((state) => state.addAdditionalItem);
  const moveItem = useEditor((state) => state.moveAdditionalItem);
  const updateItem = useEditor((state) => state.updateAdditionalItem);
  const Icon = KIND_ICONS[section.kind];
  const labels = FIELD_LABELS[section.kind];

  const handleAddItem = () => {
    addItem(section.id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>(
          `[data-item-section="${section.id}"]`,
        );
        inputs[inputs.length - 1]?.focus();
      });
    });
  };

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow] duration-150",
        open ? "border-onyx/15 shadow-[0_8px_24px_-20px_rgba(0,15,8,0.35)]" : "border-onyx/10",
      )}
    >
      <div className="flex items-start gap-2 p-3 sm:p-4">
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-mint text-jet">
          <Icon className="size-3.5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <Input
            id={`additional-title-${section.id}`}
            value={section.title}
            onChange={(event) => updateSection(section.id, { title: event.target.value })}
            placeholder="Section title"
            maxLength={80}
            aria-label="Section title"
            className="h-9 border-transparent bg-transparent px-2 text-[0.9rem] font-semibold shadow-none hover:border-onyx/10 focus-visible:border-steel focus-visible:bg-card"
          />
          <div className="mt-1 flex flex-wrap items-center gap-2 pl-2">
            <span className="text-[0.66rem] text-muted-foreground">
              {ADDITIONAL_KIND_LABELS[section.kind]} · {section.items.length}{" "}
              {section.items.length === 1 ? "entry" : "entries"}
            </span>
            {!section.include ? (
              <Badge variant="outline" className="px-1.5 py-0 text-[0.56rem]">
                Hidden from CV
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <ItemMenu
            onMoveUp={() => moveSection(section.id, -1)}
            onMoveDown={() => moveSection(section.id, 1)}
            onDelete={onDelete}
            canMoveUp={index > 0}
            canMoveDown={index < total - 1}
            deleteLabel="Delete section"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label={open ? "Collapse section" : "Expand section"}
            aria-expanded={open}
            className="text-charcoal/70"
          >
            <ChevronDown
              className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {open ? (
        <div className="animate-fade space-y-3 border-t border-onyx/8 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-4 rounded-lg bg-mint/45 px-3 py-2">
            <div>
              <Label htmlFor={`include-add-${section.id}`} className="text-[0.76rem] text-onyx">
                Show this section in the CV
              </Label>
              <p className="text-[0.64rem] text-muted-foreground">
                Turn it off to keep the information for later.
              </p>
            </div>
            <Switch
              id={`include-add-${section.id}`}
              checked={section.include}
              onCheckedChange={(checked) => updateSection(section.id, { include: checked })}
            />
          </div>

          <div className="space-y-2.5">
            {section.items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-onyx/10 px-3 py-3 text-center text-[0.72rem] text-charcoal/60">
                No entries yet.
              </p>
            ) : null}

            {section.items.map((item, itemIndex) => (
              <div key={item.id} className="rounded-lg border border-onyx/8 bg-mint/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[0.64rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    Entry {itemIndex + 1}
                  </span>
                  <div className="flex items-center">
                    <ItemMenu
                      onMoveUp={() => moveItem(section.id, item.id, -1)}
                      onMoveDown={() => moveItem(section.id, item.id, 1)}
                      onDelete={() => onDeleteItem(item.id, item.title.trim() || "this entry")}
                      canMoveUp={itemIndex > 0}
                      canMoveDown={itemIndex < section.items.length - 1}
                      deleteLabel="Delete entry"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={labels.title}>
                    <Input
                      data-item-section={section.id}
                      value={item.title}
                      onChange={(event) =>
                        updateItem(section.id, item.id, { title: event.target.value })
                      }
                      placeholder={labels.title}
                      maxLength={140}
                      className="h-10 bg-card"
                    />
                  </Field>
                  <Field label={labels.subtitle}>
                    <Input
                      value={item.subtitle}
                      onChange={(event) =>
                        updateItem(section.id, item.id, { subtitle: event.target.value })
                      }
                      placeholder={labels.subtitle}
                      maxLength={160}
                      className="h-10 bg-card"
                    />
                  </Field>
                  {item.link || labels.link ? (
                    <Field label={labels.link || "Link (optional)"} className="sm:col-span-2">
                      <Input
                        value={item.link}
                        onChange={(event) =>
                          updateItem(section.id, item.id, { link: event.target.value })
                        }
                        placeholder="https://"
                        inputMode="url"
                        maxLength={300}
                        className="h-10 bg-card"
                      />
                    </Field>
                  ) : null}
                  <Field label={labels.text} className="sm:col-span-2">
                    <Textarea
                      value={item.text}
                      onChange={(event) =>
                        updateItem(section.id, item.id, { text: event.target.value })
                      }
                      placeholder={labels.text}
                      rows={2}
                      maxLength={800}
                      className="min-h-[4rem] bg-card"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="text-charcoal/75">
            <Plus className="size-3.5" />
            Add entry
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function AdditionalSection() {
  const additional = useEditor((state) => state.data.additional);
  const addAdditionalSection = useEditor((state) => state.addAdditionalSection);
  const removeAdditionalSection = useEditor((state) => state.removeAdditionalSection);
  const removeAdditionalItem = useEditor((state) => state.removeAdditionalItem);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const addSection = (kind: AdditionalKind) => {
    const id = addAdditionalSection(kind);
    setOpen((current) => new Set(current).add(id));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>(`#additional-title-${id}`);
        input?.focus();
      });
    });
  };

  const toggleOpen = (id: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <SectionCard
        id="additional"
        index="05"
        title="Additional information"
        description="Certifications, languages, projects, or anything else worth including. Add only the sections this application needs."
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="size-3.5" />
                Add section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {KIND_ORDER.map((kind) => {
                const Icon = KIND_ICONS[kind];
                return (
                  <DropdownMenuItem key={kind} onClick={() => addSection(kind)}>
                    <Icon className="size-4 text-steel" />
                    {ADDITIONAL_KIND_LABELS[kind]}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {additional.length === 0 ? (
          <div className="space-y-4">
            <EmptyHint>
              Nothing added yet. Optional sections only appear in the generated CV when you add
              them and leave them switched on.
            </EmptyHint>
            <div className="flex flex-wrap gap-2">
              {(["certifications", "projects", "languages", "awards"] as AdditionalKind[]).map(
                (kind) => {
                  const Icon = KIND_ICONS[kind];
                  return (
                    <Button
                      key={kind}
                      variant="secondary"
                      size="sm"
                      onClick={() => addSection(kind)}
                      className="gap-1.5"
                    >
                      <Icon className="size-3.5" />
                      {ADDITIONAL_KIND_LABELS[kind]}
                    </Button>
                  );
                },
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {additional.map((section, index) => (
              <AdditionalCard
                key={section.id}
                section={section}
                index={index}
                total={additional.length}
                open={open.has(section.id)}
                onToggle={() => toggleOpen(section.id)}
                onDelete={() =>
                  setDeleteTarget({
                    type: "section",
                    sectionId: section.id,
                    label: section.title.trim() || "this section",
                  })
                }
                onDeleteItem={(itemId, label) =>
                  setDeleteTarget({
                    type: "item",
                    sectionId: section.id,
                    itemId,
                    label,
                  })
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(openState) => !openState && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === "section" ? "this section" : "this entry"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-onyx">{deleteTarget?.label}</span> will be
              removed from this CV
              {deleteTarget?.type === "section" ? " along with every entry inside it." : "."} This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "section") {
                  removeAdditionalSection(deleteTarget.sectionId);
                } else if (deleteTarget.itemId) {
                  removeAdditionalItem(deleteTarget.sectionId, deleteTarget.itemId);
                }
                setDeleteTarget(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
