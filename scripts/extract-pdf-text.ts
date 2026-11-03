import fs from "node:fs";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { assemblePageText, type PdfTextItem } from "../src/lib/cv/pdf-layout";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/extract-pdf-text.ts <file.pdf>");
  process.exit(1);
}

async function main() {
  const data = new Uint8Array(fs.readFileSync(file));
  const document = await getDocument({ data, useSystemFonts: true } as never).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.filter(
      (item) => "str" in item && typeof (item as PdfTextItem).str === "string",
    ) as unknown as PdfTextItem[];
    const viewport = page.getViewport({ scale: 1 });
    pages.push(assemblePageText(items, viewport.width).text);
  }

  process.stdout.write(pages.join("\n\n"));
}

void main();
