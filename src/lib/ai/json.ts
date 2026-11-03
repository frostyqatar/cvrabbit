/**
 * LLM JSON is not always perfect: it can arrive inside a code fence, with a
 * sentence before it, with unescaped newlines, with trailing commas, or cut
 * short by an output-token limit. This module tries hard to recover a usable
 * object instead of throwing away a good answer.
 */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stripCodeFence(text: string): string {
  const fenced = /```(?:json|JSON)?\s*([\s\S]*?)```/.exec(text);
  if (fenced?.[1]) return fenced[1].trim();
  return text.trim();
}

function extractBraces(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

/** Escape raw newlines/tabs that appear inside JSON strings. */
function escapeControlCharsInStrings(text: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (const char of text) {
    if (inString) {
      if (escaped) {
        output += char;
        escaped = false;
        continue;
      }
      if (char === "\\") {
        output += char;
        escaped = true;
        continue;
      }
      if (char === '"') {
        output += char;
        inString = false;
        continue;
      }
      if (char === "\n") {
        output += "\\n";
        continue;
      }
      if (char === "\r") {
        output += "\\r";
        continue;
      }
      if (char === "\t") {
        output += "\\t";
        continue;
      }
      output += char;
      continue;
    }

    if (char === '"') inString = true;
    output += char;
  }

  return output;
}

function removeTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, "$1");
}

/**
 * Close a truncated JSON document. This keeps every complete field and the
 * complete part of the final string, which is better than discarding the whole
 * answer — the user reviews every field anyway.
 */
function closeTruncatedJson(text: string): string {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (const char of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") stack.push("}");
    else if (char === "[") stack.push("]");
    else if (char === "}" || char === "]") stack.pop();
  }

  let output = text.trimEnd();

  // Drop a dangling key with no value, e.g. `"email":` at the cut point.
  output = output.replace(/,\s*"[^"]*"\s*:\s*$/, "");
  output = output.replace(/,\s*$/, "");

  if (inString) output += '"';

  while (stack.length > 0) output += stack.pop();

  return output;
}

function tryParse(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function unwrapCv(value: unknown): unknown {
  if (Array.isArray(value)) {
    const object = value.find((item) => isRecord(item));
    return object ? unwrapCv(object) : value;
  }

  if (!isRecord(value)) return value;

  const looksLikeCv = (candidate: UnknownRecord) =>
    "personal" in candidate ||
    "experience" in candidate ||
    "education" in candidate ||
    "skills" in candidate;

  if (looksLikeCv(value)) return value;

  for (const key of ["cv", "cvData", "cv_data", "resume", "result", "output", "data"]) {
    const candidate = value[key];
    if (isRecord(candidate) && looksLikeCv(candidate)) return candidate;
  }

  // A single wrapper object whose only value is the CV object.
  const nested = Object.values(value).filter(isRecord);
  if (nested.length === 1 && looksLikeCv(nested[0])) return nested[0];

  return value;
}

export function parseAiJson(raw: string): unknown {
  const cleaned = raw.replace(/^\uFEFF/, "").trim();
  if (!cleaned) throw new Error("empty_response");

  const candidates: string[] = [];
  const fenced = stripCodeFence(cleaned);
  candidates.push(cleaned, fenced, extractBraces(fenced), escapeControlCharsInStrings(fenced));

  for (const candidate of candidates) {
    const direct = tryParse(candidate);
    if (direct !== undefined) return unwrapCv(direct);

    const noTrailing = removeTrailingCommas(candidate);
    const parsedNoTrailing = tryParse(noTrailing);
    if (parsedNoTrailing !== undefined) return unwrapCv(parsedNoTrailing);

    const closed = removeTrailingCommas(closeTruncatedJson(noTrailing));
    const parsedClosed = tryParse(closed);
    if (parsedClosed !== undefined) return unwrapCv(parsedClosed);
  }

  throw new Error("invalid_json");
}
