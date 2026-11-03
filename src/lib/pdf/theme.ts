import type { Density, TemplateId } from "@/lib/cv/types";

export interface SpacingTokens {
  padX: number;
  padTop: number;
  padBottom: number;
  bodySize: number;
  bodyLineHeight: number;
  sectionGap: number;
  entryGap: number;
  bulletGap: number;
  headingSize: number;
  nameSize: number;
  titleSize: number;
  contactSize: number;
  metaSize: number;
  footerSize: number;
}

export function spacingFor(template: TemplateId, density: Density): SpacingTokens {
  const compact = density === "compact";
  const base: SpacingTokens = {
    padX: compact ? 38 : 47,
    padTop: compact ? 34 : 44,
    padBottom: compact ? 40 : 48,
    bodySize: compact ? 8.55 : 9.35,
    bodyLineHeight: compact ? 1.34 : 1.44,
    sectionGap: compact ? 10 : 14.5,
    entryGap: compact ? 5.5 : 8,
    bulletGap: compact ? 1.5 : 2.4,
    headingSize: compact ? 7.7 : 8.3,
    nameSize: compact ? 19 : 23,
    titleSize: compact ? 8.2 : 9,
    contactSize: compact ? 7.6 : 8.2,
    metaSize: compact ? 7.8 : 8.4,
    footerSize: 6.6,
  };

  switch (template) {
    case "modern":
      return { ...base, nameSize: compact ? 21 : 26, headingSize: compact ? 7.6 : 8.1 };
    case "executive":
      return { ...base, nameSize: compact ? 20 : 23, padTop: compact ? 38 : 46 };
    case "corporate":
      return { ...base, nameSize: compact ? 19 : 22 };
    case "creative":
      return { ...base, nameSize: compact ? 19 : 23, padX: compact ? 44 : 54 };
    case "compact":
      return {
        ...base,
        bodySize: compact ? 8.4 : 8.85,
        bodyLineHeight: compact ? 1.3 : 1.37,
        sectionGap: compact ? 8 : 11,
        entryGap: compact ? 4.5 : 6,
        nameSize: 19,
      };
    case "ats":
      return {
        ...base,
        bodySize: compact ? 9 : 9.6,
        bodyLineHeight: compact ? 1.34 : 1.4,
        sectionGap: compact ? 10 : 13,
        nameSize: 20,
        headingSize: compact ? 8.6 : 9,
      };
    default:
      return base;
  }
}

export const PDF_COLORS = {
  ink: "#000f08",
  body: "#4d4847",
  charcoal: "#4d4847",
  muted: "#4d4847",
  rule: "rgba(0,15,8,0.14)",
  paper: "#ffffff",
  mint: "#f4fff8",
  steel: "#8baaad",
};
