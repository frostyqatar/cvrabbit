"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { immer } from "zustand/middleware/immer";

import { createEmptyData } from "@/lib/cv/defaults";
import { uid } from "@/lib/utils";
import type {
  AdditionalKind,
  Bullet,
  CvData,
  CvRecord,
  CvSettings,
  EducationEntry,
  ExperienceEntry,
  PersonalDetails,
  RenderSectionKey,
  SkillCategory,
  SubSkill,
} from "@/lib/cv/types";

export type BulletKind = "responsibilities" | "achievements";

interface EditorState {
  title: string;
  data: CvData;
  settings: CvSettings;
  setTitle: (title: string) => void;
  updatePersonal: (patch: Partial<PersonalDetails>) => void;
  setSettings: (patch: Partial<CvSettings>) => void;
  toggleSection: (key: RenderSectionKey) => void;
  moveSection: (key: RenderSectionKey, direction: -1 | 1) => void;
  setData: (data: CvData, settings?: CvSettings) => void;
  clearAllFields: () => void;
  addExperience: () => string;
  updateExperience: (id: string, patch: Partial<ExperienceEntry>) => void;
  removeExperience: (id: string) => void;
  moveExperience: (id: string, direction: -1 | 1) => void;
  addBullet: (experienceId: string, kind: BulletKind) => string;
  updateBullet: (experienceId: string, kind: BulletKind, bulletId: string, text: string) => void;
  removeBullet: (experienceId: string, kind: BulletKind, bulletId: string) => void;
  moveBullet: (experienceId: string, kind: BulletKind, bulletId: string, direction: -1 | 1) => void;
  addEducation: () => string;
  updateEducation: (id: string, patch: Partial<EducationEntry>) => void;
  removeEducation: (id: string) => void;
  moveEducation: (id: string, direction: -1 | 1) => void;
  addSkillCategory: () => string;
  updateSkillCategory: (id: string, patch: Partial<SkillCategory>) => void;
  removeSkillCategory: (id: string) => void;
  moveSkillCategory: (id: string, direction: -1 | 1) => void;
  addSubSkill: (categoryId: string) => string;
  updateSubSkill: (categoryId: string, skillId: string, patch: Partial<SubSkill>) => void;
  removeSubSkill: (categoryId: string, skillId: string) => void;
  moveSubSkill: (categoryId: string, skillId: string, direction: -1 | 1) => void;
  addTask: (categoryId: string, skillId: string) => void;
  updateTask: (categoryId: string, skillId: string, taskId: string, text: string) => void;
  removeTask: (categoryId: string, skillId: string, taskId: string) => void;
  addAdditionalSection: (kind: AdditionalKind) => string;
  updateAdditionalSection: (id: string, patch: { title?: string; include?: boolean }) => void;
  removeAdditionalSection: (id: string) => void;
  moveAdditionalSection: (id: string, direction: -1 | 1) => void;
  addAdditionalItem: (sectionId: string) => void;
  moveAdditionalItem: (sectionId: string, itemId: string, direction: -1 | 1) => void;
  updateAdditionalItem: (
    sectionId: string,
    itemId: string,
    patch: { title?: string; subtitle?: string; text?: string; link?: string },
  ) => void;
  removeAdditionalItem: (sectionId: string, itemId: string) => void;
}

function emptyExperience(): ExperienceEntry {
  return {
    id: uid("exp"),
    jobTitle: "",
    employer: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    responsibilities: [{ id: uid("b"), text: "" }],
    achievements: [],
  };
}

function emptyEducation(): EducationEntry {
  return {
    id: uid("edu"),
    institution: "",
    degree: "",
    field: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  };
}

function moveItem<T>(items: T[], id: string, getId: (item: T) => string, direction: -1 | 1) {
  const index = items.findIndex((item) => getId(item) === id);
  if (index < 0) return;
  const target = index + direction;
  if (target < 0 || target >= items.length) return;
  const [item] = items.splice(index, 1);
  items.splice(target, 0, item);
}

function bulletList(entry: ExperienceEntry, kind: BulletKind): Bullet[] {
  return entry[kind];
}

export function createEditorStore(initial: Pick<CvRecord, "title" | "data" | "settings">) {
  return createStore<EditorState>()(
    immer((set) => ({
      title: initial.title,
      data: initial.data,
      settings: initial.settings,

      setTitle: (title) =>
        set((state) => {
          state.title = title.slice(0, 120);
        }),

      updatePersonal: (patch) =>
        set((state) => {
          Object.assign(state.data.personal, patch);
        }),

      setSettings: (patch) =>
        set((state) => {
          Object.assign(state.settings, patch);
        }),

      toggleSection: (key) =>
        set((state) => {
          state.settings.sectionVisibility[key] = !state.settings.sectionVisibility[key];
        }),

      moveSection: (key, direction) =>
        set((state) => {
          moveItem(state.settings.sectionOrder, key, (item) => item, direction);
        }),

      setData: (data, settings) =>
        set((state) => {
          state.data = data;
          if (settings) state.settings = settings;
        }),

      clearAllFields: () =>
        set((state) => {
          state.data = createEmptyData();
        }),

      addExperience: () => {
        const entry = emptyExperience();
        set((state) => {
          state.data.experience.push(entry);
        });
        return entry.id;
      },

      updateExperience: (id, patch) =>
        set((state) => {
          const entry = state.data.experience.find((item) => item.id === id);
          if (entry) Object.assign(entry, patch);
        }),

      removeExperience: (id) =>
        set((state) => {
          state.data.experience = state.data.experience.filter((item) => item.id !== id);
        }),

      moveExperience: (id, direction) =>
        set((state) => {
          moveItem(state.data.experience, id, (item) => item.id, direction);
        }),

      addBullet: (experienceId, kind) => {
        const bullet = { id: uid("b"), text: "" };
        set((state) => {
          const entry = state.data.experience.find((item) => item.id === experienceId);
          if (entry) bulletList(entry, kind).push(bullet);
        });
        return bullet.id;
      },

      updateBullet: (experienceId, kind, bulletId, text) =>
        set((state) => {
          const entry = state.data.experience.find((item) => item.id === experienceId);
          const bullet = entry ? bulletList(entry, kind).find((item) => item.id === bulletId) : null;
          if (bullet) bullet.text = text;
        }),

      removeBullet: (experienceId, kind, bulletId) =>
        set((state) => {
          const entry = state.data.experience.find((item) => item.id === experienceId);
          if (entry) {
            entry[kind] = entry[kind].filter((item) => item.id !== bulletId);
          }
        }),

      moveBullet: (experienceId, kind, bulletId, direction) =>
        set((state) => {
          const entry = state.data.experience.find((item) => item.id === experienceId);
          if (entry) moveItem(entry[kind], bulletId, (item) => item.id, direction);
        }),

      addEducation: () => {
        const entry = emptyEducation();
        set((state) => {
          state.data.education.push(entry);
        });
        return entry.id;
      },

      updateEducation: (id, patch) =>
        set((state) => {
          const entry = state.data.education.find((item) => item.id === id);
          if (entry) Object.assign(entry, patch);
        }),

      removeEducation: (id) =>
        set((state) => {
          state.data.education = state.data.education.filter((item) => item.id !== id);
        }),

      moveEducation: (id, direction) =>
        set((state) => {
          moveItem(state.data.education, id, (item) => item.id, direction);
        }),

      addSkillCategory: () => {
        const category: SkillCategory = {
          id: uid("cat"),
          name: "",
          include: true,
          skills: [],
        };
        set((state) => {
          state.data.skills.push(category);
        });
        return category.id;
      },

      updateSkillCategory: (id, patch) =>
        set((state) => {
          const category = state.data.skills.find((item) => item.id === id);
          if (category) Object.assign(category, patch);
        }),

      removeSkillCategory: (id) =>
        set((state) => {
          state.data.skills = state.data.skills.filter((item) => item.id !== id);
        }),

      moveSkillCategory: (id, direction) =>
        set((state) => {
          moveItem(state.data.skills, id, (item) => item.id, direction);
        }),

      addSubSkill: (categoryId) => {
        const skill: SubSkill = {
          id: uid("skill"),
          name: "",
          include: true,
          tasks: [],
        };
        set((state) => {
          const category = state.data.skills.find((item) => item.id === categoryId);
          if (category) category.skills.push(skill);
        });
        return skill.id;
      },

      updateSubSkill: (categoryId, skillId, patch) =>
        set((state) => {
          const category = state.data.skills.find((item) => item.id === categoryId);
          const skill = category?.skills.find((item) => item.id === skillId);
          if (skill) Object.assign(skill, patch);
        }),

      removeSubSkill: (categoryId, skillId) =>
        set((state) => {
          const category = state.data.skills.find((item) => item.id === categoryId);
          if (category) category.skills = category.skills.filter((item) => item.id !== skillId);
        }),

      moveSubSkill: (categoryId, skillId, direction) =>
        set((state) => {
          const category = state.data.skills.find((item) => item.id === categoryId);
          if (category) moveItem(category.skills, skillId, (item) => item.id, direction);
        }),

      addTask: (categoryId, skillId) =>
        set((state) => {
          const category = state.data.skills.find((item) => item.id === categoryId);
          const skill = category?.skills.find((item) => item.id === skillId);
          if (skill) skill.tasks.push({ id: uid("task"), text: "" });
        }),

      updateTask: (categoryId, skillId, taskId, text) =>
        set((state) => {
          const category = state.data.skills.find((item) => item.id === categoryId);
          const skill = category?.skills.find((item) => item.id === skillId);
          const task = skill?.tasks.find((item) => item.id === taskId);
          if (task) task.text = text;
        }),

      removeTask: (categoryId, skillId, taskId) =>
        set((state) => {
          const category = state.data.skills.find((item) => item.id === categoryId);
          const skill = category?.skills.find((item) => item.id === skillId);
          if (skill) skill.tasks = skill.tasks.filter((item) => item.id !== taskId);
        }),

      addAdditionalSection: (kind) => {
        const titles: Record<AdditionalKind, string> = {
          certifications: "Certifications",
          projects: "Projects",
          languages: "Languages",
          awards: "Awards",
          volunteering: "Volunteering",
          memberships: "Professional memberships",
          custom: "Custom section",
        };
        const section = {
          id: uid("add"),
          kind,
          title: titles[kind],
          include: true,
          items: [],
        };
        set((state) => {
          state.data.additional.push(section);
        });
        return section.id;
      },

      updateAdditionalSection: (id, patch) =>
        set((state) => {
          const section = state.data.additional.find((item) => item.id === id);
          if (section) Object.assign(section, patch);
        }),

      removeAdditionalSection: (id) =>
        set((state) => {
          state.data.additional = state.data.additional.filter((item) => item.id !== id);
        }),

      moveAdditionalSection: (id, direction) =>
        set((state) => {
          moveItem(state.data.additional, id, (item) => item.id, direction);
        }),

      addAdditionalItem: (sectionId) =>
        set((state) => {
          const section = state.data.additional.find((item) => item.id === sectionId);
          if (section) {
            section.items.push({
              id: uid("item"),
              title: "",
              subtitle: "",
              text: "",
              link: "",
            });
          }
        }),

      moveAdditionalItem: (sectionId, itemId, direction) =>
        set((state) => {
          const section = state.data.additional.find((item) => item.id === sectionId);
          if (section) moveItem(section.items, itemId, (item) => item.id, direction);
        }),

      updateAdditionalItem: (sectionId, itemId, patch) =>
        set((state) => {
          const section = state.data.additional.find((item) => item.id === sectionId);
          const item = section?.items.find((entry) => entry.id === itemId);
          if (item) Object.assign(item, patch);
        }),

      removeAdditionalItem: (sectionId, itemId) =>
        set((state) => {
          const section = state.data.additional.find((item) => item.id === sectionId);
          if (section) section.items = section.items.filter((item) => item.id !== itemId);
        }),
    })),
  );
}

export type EditorStore = StoreApi<EditorState>;

const EditorContext = createContext<EditorStore | null>(null);

export function EditorProvider({
  initial,
  children,
}: {
  initial: Pick<CvRecord, "title" | "data" | "settings">;
  children: ReactNode;
}) {
  const [store] = useState<EditorStore>(() => createEditorStore(initial));
  return <EditorContext.Provider value={store}>{children}</EditorContext.Provider>;
}

export function useEditor<T>(selector: (state: EditorState) => T): T {
  const store = useContext(EditorContext);
  if (!store) throw new Error("useEditor must be used inside EditorProvider");
  return useStore(store, selector);
}

export function useEditorStoreApi(): EditorStore {
  const store = useContext(EditorContext);
  if (!store) throw new Error("useEditorStoreApi must be used inside EditorProvider");
  return store;
}
