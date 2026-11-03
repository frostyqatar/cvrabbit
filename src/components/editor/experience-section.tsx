"use client";

import { useState } from "react";
import { Briefcase, ChevronDown, Plus, Trash2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDateRange } from "@/lib/cv/format";
import type { ExperienceEntry } from "@/lib/cv/types";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

import { BulletEditor } from "./bullet-editor";
import { EmptyHint, Field, ItemMenu, SectionCard } from "./editor-ui";

function ExperienceCard({
  entry,
  index,
  total,
  open,
  onToggle,
  onDelete,
}: {
  entry: ExperienceEntry;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const updateExperience = useEditor((state) => state.updateExperience);
  const moveExperience = useEditor((state) => state.moveExperience);

  const dateLabel = formatDateRange(entry.startDate, entry.endDate, entry.current);
  const roleLabel = entry.jobTitle.trim() || "Untitled position";
  const employerLabel = [entry.employer.trim(), entry.location.trim()].filter(Boolean).join(" · ");
  const bulletCount =
    entry.responsibilities.filter((bullet) => bullet.text.trim()).length +
    entry.achievements.filter((bullet) => bullet.text.trim()).length;

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
            <Briefcase className="size-3.5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.88rem] font-semibold tracking-[-0.01em] text-onyx">
              {roleLabel}
            </span>
            <span className="mt-0.5 block truncate text-[0.72rem] text-charcoal/75">
              {employerLabel || "Add employer and location"}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              {dateLabel ? (
                <span className="text-[0.65rem] text-muted-foreground">{dateLabel}</span>
              ) : null}
              {bulletCount > 0 ? (
                <Badge variant="secondary" className="px-1.5 py-0 text-[0.58rem] font-semibold">
                  {bulletCount} {bulletCount === 1 ? "bullet" : "bullets"}
                </Badge>
              ) : null}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          <ItemMenu
            onMoveUp={() => moveExperience(entry.id, -1)}
            onMoveDown={() => moveExperience(entry.id, 1)}
            onDelete={onDelete}
            canMoveUp={index > 0}
            canMoveDown={index < total - 1}
            deleteLabel="Delete position"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label={open ? "Collapse position" : "Expand position"}
            className="text-charcoal/70"
          >
            <ChevronDown
              className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {open ? (
        <div className="animate-fade space-y-5 border-t border-onyx/8 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title" htmlFor={`job-title-${entry.id}`}>
              <Input
                id={`job-title-${entry.id}`}
                value={entry.jobTitle}
                onChange={(event) =>
                  updateExperience(entry.id, { jobTitle: event.target.value })
                }
                placeholder="Senior Product Manager"
                maxLength={140}
              />
            </Field>
            <Field label="Employer" htmlFor={`employer-${entry.id}`}>
              <Input
                id={`employer-${entry.id}`}
                value={entry.employer}
                onChange={(event) =>
                  updateExperience(entry.id, { employer: event.target.value })
                }
                placeholder="Northwind Financial"
                maxLength={140}
              />
            </Field>
            <Field label="Location" htmlFor={`exp-location-${entry.id}`} optional>
              <Input
                id={`exp-location-${entry.id}`}
                value={entry.location}
                onChange={(event) =>
                  updateExperience(entry.id, { location: event.target.value })
                }
                placeholder="London, UK"
                maxLength={120}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date" htmlFor={`start-${entry.id}`}>
                <Input
                  id={`start-${entry.id}`}
                  value={entry.startDate}
                  onChange={(event) =>
                    updateExperience(entry.id, { startDate: event.target.value })
                  }
                  placeholder="Jan 2021"
                  maxLength={40}
                />
              </Field>
              <Field label="End date" htmlFor={`end-${entry.id}`}>
                <Input
                  id={`end-${entry.id}`}
                  value={entry.current ? "" : entry.endDate}
                  onChange={(event) =>
                    updateExperience(entry.id, { endDate: event.target.value })
                  }
                  placeholder={entry.current ? "Present" : "Mar 2024"}
                  disabled={entry.current}
                  maxLength={40}
                  className={cn(entry.current && "bg-mint/60 text-muted-foreground")}
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-mint/45 px-3.5 py-3">
            <div>
              <Label htmlFor={`current-${entry.id}`} className="text-[0.8rem] text-onyx">
                Currently working here
              </Label>
              <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                The end date will show as “Present”.
              </p>
            </div>
            <Switch
              id={`current-${entry.id}`}
              checked={entry.current}
              onCheckedChange={(checked) =>
                updateExperience(entry.id, {
                  current: checked,
                  ...(checked ? { endDate: "" } : {}),
                })
              }
            />
          </div>

          <div className="space-y-5 border-t border-onyx/8 pt-4">
            <BulletEditor
              experienceId={entry.id}
              kind="responsibilities"
              label="Responsibilities"
              hint="What you owned"
              placeholder="Lead a portfolio of three product squads across onboarding and payments."
            />
            <div className="border-t border-dashed border-onyx/8 pt-4">
              <BulletEditor
                experienceId={entry.id}
                kind="achievements"
                label="Achievements"
                hint="Outcomes and numbers"
                placeholder="Reduced account opening time from 11 minutes to 4, lifting approvals by 18%."
              />
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ExperienceSection() {
  const experience = useEditor((state) => state.data.experience);
  const addExperience = useEditor((state) => state.addExperience);
  const removeExperience = useEditor((state) => state.removeExperience);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteTarget = experience.find((entry) => entry.id === deleteId);

  const handleAdd = () => {
    const id = addExperience();
    setOpenId(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`job-title-${id}`)?.focus();
      });
    });
  };

  return (
    <>
      <SectionCard
        id="experience"
        index="02"
        title="Work experience"
        description="Your roles, responsibilities, and the outcomes you are proud of. Add as many as you need."
        action={
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="size-3.5" />
            Add position
          </Button>
        }
      >
        {experience.length === 0 ? (
          <div className="space-y-3">
            <EmptyHint>
              No positions yet. Add your first role, or leave this section out — empty sections
              are excluded automatically.
            </EmptyHint>
            <Button variant="secondary" size="sm" onClick={handleAdd}>
              <Plus className="size-3.5" />
              Add your first position
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {experience.map((entry, index) => (
              <ExperienceCard
                key={entry.id}
                entry={entry}
                index={index}
                total={experience.length}
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
            <AlertDialogTitle>Delete this position?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.jobTitle.trim() || "This position"} and all of its bullets will be
              removed from this CV. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) removeExperience(deleteId);
                setDeleteId(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete position
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
