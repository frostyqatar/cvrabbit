import type { CvData, CvSettings, RenderSectionKey } from "./types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMonthYear(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const iso = /^(\d{4})-(\d{1,2})$/.exec(trimmed);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]) - 1;
    if (month >= 0 && month < 12) return `${MONTHS[month]} ${year}`;
    return iso[1];
  }

  const numeric = /^(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (numeric) {
    const month = Number(numeric[1]) - 1;
    if (month >= 0 && month < 12) return `${MONTHS[month]} ${numeric[2]}`;
  }

  return trimmed;
}

export function formatDateRange(start: string, end: string, current = false): string {
  const from = formatMonthYear(start);
  const to = current ? "Present" : formatMonthYear(end);
  if (from && to) return `${from} — ${to}`;
  return from || to || "";
}

export function displayName(data: CvData): string {
  return data.personal.fullName.trim() || "Your Name";
}

export function hasSummary(data: CvData): boolean {
  return data.personal.summary.trim().length > 0;
}

export function hasExperience(data: CvData): boolean {
  return data.experience.some(
    (entry) =>
      entry.jobTitle.trim() ||
      entry.employer.trim() ||
      entry.responsibilities.some((b) => b.text.trim()) ||
      entry.achievements.some((b) => b.text.trim()),
  );
}

export function hasEducation(data: CvData): boolean {
  return data.education.some(
    (entry) => entry.institution.trim() || entry.degree.trim() || entry.field.trim(),
  );
}

export function hasSkills(data: CvData): boolean {
  return data.skills.some(
    (category) =>
      category.include &&
      category.name.trim() &&
      (category.skills.some((skill) => skill.include && skill.name.trim()) || category.skills.length === 0),
  );
}

export function hasAdditional(data: CvData): boolean {
  return data.additional.some(
    (section) => section.include && section.title.trim() && section.items.some((item) => item.title.trim() || item.text.trim()),
  );
}

export function sectionHasContent(data: CvData, key: RenderSectionKey): boolean {
  switch (key) {
    case "summary":
      return hasSummary(data);
    case "experience":
      return hasExperience(data);
    case "education":
      return hasEducation(data);
    case "skills":
      return hasSkills(data);
    case "additional":
      return hasAdditional(data);
  }
}

export function getRenderSections(data: CvData, settings: CvSettings): RenderSectionKey[] {
  return settings.sectionOrder.filter(
    (key) => settings.sectionVisibility[key] && sectionHasContent(data, key),
  );
}

export function visibleSkillCategories(data: CvData) {
  return data.skills
    .filter((category) => category.include && category.name.trim())
    .map((category) => ({
      ...category,
      skills: category.skills.filter((skill) => skill.include && skill.name.trim()),
    }))
    .filter((category) => category.skills.length > 0 || category.name.trim());
}

export function visibleAdditionalSections(data: CvData) {
  return data.additional
    .filter((section) => section.include && section.title.trim())
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.title.trim() || item.text.trim()),
    }))
    .filter((section) => section.items.length > 0);
}

export function cvProgress(data: CvData): number {
  const checks = [
    Boolean(data.personal.fullName.trim()),
    Boolean(data.personal.email.trim() || data.personal.phone.trim()),
    Boolean(data.personal.professionalTitle.trim()),
    Boolean(data.personal.summary.trim()),
    hasExperience(data),
    hasEducation(data),
    hasSkills(data),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function contactItems(data: CvData) {
  const p = data.personal;
  return [
    { type: "email" as const, value: p.email.trim(), href: p.email ? `mailto:${p.email}` : "" },
    {
      type: "phone" as const,
      value: p.phone.trim(),
      href: p.phone ? `tel:${p.phone.replace(/[^\d+]/g, "")}` : "",
    },
    { type: "location" as const, value: p.location.trim(), href: "" },
    {
      type: "linkedin" as const,
      value: p.linkedin.trim(),
      href: p.linkedin ? withProtocol(p.linkedin) : "",
    },
    {
      type: "website" as const,
      value: p.website.trim(),
      href: p.website ? withProtocol(p.website) : "",
    },
  ].filter((item) => item.value.length > 0);
}

export function withProtocol(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function stripProtocol(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
