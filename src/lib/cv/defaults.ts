import { uid } from "@/lib/utils";

import type {
  AdditionalKind,
  AdditionalSection,
  CvData,
  CvSettings,
  EducationEntry,
  ExperienceEntry,
  RenderSectionKey,
  SkillCategory,
} from "./types";

export const DEFAULT_SECTION_ORDER: RenderSectionKey[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "additional",
];

export const DEFAULT_SETTINGS: CvSettings = {
  templateId: "classic",
  accent: "#1c3738",
  font: "lato",
  density: "comfortable",
  sectionOrder: DEFAULT_SECTION_ORDER,
  sectionVisibility: {
    summary: true,
    experience: true,
    education: true,
    skills: true,
    additional: true,
  },
};

export function createEmptyData(): CvData {
  return {
    personal: {
      fullName: "",
      professionalTitle: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [],
    additional: [],
  };
}

export function createExperience(): ExperienceEntry {
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

export function createEducation(): EducationEntry {
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

export function createSkillCategory(name = ""): SkillCategory {
  return {
    id: uid("cat"),
    name,
    include: true,
    skills: [],
  };
}

export function createAdditionalSection(kind: AdditionalKind): AdditionalSection {
  const titles: Record<AdditionalKind, string> = {
    certifications: "Certifications",
    projects: "Projects",
    languages: "Languages",
    awards: "Awards",
    volunteering: "Volunteering",
    memberships: "Professional memberships",
    custom: "Custom section",
  };
  return {
    id: uid("add"),
    kind,
    title: titles[kind],
    include: true,
    items: [],
  };
}

export function createBlankCv() {
  return {
    title: "Untitled CV",
    data: createEmptyData(),
    settings: { ...DEFAULT_SETTINGS, sectionOrder: [...DEFAULT_SECTION_ORDER] },
  };
}
