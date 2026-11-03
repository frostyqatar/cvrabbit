import { uid } from "@/lib/utils";

import type {
  AdditionalKind,
  AdditionalSection,
  Bullet,
  CvData,
  EducationEntry,
  ExperienceEntry,
  SkillCategory,
} from "./types";

interface SectionChunk {
  key: "header" | "summary" | "experience" | "education" | "skills" | "additional";
  lines: string[];
}

export interface ParseResult {
  data: CvData;
  warnings: string[];
  confidence: number;
  detected: {
    name: boolean;
    title: boolean;
    summary: boolean;
    experience: number;
    education: number;
    skills: number;
    additional: number;
  };
}

const SUMMARY_ALIASES = [
  "summary",
  "professional summary",
  "profile",
  "professional profile",
  "about",
  "about me",
  "personal statement",
  "career summary",
  "career objective",
  "objective",
  "executive summary",
  "professional objective",
];

const EXPERIENCE_ALIASES = [
  "experience",
  "work experience",
  "professional experience",
  "employment",
  "employment history",
  "work history",
  "career history",
  "relevant experience",
  "professional background",
  "experience and achievements",
];

const EDUCATION_ALIASES = [
  "education",
  "academic background",
  "academic history",
  "qualifications",
  "academic qualifications",
  "education and training",
  "education & training",
  "training and education",
];

const SKILL_ALIASES = [
  "skills",
  "core skills",
  "key skills",
  "technical skills",
  "core competencies",
  "competencies",
  "areas of expertise",
  "expertise",
  "professional skills",
  "it skills",
  "tools and technologies",
  "skills and interests",
];

const ADDITIONAL_HEADERS: Array<{ kind: AdditionalKind; aliases: string[] }> = [
  {
    kind: "certifications",
    aliases: [
      "certifications",
      "certificates",
      "certification",
      "licenses",
      "licences",
      "professional certifications",
      "training",
      "courses",
    ],
  },
  {
    kind: "projects",
    aliases: ["projects", "selected projects", "key projects", "portfolio", "personal projects"],
  },
  { kind: "languages", aliases: ["languages", "language skills"] },
  { kind: "awards", aliases: ["awards", "honors", "honours", "awards and honors", "awards and honours"] },
  {
    kind: "volunteering",
    aliases: [
      "volunteering",
      "volunteer experience",
      "volunteer work",
      "community involvement",
      "community service",
    ],
  },
  {
    kind: "memberships",
    aliases: ["memberships", "professional memberships", "affiliations", "professional affiliations"],
  },
  {
    kind: "custom",
    aliases: ["publications", "interests", "references", "additional information", "other"],
  },
];

const MONTHS: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

const MONTH_PATTERN =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";

const YEAR_PATTERN = "(?:19|20)\\d{2}";
const DATE_PATTERN = `(?:${MONTH_PATTERN}\\s+)?${YEAR_PATTERN}`;
const RANGE_RE = new RegExp(
  `\\b(${DATE_PATTERN})\\s*(?:-|–|—|to|until|through)\\s*(${DATE_PATTERN}|present|current|now|today)\\b`,
  "i",
);
const SINGLE_YEAR_RE = new RegExp(`^${YEAR_PATTERN}$`);

const DEGREE_RE =
  /\b(b\.?\s?sc|b\.?\s?a\.?|b\.?\s?eng|b\.?\s?tech|m\.?\s?sc|m\.?\s?a\.?|m\.?\s?eng|mba|ph\.?\s?d|doctorate|bachelor(?:'s)?|master(?:'s)?|associate(?:'s)?|diploma|certificate|foundation degree|a-level|gcse|hnd|hnc)\b/i;

const INSTITUTION_RE =
  /\b(university|college|institute|school|academy|polytechnic|conservatoire|seminary)\b/i;

const ACHIEVEMENT_RE =
  /(\d+\s?%|\b\d+(?:[.,]\d+)?\s?(?:k|m|bn|million|billion|thousand)\b|resulting in|which led to|award[- ]winning|\b(increased|reduced|improved|grew|grow|launched|delivered|saved|generated|won|cut|boosted|raised|transformed|accelerated|secured|doubled|tripled|negotiated|scaled)\b)/i;

function cleanLine(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHeaderPunctuation(value: string): string {
  return value
    .replace(/^[\s\-–—•·|]+/, "")
    .replace(/[:\s]+$/, "")
    .trim();
}

function normalizedHeader(value: string): string {
  return stripHeaderPunctuation(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyBullet(line: string): boolean {
  return /^([-*•▪◦‣·●○]|\d{1,2}[.)])\s+/.test(line);
}

export function stripBullet(line: string): string {
  return line.replace(/^([-*•▪◦‣·●○]|\d{1,2}[.)])\s+/, "").trim();
}

function normalizeBullet(line: string): string {
  return line.replace(/^([•▪◦‣·●○]|\d{1,2}[.)])\s+/, "- ").trim();
}

function aliasMatches(normalized: string, aliases: string[]): boolean {
  if (aliases.includes(normalized)) return true;
  // Letter-spaced PDF headings arrive as "P R O F I L E" or "W O R K E X P E R I E N C E".
  const compact = normalized.replace(/\s+/g, "");
  return aliases.some((alias) => alias.replace(/\s+/g, "") === compact);
}

function collapseSpacedHeading(value: string): string {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 4 && tokens.filter((token) => token.length === 1).length / tokens.length >= 0.7) {
    return tokens.join("");
  }
  return value;
}

function detectAdditionalKind(value: string): AdditionalKind | null {
  const normalized = normalizedHeader(value);
  for (const entry of ADDITIONAL_HEADERS) {
    if (aliasMatches(normalized, entry.aliases)) return entry.kind;
  }
  return null;
}

function detectSection(line: string): {
  key: SectionChunk["key"];
  additionalKind?: AdditionalKind;
} | null {
  if (line.length > 48) return null;
  if (isLikelyBullet(line)) return null;
  const normalized = normalizedHeader(line);
  if (!normalized) return null;
  if (/\d/.test(normalized) || normalized.includes("@")) return null;

  const tokens = normalized.split(" ").filter(Boolean);
  const spacedLetters =
    tokens.length >= 4 &&
    tokens.filter((token) => token.length === 1).length / tokens.length >= 0.7;
  if (!spacedLetters && tokens.length > 5) return null;

  if (aliasMatches(normalized, SUMMARY_ALIASES)) return { key: "summary" };
  if (aliasMatches(normalized, EXPERIENCE_ALIASES)) return { key: "experience" };
  if (aliasMatches(normalized, EDUCATION_ALIASES)) return { key: "education" };
  if (aliasMatches(normalized, SKILL_ALIASES)) return { key: "skills" };

  const additionalKind = detectAdditionalKind(normalized);
  if (additionalKind) return { key: "additional", additionalKind };

  if (
    aliasMatches(normalized, ["additional information", "other information"])
  ) {
    return { key: "additional" };
  }

  return null;
}

function splitSections(lines: string[]): SectionChunk[] {
  const chunks: SectionChunk[] = [{ key: "header", lines: [] }];
  let current = chunks[0];

  for (const raw of lines) {
    const line = cleanLine(raw);
    if (!line) continue;
    if (/^(page\s+)?\d{1,3}(\s+of\s+\d{1,3})?$/i.test(line)) continue;

    const section = detectSection(line);
    if (section) {
      if (section.key === "additional" && section.additionalKind) {
        // Keep the subheading so the additional parser can preserve its title.
        current = {
          key: "additional",
          lines: [
            `__SECTION__:${section.additionalKind}:${collapseSpacedHeading(
              stripHeaderPunctuation(line),
            )}`,
          ],
        };
      } else {
        current = { key: section.key, lines: [] };
      }
      chunks.push(current);
      continue;
    }

    current.lines.push(normalizeBullet(line));
  }

  return chunks;
}

function normalizeDate(value: string): string {
  const trimmed = value.trim().replace(/[.,]/g, "");
  if (!trimmed) return "";
  if (/^(present|current|now|today)$/i.test(trimmed)) return "";
  if (/^\d{4}$/.test(trimmed)) return trimmed;

  const match = /^([A-Za-z]+)\s+(\d{4})$/.exec(trimmed);
  if (match) {
    const month = MONTHS[match[1].toLowerCase()];
    if (month) return `${match[2]}-${month}`;
  }
  return trimmed;
}

function findDateRange(line: string): { start: string; end: string; current: boolean; raw: string; index: number } | null {
  const match = RANGE_RE.exec(line);
  if (match) {
    const isCurrent = /present|current|now|today/i.test(match[2]);
    return {
      start: normalizeDate(match[1]),
      end: isCurrent ? "" : normalizeDate(match[2]),
      current: isCurrent,
      raw: match[0],
      index: match.index,
    };
  }

  const single = SINGLE_YEAR_RE.exec(line.trim());
  if (single) {
    return { start: single[0], end: "", current: false, raw: single[0], index: 0 };
  }
  return null;
}

function splitParts(value: string): string[] {
  return value
    .split(/\s+[|·•]\s+|\s+—\s+|\s+–\s+|\s+-\s+|\s+at\s+/i)
    .map((part) => cleanLine(part).replace(/^[-–—,;:]+|[-–—,;:]+$/g, "").trim())
    .filter(Boolean);
}

function looksLikeLocation(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 48) return false;
  if (/\d{4}|@|https?:|www\./i.test(trimmed)) return false;
  if (/\b(manager|engineer|developer|designer|consultant|analyst|director|officer|specialist|assistant|coordinator|lead|intern|teacher|nurse|accountant|architect)\b/i.test(trimmed)) {
    return false;
  }
  return /^[\p{L} .'()/-]+,\s*[\p{L} .'()/-]+$/u.test(trimmed) || /^(remote|hybrid)$/i.test(trimmed);
}

function looksLikeTitle(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 80) return false;
  if (/\d{4}|@|https?:|www\./i.test(trimmed)) return false;
  if (trimmed.split(/\s+/).length > 9) return false;
  if (/^[-–—]/.test(trimmed)) return false;
  return /[A-Za-z\p{L}]/u.test(trimmed);
}

function classifyBullet(text: string): "responsibility" | "achievement" {
  return ACHIEVEMENT_RE.test(text) ? "achievement" : "responsibility";
}

function makeBullet(text: string): Bullet {
  return { id: uid("b"), text };
}

function parseEntryHeader(parts: string[]): {
  jobTitle: string;
  employer: string;
  location: string;
} {
  const cleaned = parts
    .map((part) =>
      part
        .replace(/\b(?:19|20)\d{2}\b/g, "")
        .replace(/\b(?:present|current|now|today)\b/gi, "")
        .replace(/[|·•,;]\s*$/g, "")
        .trim(),
    )
    .filter(Boolean);

  if (cleaned.length === 0) return { jobTitle: "", employer: "", location: "" };

  if (cleaned.length === 1) {
    const commaParts = cleaned[0]
      .split(/,\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (commaParts.length >= 2) {
      if (looksLikeLocation(commaParts[commaParts.length - 1])) {
        return {
          jobTitle: commaParts[0],
          employer: commaParts.slice(1, -1).join(", "),
          location: commaParts[commaParts.length - 1],
        };
      }
      return { jobTitle: commaParts[0], employer: commaParts.slice(1).join(", "), location: "" };
    }
    return { jobTitle: cleaned[0], employer: "", location: "" };
  }

  let location = "";
  let rest = cleaned;
  if (looksLikeLocation(rest[rest.length - 1])) {
    location = rest[rest.length - 1];
    rest = rest.slice(0, -1);
  }

  return {
    jobTitle: rest[0] ?? "",
    employer: rest.slice(1).join(" · "),
    location,
  };
}

function hasDateAhead(lines: string[], index: number, depth = 2): boolean {
  for (let offset = 1; offset <= depth; offset += 1) {
    const line = lines[index + offset];
    if (!line) return false;
    if (findDateRange(line)) return true;
  }
  return false;
}

function parseExperience(lines: string[]): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  let pendingHeader: string[] = [];
  let current: ExperienceEntry | null = null;

  const pushEntry = (
    headerParts: string[],
    range: ReturnType<typeof findDateRange>,
  ): ExperienceEntry | null => {
    if (!range) return null;
    const parsed = parseEntryHeader(headerParts);
    const entry: ExperienceEntry = {
      id: uid("exp"),
      jobTitle: parsed.jobTitle,
      employer: parsed.employer,
      location: parsed.location,
      startDate: range.start,
      endDate: range.end,
      current: range.current,
      responsibilities: [],
      achievements: [],
    };
    entries.push(entry);
    pendingHeader = [];
    return entry;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    const range = findDateRange(line);

    if (range) {
      const withoutDate = cleanLine(line.replace(range.raw, " ").replace(/\s*[|·•,;–—-]\s*$/g, ""));
      const header = [...pendingHeader.slice(-2), withoutDate].filter(Boolean);
      pendingHeader = [];
      current = pushEntry(header, range);
      continue;
    }

    if (!current) {
      pendingHeader.push(stripBullet(line));
      continue;
    }

    if (isLikelyBullet(line)) {
      const text = stripBullet(line);
      if (!text) continue;
      const bucket = classifyBullet(text);
      if (bucket === "achievement") current.achievements.push(makeBullet(text));
      else current.responsibilities.push(makeBullet(text));
      continue;
    }

    const text = stripBullet(line);
    if (!text) continue;

    if (hasDateAhead(lines, index) && looksLikeTitle(text)) {
      pendingHeader.push(text);
      continue;
    }

    const previous =
      current.responsibilities[current.responsibilities.length - 1] ??
      current.achievements[current.achievements.length - 1];

    if (
      previous &&
      previous.text.length > 0 &&
      !/[.!?;:]$/.test(previous.text) &&
      /^[a-z(]/.test(text) &&
      text.length > 12
    ) {
      previous.text = `${previous.text} ${text}`.replace(/\s+/g, " ");
    } else {
      const bucket = classifyBullet(text);
      if (bucket === "achievement") current.achievements.push(makeBullet(text));
      else current.responsibilities.push(makeBullet(text));
    }
  }

  // Fallback for sections without explicit dates: split on short title-like lines
  if (entries.length === 0) {
    let candidate: ExperienceEntry | null = null;
    for (const line of lines) {
      if (!line) continue;
      const text = stripBullet(line);
      if (!text) continue;
      if (!candidate && looksLikeTitle(text) && !isLikelyBullet(line)) {
        candidate = {
          id: uid("exp"),
          jobTitle: text,
          employer: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          responsibilities: [],
          achievements: [],
        };
        entries.push(candidate);
        continue;
      }
      if (candidate) {
        if (!candidate.employer && !isLikelyBullet(line) && text.length < 80) {
          candidate.employer = text;
          continue;
        }
        const bucket = classifyBullet(text);
        if (bucket === "achievement") candidate.achievements.push(makeBullet(text));
        else candidate.responsibilities.push(makeBullet(text));
      }
    }
  }

  return entries.filter(
    (entry) =>
      entry.jobTitle.trim() ||
      entry.employer.trim() ||
      entry.responsibilities.length > 0 ||
      entry.achievements.length > 0,
  );
}

function parseEducation(lines: string[]): EducationEntry[] {
  const entries: EducationEntry[] = [];
  let pendingHeader: string[] = [];
  let current: EducationEntry | null = null;

  const createEntry = (
    headerParts: string[],
    range: ReturnType<typeof findDateRange>,
  ): EducationEntry => {
    const parts = headerParts.flatMap((part) => splitParts(part)).filter(Boolean);
    let institution = "";
    let degree = "";
    let field = "";
    let location = "";

    for (const part of parts) {
      if (!institution && INSTITUTION_RE.test(part)) {
        institution = part;
        continue;
      }
      if (!degree && DEGREE_RE.test(part)) {
        degree = part;
        continue;
      }
      if (looksLikeLocation(part) && !location) {
        location = part;
        continue;
      }
      if (!field) {
        field = part;
        continue;
      }
      if (!institution) {
        institution = part;
      }
    }

    if (degree) {
      const inMatch = /\bin\s+(.+)$/i.exec(degree);
      if (inMatch && !field) {
        field = inMatch[1].trim();
        degree = degree.replace(/\s+in\s+.+$/i, "").trim();
      }
      const commaSplit = degree.split(/,\s+/);
      if (commaSplit.length > 1 && !field) {
        degree = commaSplit[0];
        field = commaSplit.slice(1).join(", ");
      }
    }

    if (!institution && parts.length > 0) institution = parts[0];

    const entry: EducationEntry = {
      id: uid("edu"),
      institution,
      degree,
      field,
      location,
      startDate: range?.start ?? "",
      endDate: range?.end ?? "",
      current: range?.current ?? false,
      description: "",
    };
    entries.push(entry);
    pendingHeader = [];
    return entry;
  };

  for (const line of lines) {
    if (!line) continue;
    const range = findDateRange(line);
    if (range) {
      const withoutDate = cleanLine(line.replace(range.raw, " "));

      // Common CV pattern: qualification line first, institution + dates next.
      if (current && !current.startDate && !current.endDate && pendingHeader.length === 0) {
        current.startDate = range.start;
        current.endDate = range.end;
        current.current = range.current;
        const parts = splitParts(withoutDate);
        for (const part of parts) {
          if (!current.institution && INSTITUTION_RE.test(part)) {
            current.institution = part;
          } else if (looksLikeLocation(part) && !current.location) {
            current.location = part;
          } else if (!current.field && DEGREE_RE.test(part)) {
            current.field = part;
          }
        }
        continue;
      }

      current = createEntry([...pendingHeader.slice(-2), withoutDate], range);
      continue;
    }

    const text = stripBullet(line).trim();
    if (!text) continue;

    const startsEntry = INSTITUTION_RE.test(text) || DEGREE_RE.test(text);
    if (startsEntry && current) {
      const hasContent = current.institution || current.degree || current.description;
      const looksNew = INSTITUTION_RE.test(text) || (hasContent && DEGREE_RE.test(text) && current.degree);
      if (looksNew) {
        current = null;
        pendingHeader = [];
      }
    }

    if (!current) {
      if (isLikelyBullet(line)) {
        const last = entries[entries.length - 1];
        if (last) last.description = `${last.description} ${text}`.trim();
        continue;
      }
      current = createEntry([text], null);
      continue;
    }

    if (isLikelyBullet(line)) {
      current.description = `${current.description} ${text}`.trim();
    } else if (!current.description && text.length > 40) {
      current.description = text;
    } else {
      current.description = `${current.description} ${text}`.trim();
    }
  }

  return entries.filter(
    (entry) => entry.institution.trim() || entry.degree.trim() || entry.field.trim(),
  );
}

function splitSkillItems(value: string): string[] {
  return value
    .split(/\s*[|·•;]\s*|\s*,\s*/)
    .map((item) => stripBullet(item).replace(/^[-–—:]+|[-–—:]+$/g, "").trim())
    .filter(Boolean);
}

function parseSkills(lines: string[]): SkillCategory[] {
  const categories: SkillCategory[] = [];
  let current: SkillCategory | null = null;

  const ensureCategory = (name = "Core skills") => {
    if (!current) {
      current = { id: uid("cat"), name, include: true, skills: [] };
      categories.push(current);
    }
    return current;
  };

  const addSkills = (items: string[], category = current) => {
    const target = category ?? ensureCategory();
    for (const item of items) {
      const name = item.trim();
      if (!name) continue;
      const exists = target.skills.some(
        (skill) => skill.name.toLowerCase() === name.toLowerCase(),
      );
      if (!exists) {
        target.skills.push({ id: uid("skill"), name, include: true, tasks: [] });
      }
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    const text = stripBullet(line);
    if (!text) continue;

    const colon = /^([^:]{2,48}):\s*(.+)$/.exec(text);
    if (colon) {
      const categoryName = colon[1].trim();
      current = { id: uid("cat"), name: categoryName, include: true, skills: [] };
      categories.push(current);
      addSkills(splitSkillItems(colon[2]));
      continue;
    }

    const nextLine = lines[index + 1];
    const nextIsBullet = Boolean(nextLine && isLikelyBullet(nextLine));
    const nextIsList = Boolean(
      nextLine &&
        !nextIsBullet &&
        splitSkillItems(stripBullet(nextLine)).length > 1,
    );
    const headerLike =
      text.length <= 36 &&
      !isLikelyBullet(line) &&
      !/,/.test(text) &&
      !/\band\b/i.test(text) &&
      (text.endsWith(":") || nextIsBullet || nextIsList);

    if (headerLike) {
      current = { id: uid("cat"), name: text.replace(/:$/, ""), include: true, skills: [] };
      categories.push(current);
      continue;
    }

    if (isLikelyBullet(line)) {
      const category = ensureCategory();
      addSkills([text], category);
      continue;
    }

    const items = splitSkillItems(text);
    if (items.length > 1) {
      const category = ensureCategory();
      addSkills(items, category);
    } else {
      const category = ensureCategory();
      addSkills(items, category);
    }
  }

  return categories
    .map((category) => ({
      ...category,
      name: category.name.trim() || "Core skills",
    }))
    .filter((category) => category.skills.length > 0 || category.name.trim());
}

interface AdditionalChunk {
  kind: AdditionalKind;
  title: string;
  lines: string[];
}

function parseAdditional(lines: string[]): AdditionalSection[] {
  const chunks: AdditionalChunk[] = [];
  let current: AdditionalChunk = { kind: "custom", title: "Additional information", lines: [] };
  chunks.push(current);

  for (const line of lines) {
    if (!line) continue;
    const marker = /^__SECTION__:([a-z]+):(.+)$/i.exec(line);
    if (marker) {
      const kind = marker[1] as AdditionalKind;
      current = { kind, title: marker[2].trim(), lines: [] };
      chunks.push(current);
      continue;
    }
    current.lines.push(line);
  }

  const sections: AdditionalSection[] = [];

  for (const chunk of chunks) {
    const items = chunk.lines
      .map((line) => stripBullet(line).trim())
      .filter(Boolean)
      .map((line) => {
        const paren = /^(.+?)\s*\(([^)]+)\)\s*$/.exec(line);
        if (paren) {
          return {
            id: uid("item"),
            title: paren[1].trim(),
            subtitle: paren[2].trim(),
            text: "",
            link: "",
          };
        }

        const dash = /^(.+?)\s+[-–—]\s+(.+)$/.exec(line);
        if (dash) {
          const title = dash[1].trim();
          const rest = dash[2].trim();
          const isYear = /^(?:19|20)\d{2}(?:\s*[-–—]\s*(?:(?:19|20)\d{2}|present))?$/i.test(rest);
          return {
            id: uid("item"),
            title,
            subtitle: isYear ? rest : "",
            text: isYear ? "" : rest,
            link: "",
          };
        }

        const colon = /^([^:]{2,60}):\s*(.+)$/.exec(line);
        if (colon) {
          return {
            id: uid("item"),
            title: colon[1].trim(),
            subtitle: colon[2].trim(),
            text: "",
            link: "",
          };
        }

        return {
          id: uid("item"),
          title: line,
          subtitle: "",
          text: "",
          link: "",
        };
      })
      .filter((item) => item.title || item.text);

    if (items.length > 0) {
      sections.push({
        id: uid("add"),
        kind: chunk.kind,
        title: chunk.title,
        include: true,
        items,
      });
    }
  }

  return sections;
}

function extractContacts(allLines: string[]) {
  const text = allLines.join("\n");
  const email = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.exec(text)?.[0] ?? "";

  const linkedin =
    /\b(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[^\s|,;)]+/i.exec(text)?.[0] ?? "";

  const urlMatches = text.match(/\b(?:https?:\/\/|www\.)[^\s|,;)]+/gi) ?? [];
  const website =
    urlMatches.find((url) => !/linkedin\.com/i.test(url) && !/mailto:/i.test(url)) ?? "";

  let phone = "";
  for (const line of allLines) {
    if (/\b(?:19|20)\d{2}\b/.test(line) && /[-–—]/.test(line)) continue;
    // Remove email addresses first so a phone number on the same line is still found.
    const withoutEmail = line.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      " ",
    );
    const candidate = /(?:\+?\d[\d\s().-]{7,}\d)/.exec(withoutEmail)?.[0];
    if (!candidate) continue;
    const digits = candidate.replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 16) {
      phone = candidate.trim();
      break;
    }
  }

  return {
    email,
    phone,
    linkedin: linkedin.replace(/[).,;]+$/, ""),
    website: website.replace(/[).,;]+$/, ""),
  };
}

function pickName(headerLines: string[], email: string): { name: string; index: number } {
  const candidates = headerLines.slice(0, 6);
  const generic = /^(curriculum vitae|resume|résumé|personal details|contact)$/i;

  for (let index = 0; index < candidates.length; index += 1) {
    const raw = candidates[index];
    if (!raw) continue;
    const line = cleanLine(raw.split(/\s+[|·•]\s+/)[0]);
    if (!line || generic.test(line)) continue;
    if (line.length > 64) continue;
    if (/@|https?:|www\.|linkedin\.com|\d{3}/i.test(line)) continue;
    if (DEGREE_RE.test(line)) continue;
    if (detectSection(line)) continue;

    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 6) continue;
    if (!/^[\p{L}][\p{L}\s.'’-]*$/u.test(line)) continue;
    if (line === email) continue;

    // Multi-column PDFs can repeat a name fragment on the same extracted line.
    const deduped = words.filter(
      (word, wordIndex) => wordIndex === 0 || word.toLowerCase() !== words[wordIndex - 1].toLowerCase(),
    );
    return { name: deduped.join(" "), index };
  }

  return { name: "", index: -1 };
}

function pickTitle(headerLines: string[], nameIndex: number): string {
  for (let index = nameIndex + 1; index < Math.min(headerLines.length, nameIndex + 4); index += 1) {
    const line = headerLines[index];
    if (!line) continue;
    if (/@|https?:|www\.|linkedin\.com|\+\d/i.test(line)) continue;
    if (/\b(?:19|20)\d{2}\b/.test(line)) continue;
    if (detectSection(line)) continue;
    const titleTokens = line.split(/\s+/).filter(Boolean);
    if (titleTokens.length > 10) continue;
    // Skip letter-spaced headings that would otherwise become "O P E R A T I O N S".
    if (
      titleTokens.length >= 4 &&
      titleTokens.filter((token) => token.length === 1).length / titleTokens.length >= 0.7
    ) {
      continue;
    }
    if (looksLikeLocation(line)) continue;
    const candidate = line.split(/\s+[|·•]\s+/)[0];
    if (candidate.length >= 3 && candidate.length <= 80) return candidate;
  }
  return "";
}

function pickLocation(headerLines: string[]): string {
  for (const line of headerLines) {
    const labelled = /\b(?:location|based in|address)\s*[:\-]\s*(.+)$/i.exec(line);
    if (labelled) return labelled[1].trim();
  }

  for (const line of headerLines) {
    const parts = line
      .split(/\s+[|·•]\s+|\s{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
    for (const part of parts) {
      if (looksLikeLocation(part) && part.length < 48) return part;
    }
  }

  return "";
}

export function parseCvText(rawText: string): ParseResult {
  const normalized = rawText
    .replace(/\r\n?/g, "\n")
    .replace(/\u000c/g, "\n")
    .replace(/[ \t]+\n/g, "\n");

  const lines = normalized
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length > 0);

  const warnings: string[] = [];
  const chunks = splitSections(lines);

  const headerChunk = chunks.find((chunk) => chunk.key === "header");
  const headerLines = headerChunk?.lines ?? [];

  const contacts = extractContacts(lines);
  const { name, index: nameIndex } = pickName(
    headerLines.length > 0 ? headerLines : lines.slice(0, 8),
    contacts.email,
  );
  const title = pickTitle(
    headerLines.length > 0 ? headerLines : lines.slice(0, 8),
    nameIndex,
  );
  const location = pickLocation(headerLines);

  const summaryLines = chunks
    .filter((chunk) => chunk.key === "summary")
    .flatMap((chunk) => chunk.lines)
    .map((line) => stripBullet(line))
    .filter(Boolean);
  const summary = summaryLines.join(" ").replace(/\s+/g, " ").trim();

  const experienceLines = chunks
    .filter((chunk) => chunk.key === "experience")
    .flatMap((chunk) => chunk.lines);
  const educationLines = chunks
    .filter((chunk) => chunk.key === "education")
    .flatMap((chunk) => chunk.lines);
  const skillLines = chunks
    .filter((chunk) => chunk.key === "skills")
    .flatMap((chunk) => chunk.lines);
  const additionalLines = chunks
    .filter((chunk) => chunk.key === "additional")
    .flatMap((chunk) => chunk.lines);

  let experience = parseExperience(experienceLines);
  const education = parseEducation(educationLines);
  const skills = parseSkills(skillLines);
  const additional = parseAdditional(additionalLines);

  // If no section headings were found at all, try the whole body with conservative heuristics.
  const noSections = chunks.length === 1;
  if (noSections && lines.length > 3) {
    const body = lines.slice(Math.max(1, nameIndex + 1));
    if (body.length > 0) {
      const fallbackExperience = parseExperience(body);
      if (fallbackExperience.length > 0) experience = fallbackExperience;
    }
    warnings.push(
      "We could not detect clear section headings. The text was placed into the closest sections — please review everything.",
    );
  }

  if (experience.length === 0 && experienceLines.length > 0) {
    warnings.push("Work experience text was found, but its layout was difficult to split into roles.");
  }
  if (education.length === 0 && educationLines.length > 0) {
    warnings.push("Education text was found, but it could not be split into separate entries.");
  }
  if (skills.length === 0 && skillLines.length > 0) {
    warnings.push("Skills text was found, but it could not be grouped.");
  }

  const data: CvData = {
    personal: {
      fullName: name,
      professionalTitle: title,
      email: contacts.email,
      phone: contacts.phone,
      location,
      linkedin: contacts.linkedin,
      website: contacts.website,
      summary,
    },
    experience,
    education,
    skills,
    additional,
  };

  if (!name) {
    warnings.push("We could not confidently identify a name. Add it in Personal Details.");
  }
  if (!contacts.email && !contacts.phone) {
    warnings.push("No email or phone number was detected. Add your preferred contact details.");
  }

  const detected = {
    name: Boolean(name),
    title: Boolean(title),
    summary: Boolean(summary),
    experience: experience.length,
    education: education.length,
    skills: skills.filter((category) => category.skills.length > 0).length,
    additional: additional.length,
  };

  let confidence = 0;
  if (detected.name) confidence += 18;
  if (detected.title) confidence += 7;
  if (detected.summary) confidence += 15;
  if (detected.experience > 0) confidence += 25;
  if (detected.education > 0) confidence += 15;
  if (detected.skills > 0) confidence += 12;
  if (detected.additional > 0) confidence += 8;

  return {
    data,
    warnings,
    confidence: Math.min(100, confidence),
    detected,
  };
}
