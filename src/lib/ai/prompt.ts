export const AI_MAX_INPUT_CHARS = 48_000;
export const AI_MAX_OUTPUT_TOKENS = 12_000;
export const AI_REQUEST_TIMEOUT_MS = 90_000;

const SYSTEM_PROMPT = `You are CVRabbit's CV structuring engine. You turn raw text extracted from a CV into clean, structured JSON that a human will review.

NON-NEGOTIABLE RULES
1. Preserve every fact exactly: names, email addresses, phone numbers, URLs, employers, job titles, locations, institutions, degrees, dates, certification names, numbers and metrics. Never invent, guess, embellish or add information that is not in the source text.
2. You may only improve language. Turn fragments into complete, professional statements, use strong action verbs, remove first-person pronouns and filler, keep one idea per bullet, and stay faithful to the original meaning.
3. If a detail is missing, use an empty string or an empty array. Never write "N/A", "Unknown", "Not provided" or any placeholder.
4. Keep the original spelling convention (British or American English) and never translate proper nouns.
5. Return one JSON object only. No markdown, no code fences, no commentary.

EDITORIAL STANDARD
- Personal summary: 2–4 sentences, 45–90 words, no first-person pronouns. It must be a factual synthesis of the CV: seniority, domains, strongest capabilities and supporting evidence. Avoid clichés such as "passionate", "results-driven", "dynamic professional" or "proven track record". Do not add adjectives the source does not support. If the CV has no profile or summary material, build a short factual one from the roles and skills that are present; if there is not enough material, return an empty string.
- Experience bullets: one responsibility or achievement per bullet, at most 30 words, starting with a strong past-tense verb, or present tense for a current role. Keep every metric and outcome the source contains; never invent a number. Merge lines that were split by the PDF layout and remove duplicated bullets. Drop headings such as "Key Responsibilities", "Projects", "Responsibilities:".
- Experience ordering: most recent first. Use the employer's name in employer and the city/country in location. If the source only has a combined line, split it sensibly without guessing.
- Skills: 3–8 categories maximum, each with short sub-skill names. Only include skills evidenced in the source. Use "tasks" only when the source describes what was done with that skill.
- Education: institution, degree, field of study, location and dates. Put honours, thesis titles, modules or notes in description. Most recent first.
- Additional sections: certifications, courses/training, awards, languages, volunteering, memberships, projects. Preserve full names, issuers and dates. Every item needs a non-empty title.
- Dates: use "YYYY-MM" when the month is known, "YYYY" when only the year is known, and "" when absent. Set current=true only when the source says present, current, now, ongoing or today. Never invent an end date.
- Contact details: copy email and URLs exactly. A phone number may be reformatted for readability, but keep every digit.
- Names: if the CV contains both a Latin-script name and an Arabic-script name, use the Latin-script name in fullName. If only one script exists, use it.
- The extracted text may contain broken lines, hyphenation, repeated headers, letter-spaced headings (for example "E X P E R I E N C E"), columns merged in the wrong order, or a name split across lines. Reconstruct the intended structure; do not treat layout artefacts as content.

OUTPUT SHAPE
{
  "personal": {
    "fullName": "",
    "professionalTitle": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "website": "",
    "summary": ""
  },
  "experience": [
    {
      "jobTitle": "",
      "employer": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "responsibilities": ["..."],
      "achievements": ["..."]
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "description": ""
    }
  ],
  "skills": [
    {
      "name": "",
      "skills": [{ "name": "", "tasks": ["..."] }]
    }
  ],
  "additional": [
    {
      "kind": "certifications",
      "title": "",
      "items": [{ "title": "", "subtitle": "", "text": "", "link": "" }]
    }
  ]
}

"kind" must be one of: certifications, projects, languages, awards, volunteering, memberships, custom.
Use "courses" or "training" content inside a certifications section unless the source clearly separates them.
Keep the JSON compact. Do not include ids, timestamps or fields that are not in the shape above.`;

export function prepareCvText(raw: string): { text: string; truncated: boolean; originalChars: number } {
  const cleaned = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const originalChars = cleaned.length;
  if (originalChars <= AI_MAX_INPUT_CHARS) {
    return { text: cleaned, truncated: false, originalChars };
  }

  return {
    text: cleaned.slice(0, AI_MAX_INPUT_CHARS),
    truncated: true,
    originalChars,
  };
}

export function buildCvMessages(text: string, truncated: boolean) {
  const note = truncated
    ? "\n\nNOTE: The document was longer than the input limit, so the tail was omitted. Structure what is present and do not invent the missing part."
    : "";

  const user = `Convert the CV text below into the JSON shape from your instructions.

The text was extracted from a PDF or DOCX, so expect layout artefacts: wrapped lines, standalone bullet markers, letter-spaced headings, page numbers, and columns read out of order. Reconstruct the intended structure, but do not add any fact that is not present.

<cv_text>
${text}
</cv_text>${note}`;

  return { system: SYSTEM_PROMPT, user };
}

/** Rough token estimate for transparency in the UI (4 characters ≈ 1 token). */
export function estimateTokens(characters: number): number {
  return Math.ceil(characters / 4);
}
