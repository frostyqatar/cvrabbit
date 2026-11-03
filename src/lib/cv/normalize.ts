import { uid } from "@/lib/utils";

import { DEFAULT_SECTION_ORDER, DEFAULT_SETTINGS } from "./defaults";
import type {
  AdditionalKind,
  AdditionalSection,
  Bullet,
  CvData,
  CvSettings,
  EducationEntry,
  ExperienceEntry,
  PersonalDetails,
  RenderSectionKey,
  SkillCategory,
  SubSkill,
  TemplateId,
} from "./types";
import { FONT_IDS, TEMPLATE_IDS } from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function id(value: unknown, prefix: string): string {
  const candidate = str(value);
  return candidate.length > 0 ? candidate : uid(prefix);
}

function normalizeBullets(value: unknown): Bullet[] {
  return arr(value)
    .map((item) => {
      if (typeof item === "string") {
        return item.trim() ? { id: uid("b"), text: item } : null;
      }
      if (isRecord(item)) {
        const text = str(item.text);
        return text.trim() ? { id: id(item.id, "b"), text } : null;
      }
      return null;
    })
    .filter((item): item is Bullet => Boolean(item));
}

function normalizePersonal(value: unknown): PersonalDetails {
  const record = isRecord(value) ? value : {};
  return {
    fullName: str(record.fullName ?? record.name),
    professionalTitle: str(record.professionalTitle ?? record.title),
    email: str(record.email),
    phone: str(record.phone),
    location: str(record.location),
    linkedin: str(record.linkedin),
    website: str(record.website ?? record.portfolio),
    summary: str(record.summary),
  };
}

function normalizeExperience(value: unknown): ExperienceEntry[] {
  return arr(value).map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      id: id(record.id, "exp"),
      jobTitle: str(record.jobTitle ?? record.title),
      employer: str(record.employer ?? record.company),
      location: str(record.location),
      startDate: str(record.startDate ?? record.start),
      endDate: str(record.endDate ?? record.end),
      current: bool(record.current),
      responsibilities: normalizeBullets(record.responsibilities ?? record.bullets),
      achievements: normalizeBullets(record.achievements),
    };
  });
}

function normalizeEducation(value: unknown): EducationEntry[] {
  return arr(value).map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      id: id(record.id, "edu"),
      institution: str(record.institution ?? record.school),
      degree: str(record.degree),
      field: str(record.field ?? record.fieldOfStudy),
      location: str(record.location),
      startDate: str(record.startDate ?? record.start),
      endDate: str(record.endDate ?? record.end),
      current: bool(record.current),
      description: str(record.description ?? record.details),
    };
  });
}

function normalizeSubSkill(value: unknown): SubSkill {
  const record = isRecord(value) ? value : {};
  return {
    id: id(record.id, "skill"),
    name: str(record.name ?? record.skill),
    include: bool(record.include, true),
    tasks: arr(record.tasks)
      .map((task) => {
        if (typeof task === "string") {
          return task.trim() ? { id: uid("task"), text: task } : null;
        }
        if (isRecord(task)) {
          const text = str(task.text);
          return text.trim() ? { id: id(task.id, "task"), text } : null;
        }
        return null;
      })
      .filter((task): task is { id: string; text: string } => Boolean(task)),
  };
}

function normalizeSkills(value: unknown): SkillCategory[] {
  return arr(value).map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      id: id(record.id, "cat"),
      name: str(record.name ?? record.category),
      include: bool(record.include, true),
      skills: arr(record.skills ?? record.subSkills ?? record.items).map(normalizeSubSkill),
    };
  });
}

const ADDITIONAL_KINDS: AdditionalKind[] = [
  "certifications",
  "projects",
  "languages",
  "awards",
  "volunteering",
  "memberships",
  "custom",
];

function normalizeAdditional(value: unknown): AdditionalSection[] {
  return arr(value).map((item) => {
    const record = isRecord(item) ? item : {};
    const kindCandidate = str(record.kind) as AdditionalKind;
    return {
      id: id(record.id, "add"),
      kind: ADDITIONAL_KINDS.includes(kindCandidate) ? kindCandidate : "custom",
      title: str(record.title, "Additional"),
      include: bool(record.include, true),
      items: arr(record.items).map((entry) => {
        const row = isRecord(entry) ? entry : {};
        if (typeof entry === "string") {
          return { id: uid("item"), title: entry, subtitle: "", text: "", link: "" };
        }
        return {
          id: id(row.id, "item"),
          title: str(row.title),
          subtitle: str(row.subtitle),
          text: str(row.text ?? row.description),
          link: str(row.link),
        };
      }),
    };
  });
}

export function normalizeData(value: unknown): CvData {
  const record = isRecord(value) ? value : {};
  return {
    personal: normalizePersonal(record.personal),
    experience: normalizeExperience(record.experience),
    education: normalizeEducation(record.education),
    skills: normalizeSkills(record.skills),
    additional: normalizeAdditional(record.additional),
  };
}

export function normalizeSettings(value: unknown): CvSettings {
  const record = isRecord(value) ? value : {};
  const templateId = str(record.templateId, "classic") as TemplateId;
  const font = str(record.font, "lato") as CvSettings["font"];
  const density = str(record.density, "comfortable") === "compact" ? "compact" : "comfortable";

  const rawOrder = arr(record.sectionOrder).map((key) => str(key)) as RenderSectionKey[];
  const validKeys = DEFAULT_SECTION_ORDER;
  const order = [
    ...rawOrder.filter((key, index) => validKeys.includes(key) && rawOrder.indexOf(key) === index),
    ...validKeys.filter((key) => !rawOrder.includes(key)),
  ];

  const rawVisibility = isRecord(record.sectionVisibility) ? record.sectionVisibility : {};
  const sectionVisibility = DEFAULT_SECTION_ORDER.reduce(
    (acc, key) => {
      acc[key] = bool(rawVisibility[key], true);
      return acc;
    },
    {} as Record<RenderSectionKey, boolean>,
  );

  return {
    templateId: TEMPLATE_IDS.includes(templateId) ? templateId : "classic",
    accent: /^#[0-9a-f]{6}$/i.test(str(record.accent)) ? str(record.accent) : DEFAULT_SETTINGS.accent,
    font: FONT_IDS.includes(font) ? font : "lato",
    density,
    sectionOrder: order,
    sectionVisibility,
  };
}

export function normalizeTitle(value: unknown): string {
  const title = str(value).trim();
  return title.length > 0 ? title.slice(0, 120) : "Untitled CV";
}
