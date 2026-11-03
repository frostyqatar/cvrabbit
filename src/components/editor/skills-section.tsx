"use client";

import { useState } from "react";
import {
  ChevronDown,
  CornerDownRight,
  Plus,
  Sparkle,
  Trash2,
  X,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

import { EmptyHint, ItemMenu, SectionCard } from "./editor-ui";

interface DeleteTarget {
  type: "category" | "skill";
  categoryId: string;
  skillId?: string;
  label: string;
}

export function SkillsSection() {
  const skills = useEditor((state) => state.data.skills);
  const addSkillCategory = useEditor((state) => state.addSkillCategory);
  const updateSkillCategory = useEditor((state) => state.updateSkillCategory);
  const removeSkillCategory = useEditor((state) => state.removeSkillCategory);
  const moveSkillCategory = useEditor((state) => state.moveSkillCategory);
  const addSubSkill = useEditor((state) => state.addSubSkill);
  const updateSubSkill = useEditor((state) => state.updateSubSkill);
  const removeSubSkill = useEditor((state) => state.removeSubSkill);
  const moveSubSkill = useEditor((state) => state.moveSubSkill);
  const addTask = useEditor((state) => state.addTask);
  const updateTask = useEditor((state) => state.updateTask);
  const removeTask = useEditor((state) => state.removeTask);

  const [open, setOpen] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const toggleOpen = (id: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCategory = () => {
    const id = addSkillCategory();
    setOpen((current) => new Set(current).add(id));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`category-name-${id}`)?.focus();
      });
    });
  };

  const addSkill = (categoryId: string) => {
    const id = addSubSkill(categoryId);
    setOpen((current) => new Set(current).add(categoryId));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`skill-name-${id}`)?.focus();
      });
    });
  };

  const addTaskAndFocus = (categoryId: string, skillId: string) => {
    addTask(categoryId, skillId);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>(
          `[data-task-skill="${skillId}"]`,
        );
        inputs[inputs.length - 1]?.focus();
      });
    });
  };

  return (
    <>
      <SectionCard
        id="skills"
        index="04"
        title="Skills"
        description="Group skills into categories, then add the specific skills and tasks that prove them. Show only what is relevant to this CV."
        action={
          <Button variant="outline" size="sm" onClick={addCategory}>
            <Plus className="size-3.5" />
            Add category
          </Button>
        }
      >
        {skills.length === 0 ? (
          <div className="space-y-4">
            <EmptyHint>
              Start with a category such as “Project management”, then add skills beneath it.
              Tasks are optional examples that sit under a skill.
            </EmptyHint>
            <div className="rounded-xl border border-onyx/10 bg-mint/35 p-4 text-[0.74rem] text-charcoal/80">
              <p className="font-semibold text-onyx">Project management</p>
              <ul className="mt-1.5 space-y-1 pl-4">
                <li className="list-disc">Planning</li>
                <li className="list-disc">Scheduling</li>
                <li className="list-disc">Budget management</li>
              </ul>
            </div>
            <Button variant="secondary" size="sm" onClick={addCategory}>
              <Plus className="size-3.5" />
              Add your first category
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {skills.map((category, categoryIndex) => {
              const expanded = open.has(category.id);
              const visibleSkills = category.skills.filter((skill) => skill.name.trim()).length;

              return (
                <article
                  key={category.id}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow] duration-150",
                    expanded
                      ? "border-onyx/15 shadow-[0_8px_24px_-20px_rgba(0,15,8,0.35)]"
                      : "border-onyx/10",
                  )}
                >
                  <div className="flex items-start gap-2 p-3 sm:p-4">
                    <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-mint text-jet">
                      <Sparkle className="size-3.5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Input
                        id={`category-name-${category.id}`}
                        value={category.name}
                        onChange={(event) =>
                          updateSkillCategory(category.id, { name: event.target.value })
                        }
                        placeholder="Category name, e.g. Project management"
                        maxLength={80}
                        aria-label="Skill category name"
                        className="h-9 border-transparent bg-transparent px-2 text-[0.9rem] font-semibold shadow-none hover:border-onyx/10 focus-visible:border-steel focus-visible:bg-card"
                      />
                      <div className="mt-1 flex flex-wrap items-center gap-2 pl-2">
                        <span className="text-[0.66rem] text-muted-foreground">
                          {category.skills.length} {category.skills.length === 1 ? "skill" : "skills"}
                          {visibleSkills !== category.skills.length
                            ? ` · ${category.skills.length - visibleSkills} empty`
                            : ""}
                        </span>
                        {!category.include ? (
                          <Badge variant="outline" className="px-1.5 py-0 text-[0.56rem]">
                            Hidden from CV
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center">
                      <ItemMenu
                        onMoveUp={() => moveSkillCategory(category.id, -1)}
                        onMoveDown={() => moveSkillCategory(category.id, 1)}
                        onDelete={() =>
                          setDeleteTarget({
                            type: "category",
                            categoryId: category.id,
                            label: category.name.trim() || "this category",
                          })
                        }
                        canMoveUp={categoryIndex > 0}
                        canMoveDown={categoryIndex < skills.length - 1}
                        deleteLabel="Delete category"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleOpen(category.id)}
                        aria-label={expanded ? "Collapse category" : "Expand category"}
                        aria-expanded={expanded}
                        className="text-charcoal/70"
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-200",
                            expanded && "rotate-180",
                          )}
                        />
                      </Button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="animate-fade space-y-3 border-t border-onyx/8 p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-4 rounded-lg bg-mint/45 px-3 py-2">
                        <div>
                          <Label
                            htmlFor={`include-category-${category.id}`}
                            className="text-[0.76rem] text-onyx"
                          >
                            Show this category in the CV
                          </Label>
                          <p className="text-[0.64rem] text-muted-foreground">
                            Hiding it keeps everything here for later.
                          </p>
                        </div>
                        <Switch
                          id={`include-category-${category.id}`}
                          checked={category.include}
                          onCheckedChange={(checked) =>
                            updateSkillCategory(category.id, { include: checked })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        {category.skills.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-onyx/10 px-3 py-3 text-center text-[0.72rem] text-charcoal/60">
                            No skills in this category yet.
                          </p>
                        ) : null}

                        {category.skills.map((skill, skillIndex) => (
                          <div
                            key={skill.id}
                            className="rounded-lg border border-onyx/8 bg-mint/20 p-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={skill.include}
                                onCheckedChange={(checked) =>
                                  updateSubSkill(category.id, skill.id, {
                                    include: checked === true,
                                  })
                                }
                                aria-label={`Include ${skill.name || "this skill"} in the CV`}
                                className="size-[18px] shrink-0"
                              />
                              <Input
                                id={`skill-name-${skill.id}`}
                                value={skill.name}
                                onChange={(event) =>
                                  updateSubSkill(category.id, skill.id, {
                                    name: event.target.value,
                                  })
                                }
                                placeholder="Skill, e.g. Budget management"
                                maxLength={100}
                                aria-label="Skill name"
                                className="h-9 flex-1 border-transparent bg-card px-2.5 text-[0.84rem] shadow-none hover:border-onyx/10 focus-visible:border-steel"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => addTaskAndFocus(category.id, skill.id)}
                                aria-label="Add task"
                                title="Add task"
                                className="shrink-0 text-charcoal/55"
                              >
                                <Plus className="size-3.5" />
                              </Button>
                              <ItemMenu
                                onMoveUp={() => moveSubSkill(category.id, skill.id, -1)}
                                onMoveDown={() => moveSubSkill(category.id, skill.id, 1)}
                                onDelete={() =>
                                  setDeleteTarget({
                                    type: "skill",
                                    categoryId: category.id,
                                    skillId: skill.id,
                                    label: skill.name.trim() || "this skill",
                                  })
                                }
                                canMoveUp={skillIndex > 0}
                                canMoveDown={skillIndex < category.skills.length - 1}
                                deleteLabel="Delete skill"
                                extra={
                                  <div className="px-2.5 py-1.5 text-[0.66rem] text-muted-foreground">
                                    {skill.include ? "Shown in CV" : "Hidden from CV"}
                                  </div>
                                }
                              />
                            </div>

                            {skill.tasks.length > 0 ? (
                              <div className="mt-2 space-y-1.5 border-l border-steel/30 pl-3 ml-2">
                                {skill.tasks.map((task) => (
                                  <div key={task.id} className="flex items-center gap-1.5">
                                    <CornerDownRight className="size-3 shrink-0 text-steel/70" />
                                    <Input
                                      data-task-skill={skill.id}
                                      value={task.text}
                                      onChange={(event) =>
                                        updateTask(category.id, skill.id, task.id, event.target.value)
                                      }
                                      placeholder="Task or accomplishment"
                                      maxLength={180}
                                      aria-label="Task"
                                      className="h-8 flex-1 border-transparent bg-transparent px-1.5 text-[0.78rem] shadow-none hover:border-onyx/10 focus-visible:border-steel focus-visible:bg-card"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => removeTask(category.id, skill.id, task.id)}
                                      aria-label="Remove task"
                                      className="size-7 shrink-0 text-charcoal/40 hover:text-destructive"
                                    >
                                      <X className="size-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {skill.tasks.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => addTaskAndFocus(category.id, skill.id)}
                                className="mt-1.5 ml-2 text-[0.66rem] font-medium text-charcoal/55 hover:text-jet"
                              >
                                + Add a task or example
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addTaskAndFocus(category.id, skill.id)}
                                className="mt-1.5 ml-7 text-[0.66rem] font-medium text-charcoal/55 hover:text-jet"
                              >
                                + Add another task
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addSkill(category.id)}
                        className="text-charcoal/75"
                      >
                        <Plus className="size-3.5" />
                        Add skill
                      </Button>
                    </div>
                  ) : null}
                </article>
              );
            })}
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
              Delete {deleteTarget?.type === "category" ? "this category" : "this skill"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-onyx">{deleteTarget?.label}</span>
              {deleteTarget?.type === "category"
                ? " and every skill and task inside it will be removed."
                : " and its tasks will be removed."}{" "}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "category") {
                  removeSkillCategory(deleteTarget.categoryId);
                } else if (deleteTarget.skillId) {
                  removeSubSkill(deleteTarget.categoryId, deleteTarget.skillId);
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
