export type TemplateId =
  | "classic"
  | "modern"
  | "executive"
  | "corporate"
  | "creative"
  | "compact"
  | "ats";

export type FontId = "lato" | "spectral" | "crimson";

export type Density = "comfortable" | "compact";

export type RenderSectionKey = "summary" | "experience" | "education" | "skills" | "additional";

export type AdditionalKind =
  | "certifications"
  | "projects"
  | "languages"
  | "awards"
  | "volunteering"
  | "memberships"
  | "custom";

export interface PersonalDetails {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
}

export interface Bullet {
  id: string;
  text: string;
}

export interface ExperienceEntry {
  id: string;
  jobTitle: string;
  employer: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: Bullet[];
  achievements: Bullet[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface SkillTask {
  id: string;
  text: string;
}

export interface SubSkill {
  id: string;
  name: string;
  include: boolean;
  tasks: SkillTask[];
}

export interface SkillCategory {
  id: string;
  name: string;
  include: boolean;
  skills: SubSkill[];
}

export interface AdditionalItem {
  id: string;
  title: string;
  subtitle: string;
  text: string;
  link: string;
}

export interface AdditionalSection {
  id: string;
  kind: AdditionalKind;
  title: string;
  include: boolean;
  items: AdditionalItem[];
}

export interface CvData {
  personal: PersonalDetails;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillCategory[];
  additional: AdditionalSection[];
}

export interface CvSettings {
  templateId: TemplateId;
  accent: string;
  font: FontId;
  density: Density;
  sectionOrder: RenderSectionKey[];
  sectionVisibility: Record<RenderSectionKey, boolean>;
}

export interface CvRecord {
  id: string;
  user_id: string;
  title: string;
  data: CvData;
  settings: CvSettings;
  source_file_path: string | null;
  source_file_name: string | null;
  source_file_type: string | null;
  source_file_size: number | null;
  extraction_status: "none" | "processing" | "complete" | "partial" | "failed";
  created_at: string;
  updated_at: string;
  revision: number;
}

export interface CvSummary {
  id: string;
  title: string;
  data: CvData;
  settings: CvSettings;
  source_file_name: string | null;
  updated_at: string;
  created_at: string;
}

export const RENDER_SECTION_LABELS: Record<RenderSectionKey, string> = {
  summary: "Profile",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  additional: "Additional",
};

export const ADDITIONAL_KIND_LABELS: Record<AdditionalKind, string> = {
  certifications: "Certifications",
  projects: "Projects",
  languages: "Languages",
  awards: "Awards",
  volunteering: "Volunteering",
  memberships: "Professional memberships",
  custom: "Custom section",
};

export const TEMPLATE_IDS: TemplateId[] = [
  "classic",
  "modern",
  "executive",
  "corporate",
  "creative",
  "compact",
  "ats",
];

export const FONT_IDS: FontId[] = ["lato", "spectral", "crimson"];
