import type { FontId, TemplateId } from "./types";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  bestFor: string;
  fontHint: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic Professional",
    shortName: "Classic",
    tagline: "Measured and timeless",
    description:
      "A centred serif header with quiet rules and generous spacing. Comfortable in any industry.",
    bestFor: "Finance, law, consulting, academia",
    fontHint: "Serif",
  },
  {
    id: "modern",
    name: "Modern Minimalist",
    shortName: "Modern",
    tagline: "Clean, confident, airy",
    description:
      "Left-aligned typography, a fine accent rule, and plenty of breathing room. Contemporary without shouting.",
    bestFor: "Technology, product, design",
    fontHint: "Sans",
  },
  {
    id: "executive",
    name: "Executive",
    shortName: "Executive",
    tagline: "Quiet authority",
    description:
      "A deep header band and letter-spaced name treatment for senior and leadership applications.",
    bestFor: "Leadership, board, strategy",
    fontHint: "Serif",
  },
  {
    id: "corporate",
    name: "Corporate",
    shortName: "Corporate",
    tagline: "Structured and precise",
    description:
      "A precise grid with accent section markers and a clear contact strip. Built for clarity at speed.",
    bestFor: "Operations, banking, public sector",
    fontHint: "Sans",
  },
  {
    id: "creative",
    name: "Creative",
    shortName: "Creative",
    tagline: "Considered character",
    description:
      "A soft accent rail, monogram, and warm hierarchy. Expressive while staying entirely professional.",
    bestFor: "Design, marketing, media",
    fontHint: "Sans",
  },
  {
    id: "compact",
    name: "Compact",
    shortName: "Compact",
    tagline: "More story, less paper",
    description:
      "Tighter leading and a dense information rhythm for experienced candidates with a long record.",
    bestFor: "Long careers, technical depth",
    fontHint: "Sans",
  },
  {
    id: "ats",
    name: "ATS-Friendly",
    shortName: "ATS",
    tagline: "Nothing in the way",
    description:
      "Plain headings, single-column flow, and real selectable text. Designed to parse cleanly.",
    bestFor: "Large employers, screening systems",
    fontHint: "Sans",
  },
];

export const TEMPLATE_MAP = Object.fromEntries(
  TEMPLATES.map((template) => [template.id, template]),
) as Record<TemplateId, TemplateMeta>;

export interface AccentOption {
  name: string;
  value: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { name: "Jet", value: "#1c3738" },
  { name: "Onyx", value: "#000f08" },
  { name: "Steel", value: "#5f8184" },
  { name: "Pine", value: "#2f5d50" },
  { name: "Burgundy", value: "#6d2e3f" },
  { name: "Navy", value: "#2b3f5c" },
  { name: "Clay", value: "#8a5844" },
  { name: "Plum", value: "#5b3a5e" },
];

export interface FontOption {
  id: FontId;
  name: string;
  note: string;
  stack: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "lato",
    name: "Lato",
    note: "Humanist sans",
    stack: "var(--font-manrope), sans-serif",
  },
  {
    id: "spectral",
    name: "Spectral",
    note: "Contemporary serif",
    stack: "var(--font-instrument), Georgia, serif",
  },
  {
    id: "crimson",
    name: "Crimson Text",
    note: "Classic serif",
    stack: "var(--font-instrument), Georgia, serif",
  },
];

export const FONT_MAP = Object.fromEntries(
  FONT_OPTIONS.map((font) => [font.id, font]),
) as Record<FontId, FontOption>;
