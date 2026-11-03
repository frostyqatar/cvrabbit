"use client";

import { assemblePageText, type PdfTextItem } from "./pdf-layout";

export interface ExtractionOutput {
  text: string;
  links: string[];
  pageCount: number;
  layout: "simple" | "complex";
  warnings: string[];
  kind: "pdf" | "docx";
}

const MAX_BYTES = 15 * 1024 * 1024;

export function validateCvFile(file: File): { ok: true; kind: "pdf" | "docx" } | { ok: false; message: string } {
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx");

  if (!isPdf && !isDocx) {
    if (name.endsWith(".doc")) {
      return {
        ok: false,
        message: "Older .doc files are not supported. Save the file as .docx or PDF and try again.",
      };
    }
    return { ok: false, message: "Please upload a PDF or DOCX file." };
  }

  if (file.size === 0) {
    return { ok: false, message: "That file appears to be empty." };
  }

  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 15 MB.`,
    };
  }

  return { ok: true, kind: isPdf ? "pdf" : "docx" };
}


async function extractPdf(file: File): Promise<ExtractionOutput> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.extract.min.mjs";

  const buffer = await file.arrayBuffer();

  let document: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    document = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    }).promise;
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "PasswordException") {
      throw new Error("This PDF is password-protected. Remove the password and try again.");
    }
    throw new Error("We could not open this PDF. It may be damaged or use an unsupported format.");
  }

  const pages: string[] = [];
  const links = new Set<string>();
  let complex = false;

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items.filter(
      (item) => "str" in item && typeof item.str === "string",
    ) as unknown as PdfTextItem[];

    const pageText = assemblePageText(items, viewport.width);
    complex = complex || pageText.complex;
    pages.push(pageText.text);

    try {
      const annotations = await page.getAnnotations();
      for (const annotation of annotations) {
        const url = (annotation as { url?: string; unsafeUrl?: string }).url ??
          (annotation as { unsafeUrl?: string }).unsafeUrl;
        if (url && /^https?:\/\//i.test(url)) links.add(url);
      }
    } catch {
      // Link extraction is a nice-to-have.
    }
  }

  const text = pages.join("\n\n").trim();
  const warnings: string[] = [];

  if (text.replace(/\s/g, "").length < 40) {
    warnings.push(
      "Very little text was found. This may be a scanned PDF —” your file is kept, and you can enter details manually.",
    );
  }
  if (complex) {
    warnings.push(
      "This CV appears to use a multi-column layout. Check that each section was organised the way you expect.",
    );
  }

  return {
    text,
    links: [...links],
    pageCount: document.numPages,
    layout: complex ? "complex" : "simple",
    warnings,
    kind: "pdf",
  };
}

async function extractDocx(file: File): Promise<ExtractionOutput> {
  const buffer = await file.arrayBuffer();
  const imported = (await import("mammoth")) as unknown as {
    default?: { extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> };
    extractRawText?: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };
  const mammoth = imported.default ?? imported;

  if (!mammoth?.extractRawText) {
    throw new Error("The DOCX reader could not be loaded.");
  }

  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const text = result.value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const warnings: string[] = [];

  if (text.replace(/\s/g, "").length < 40) {
    warnings.push("This document contains very little text. You can fill in the sections manually.");
  }

  return {
    text,
    links: [],
    pageCount: 0,
    layout: "simple",
    warnings,
    kind: "docx",
  };
}

export async function extractCvFile(
  file: File,
  onProgress?: (message: string) => void,
): Promise<ExtractionOutput> {
  const validation = validateCvFile(file);
  if (!validation.ok) throw new Error(validation.message);

  onProgress?.(
    validation.kind === "pdf" ? "Reading the PDF on your device…" : "Reading the DOCX on your device…",
  );

  if (validation.kind === "pdf") return extractPdf(file);
  return extractDocx(file);
}

export async function extractTextFromFile(file: File, onProgress?: (message: string) => void) {
  const output = await extractCvFile(file, onProgress);
  return output.text;
}

export const MAX_UPLOAD_BYTES = MAX_BYTES;
