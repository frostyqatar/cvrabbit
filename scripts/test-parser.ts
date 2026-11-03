import fs from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { parseCvText } from "../src/lib/cv/parse";
import { assemblePageText, type PdfTextItem } from "../src/lib/cv/pdf-layout";

async function extract(file: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await getDocument({ data, useSystemFonts: true } as never).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.filter(
      (item) => "str" in item && typeof (item as PdfTextItem).str === "string",
    ) as unknown as PdfTextItem[];

    const viewport = page.getViewport({ scale: 1 });
    const assembled = assemblePageText(items, viewport.width);
    pages.push(assembled.text);
  }

  return pages.join("\n\n").trim();
}

const cases = [
  {
    file: "fixtures/simple-cv.pdf",
    name: "Jordan Ellis",
    minExperience: 1,
    minEducation: 1,
    minSkills: 1,
    minAdditional: 0,
  },
  {
    file: "fixtures/detailed-cv.pdf",
    name: "Priya Nair",
    minExperience: 3,
    minEducation: 2,
    minSkills: 2,
    minAdditional: 2,
  },
  {
    file: "fixtures/long-cv.pdf",
    name: "Marcus Delacroix",
    minExperience: 4,
    minEducation: 2,
    minSkills: 2,
    minAdditional: 4,
  },
  {
    file: "fixtures/two-column-cv.pdf",
    name: "Elena Vasquez",
    minExperience: 2,
    minEducation: 1,
    minSkills: 1,
    minAdditional: 0,
  },
];

async function main() {
let failures = 0;

for (const testCase of cases) {
  const text = await extract(testCase.file);
  fs.writeFileSync(
    path.join("fixtures", `${path.basename(testCase.file, ".pdf")}.txt`),
    text,
  );

  const result = parseCvText(text);
  const counts = {
    experience: result.data.experience.length,
    education: result.data.education.length,
    skills: result.data.skills.length,
    additional: result.data.additional.length,
  };

  console.log(`\n=== ${testCase.file} ===`);
  console.log(`name: "${result.data.personal.fullName}"`);
  console.log(`title: "${result.data.personal.professionalTitle}"`);
  console.log(`email: "${result.data.personal.email}"  phone: "${result.data.personal.phone}"`);
  console.log(`counts: ${JSON.stringify(counts)}  confidence: ${result.confidence}%`);
  console.log(`warnings: ${result.warnings.length ? result.warnings.join(" | ") : "none"}`);

  const check = (label: string, actual: number, expected: number) => {
    if (actual < expected) {
      console.error(`  FAIL ${label}: expected >= ${expected}, got ${actual}`);
      failures += 1;
    } else {
      console.log(`  ok ${label}: ${actual}`);
    }
  };

  if (!result.data.personal.fullName.toLowerCase().includes(testCase.name.toLowerCase())) {
    console.error(`  FAIL name: expected "${testCase.name}", got "${result.data.personal.fullName}"`);
    failures += 1;
  } else {
    console.log(`  ok name`);
  }
  check("experience", counts.experience, testCase.minExperience);
  check("education", counts.education, testCase.minEducation);
  check("skills", counts.skills, testCase.minSkills);
  check("additional", counts.additional, testCase.minAdditional);

  if (result.data.experience.length > 0) {
    console.log(
      `  first role: ${JSON.stringify({
        title: result.data.experience[0].jobTitle,
        employer: result.data.experience[0].employer,
        dates: [result.data.experience[0].startDate, result.data.experience[0].endDate],
        bullets: result.data.experience[0].responsibilities.length + result.data.experience[0].achievements.length,
      })}`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} parser assertion(s) failed.`);
  process.exit(1);
}

console.log("\nAll parser fixture checks passed.");
}

void main();
