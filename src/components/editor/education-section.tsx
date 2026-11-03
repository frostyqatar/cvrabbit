"use client";

import { useState } from "react";
import { ChevronDown, GraduationCap, Plus, Trash2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateRange } from "@/lib/cv/format";
import type { EducationEntry } from "@/lib/cv/types";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

import { EmptyHint, Field, ItemMenu, SectionCard } from "./editor-ui";

function EducationCard({
  entry,
  index,
  total,
  open,
  onToggle,
  onDelete,
}: {
  entry: EducationEntry;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const updateEducation = useEditor((state) => state.updateEducation);
  const moveEducation = useEditor((state) => state.moveEducation);
  const dateLabel = formatDateRange(entry.startDate, entry.endDate, entry.current);
  const qualification = [entry.degree.trim(), entry.field.trim()].filter(Boolean).join(" · ");

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow] duration-150",
        open ? "border-onyx/15 shadow-[0_8px_24px_-20px_rgba(0,15,8,0.4)]" : "border-onyx/10",
      )}
    >
      <div className="flex items-start gap-1.5 p-3 sm:p-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-lg px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-mint text-jet">
            <GraduationCap className="size-3.5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.88rem] font-semibold tracking-[-0.01em] text-onyx">
              {entry.institution.trim() || "Institution not added"}
            </span>
            <span className="mt-0.5 block truncate text-[0.72rem] text-charcoal/75">
              {qualification || "Add degree and field of study"}
            </span>
            {dateLabel ? (
              <span className="mt-1 block text-[0.65rem] text-muted-foreground">{dateLabel}</span>
            ) : null}
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          <ItemMenu
            onMoveUp={() => moveEducation(entry.id, -1)}
            onMoveDown={() => moveEducation(entry.id, 1)}
            onDelete={onDelete}
            canMoveUp={index > 0}
            canMoveDown={index < total - 1}
            deleteLabel="Delete education"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label={open ? "Collapse education" : "Expand education"}
            className="text-charcoal/70"
          >
            <ChevronDown
              className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {open ? (
        <div className="animate-fade space-y-4 border-t border-onyx/8 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Institution" htmlFor={`institution-${entry.id}`} className="sm:col-span-2">
              <Input
                id={`institution-${entry.id}`}
                value={entry.institution}
                onChange={(event) =>
                  updateEducation(entry.id, { institution: event.target.value })
                }
                placeholder="University of Edinburgh"
                maxLength={140}
              />
            </Field>
            <Field label="Degree or qualification" htmlFor={`degree-${entry.id}`}>
              <Input
                id={`degree-${entry.id}`}
                value={entry.degree}
                onChange={(event) => updateEducation(entry.id, { degree: event.target.value })}
                placeholder="MSc"
                maxLength={120}
              />
            </Field>
            <Field label="Field of study" htmlFor={`field-${entry.id}`}>
              <Input
                id={`field-${entry.id}`}
                value={entry.field}
                onChange={(event) => updateEducation(entry.id, { field: event.target.value })}
                placeholder="Management"
                maxLength={120}
              />
            </Field>
            <Field label="Location" htmlFor={`edu-location-${entry.id}`} optional>
              <Input
                id={`edu-location-${entry.id}`}
                value={entry.location}
                onChange={(event) => updateEducation(entry.id, { location: event.target.value })}
                placeholder="Edinburgh, UK"
                maxLength={120}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date" htmlFor={`edu-start-${entry.id}`}>
                <Input
                  id={`edu-start-${entry.id}`}
                  value={entry.startDate}
                  onChange={(event) =>
                    updateEducation(entry.id, { startDate: event.target.value })
                  }
                  placeholder="Sep 2015"
                  maxLength={40}
                />
              </Field>
              <Field label="End date" htmlFor={`edu-end-${entry.id}`}>
                <Input
                  id={`edu-end-${entry.id}`}
                  value={entry.current ? "" : entry.endDate}
                  onChange={(event) =>
                    updateEducation(entry.id, { endDate: event.target.value })
                  }
                  placeholder={entry.current ? "Present" : "Aug 2016"}
                  disabled={entry.current}
                  maxLength={40}
                  className={cn(entry.current && "bg-mint/60 text-muted-foreground")}
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-mint/45 px-3.5 py-3">
            <Label htmlFor={`edu-current-${entry.id}`} className="text-[0.8rem] text-onyx">
              Currently studying here
            </Label>
            <Switch
              id={`edu-current-${entry.id}`}
              checked={entry.current}
              onCheckedChange={(checked) =>
                updateEducation(entry.id, {
                  current: checked,
                  ...(checked ? { endDate: "" } : {}),
                })
              }
            />
          </div>

          <Field
            label="Description or achievements"
            htmlFor={`edu-description-${entry.id}`}
            optional
            hint={`${entry.description.length}/600`}
          >
            <Textarea
              id={`edu-description-${entry.id}`}
              value={entry.description}
              onChange={(event) =>
                updateEducation(entry.id, { description: event.target.value.slice(0, 600) })
              }
              placeholder="Distinction. Dissertation on decision-making in early-stage product teams."
              rows={3}
              className="min-h-[5.5rem]"
            />
          </Field>
        </div>
      ) : null}
    </article>
  );
}

export function EducationSection() {
  const education = useEditor((state) => state.data.education);
  const addEducation = useEditor((state) => state.addEducation);
  const removeEducation = useEditor((state) => state.removeEducation);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteTarget = education.find((entry) => entry.id === deleteId);

  const handleAdd = () => {
    const id = addEducation();
    setOpenId(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`institution-${id}`)?.focus();
      });
    });
  };

  return (
    <>
      <SectionCard
        id="education"
        index="03"
        title="Education"
        description="Degrees, qualifications, and training. Keep the most relevant entries first."
        action={
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="size-3.5" />
            Add education
          </Button>
        }
      >
        {education.length === 0 ? (
          <div className="space-y-3">
            <EmptyHint>
              No education entries yet. Add a degree, diploma, or certification — or leave this
              section out.
            </EmptyHint>
            <Button variant="secondary" size="sm" onClick={handleAdd}>
              <Plus className="size-3.5" />
              Add your first entry
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {education.map((entry, index) => (
              <EducationCard
                key={entry.id}
                entry={entry}
                index={index}
                total={education.length}
                open={openId === entry.id}
                onToggle={() => setOpenId((current) => (current === entry.id ? null : entry.id))}
                onDelete={() => setDeleteId(entry.id)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this education entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.institution.trim() || "This entry"} will be removed from this CV.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) removeEducation(deleteId);
                setDeleteId(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
