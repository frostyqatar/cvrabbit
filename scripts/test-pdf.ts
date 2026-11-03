import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { Font, renderToBuffer } from "@react-pdf/renderer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { CvDocument } from "../src/components/templates/cv-document";
import { createEmptyData } from "../src/lib/cv/defaults";
import { MINIMAL_SAMPLE_DATA, SAMPLE_DATA, SAMPLE_SETTINGS } from "../src/lib/cv/sample";
import { TEMPLATE_IDS, type CvSettings } from "../src/lib/cv/types";

const outDir = path.resolve("test-output", "pdfs");
fs.mkdirSync(outDir, { recursive: true });

const fontDir = path.resolve("public", "fonts");
const font = (name: string) => path.join(fontDir, name);

Font.register({
  family: "Lato",
  fonts: [
    { src: font("lato-regular.ttf"), fontWeight: 400 },
    { src: font("lato-medium.ttf"), fontWeight: 500 },
    { src: font("lato-semibold.ttf"), fontWeight: 600 },
    { src: font("lato-bold.ttf"), fontWeight: 700 },
    { src: font("lato-italic.ttf"), fontWeight: 400, fontStyle: "italic" },
  ],
});
Font.register({
  family: "Spectral",
  fonts: [
    { src: font("spectral-regular.ttf"), fontWeight: 400 },
    { src: font("spectral-medium.ttf"), fontWeight: 500 },
    { src: font("spectral-semibold.ttf"), fontWeight: 600 },
    { src: font("spectral-bold.ttf"), fontWeight: 700 },
    { src: font("spectral-italic.ttf"), fontWeight: 400, fontStyle: "italic" },
  ],
});
Font.register({
  family: "Crimson",
  fonts: [
    { src: font("crimson-regular.ttf"), fontWeight: 400 },
    { src: font("crimson-semibold.ttf"), fontWeight: 600 },
    { src: font("crimson-bold.ttf"), fontWeight: 700 },
    { src: font("crimson-italic.ttf"), fontWeight: 400, fontStyle: "italic" },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

async function render(name: string, data = SAMPLE_DATA, settings: CvSettings = SAMPLE_SETTINGS) {
  const buffer = await renderToBuffer(
    createElement(CvDocument, { data, settings }) as never,
  );
  const file = path.join(outDir, `${name}.pdf`);
  fs.writeFileSync(file, buffer);
  return file;
}

async function inspect(file: string) {
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await getDocument({ data, useSystemFonts: true } as never).promise;
  const pages: Array<{ text: string; width: number; height: number; links: number }> = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const text = content.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ");
    const annotations = await page.getAnnotations();
    pages.push({
      text,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      links: annotations.filter((annotation) => Boolean((annotation as { url?: string }).url)).length,
    });
  }

  return { numPages: doc.numPages, pages };
}

let failures = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ok ${message}`);
  } else {
    console.error(`  FAIL ${message}`);
    failures += 1;
  }
}

async function main() {
  const results: Array<{ template: string; pages: number }> = [];

  for (const template of TEMPLATE_IDS) {
    const settings: CvSettings = { ...SAMPLE_SETTINGS, templateId: template };
    const file = await render(`template-${template}`, SAMPLE_DATA, settings);
    const info = await inspect(file);
    results.push({ template, pages: info.numPages });
    const allText = info.pages.map((page) => page.text).join(" ");

    console.log(`\n=== ${template} (${info.numPages} pages) ===`);
    console.log(`  size: ${info.pages[0]?.width} × ${info.pages[0]?.height} pt`);
    console.log(`  links on first page: ${info.pages[0]?.links}`);

    assert(info.pages.every((page) => page.width === 595 && page.height === 842), "A4 page size");
    assert(info.numPages >= 1, "has at least one page");
    assert(allText.includes("Amara Okafor"), "contains name");
    assert(allText.includes("Senior Product Manager"), "contains title");
    assert(allText.includes("Northwind Financial"), "contains employer");
    assert(allText.includes("amara.okafor@example.com"), "contains email");
    assert(allText.includes("Redesigned account opening"), "contains achievement text");
    assert(allText.includes("Certified Scrum Product Owner"), "contains additional section content");
    assert(allText.includes("Associate Product Manager"), "contains the final role");
    assert(allText.includes("University of Lagos"), "contains the final education entry");
    assert(allText.includes("Mentor, Women in Product UK"), "contains volunteering content");
    assert(allText.includes("French"), "contains languages content");
    assert(!allText.includes("undefined"), "no undefined placeholders");
    assert(!allText.includes("[object Object]"), "no object placeholders");
    assert(
      info.pages.every((page) => page.text.trim().length > 20),
      "every page has readable text",
    );
    assert(
      info.pages.some((page) => page.links > 0),
      "preserves at least one link annotation",
    );
  }

  console.log("\n=== density comparison ===");
  const comfortable = results.find((item) => item.template === "classic")?.pages ?? 0;
  const compactFile = await render("template-classic-compact", SAMPLE_DATA, {
    ...SAMPLE_SETTINGS,
    density: "compact",
  });
  const compactInfo = await inspect(compactFile);
  console.log(`  comfortable: ${comfortable} pages; compact: ${compactInfo.numPages} pages`);
  assert(compactInfo.numPages <= comfortable, "compact density does not add pages");

  console.log("\n=== minimal data ===");
  const minimalFile = await render("minimal", MINIMAL_SAMPLE_DATA, {
    ...SAMPLE_SETTINGS,
    templateId: "modern",
  });
  const minimalInfo = await inspect(minimalFile);
  const minimalText = minimalInfo.pages.map((page) => page.text).join(" ");
  console.log(`  pages: ${minimalInfo.numPages}`);
  assert(minimalText.includes("Jonah Reed"), "minimal CV contains name");
  assert(minimalText.includes("Cedar & Pine Logistics"), "minimal CV contains employer");
  assert(minimalInfo.numPages >= 1, "minimal CV renders");

  console.log("\n=== empty data ===");
  const emptyFile = await render("empty", createEmptyData(), SAMPLE_SETTINGS);
  const emptyInfo = await inspect(emptyFile);
  console.log(`  pages: ${emptyInfo.numPages}, text: "${emptyInfo.pages[0]?.text.trim()}"`);
  assert(emptyInfo.numPages === 1, "empty CV renders one page without crashing");

  console.log("\n=== summary ===");
  for (const result of results) {
    console.log(`  ${result.template}: ${result.pages} pages`);
  }

  if (failures > 0) {
    console.error(`\n${failures} PDF assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll PDF checks passed.");
}

void main();
