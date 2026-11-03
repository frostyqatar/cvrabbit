import fs from "node:fs";

import { parseCvText } from "../src/lib/cv/parse";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/inspect-cv.ts <extracted-text-file>");
  process.exit(1);
}

const text = fs.readFileSync(file, "utf8");
const result = parseCvText(text);

console.log(
  JSON.stringify(
    {
      personal: {
        fullName: result.data.personal.fullName,
        professionalTitle: result.data.personal.professionalTitle,
        email: result.data.personal.email,
        phone: result.data.personal.phone,
        location: result.data.personal.location,
        summaryLength: result.data.personal.summary.length,
        summaryStart: result.data.personal.summary.slice(0, 120),
      },
      counts: {
        experience: result.data.experience.length,
        education: result.data.education.length,
        skills: result.data.skills.length,
        additional: result.data.additional.length,
        additionalItems: result.data.additional.reduce(
          (total, section) => total + section.items.length,
          0,
        ),
      },
      experience: result.data.experience.map((entry) => ({
        title: entry.jobTitle,
        employer: entry.employer,
        dates: [entry.startDate, entry.endDate],
        responsibilities: entry.responsibilities.length,
        achievements: entry.achievements.length,
      })),
      education: result.data.education.map((entry) => ({
        institution: entry.institution,
        degree: entry.degree,
        field: entry.field,
        location: entry.location,
        dates: [entry.startDate, entry.endDate],
      })),
      skills: result.data.skills.map((category) => ({
        name: category.name,
        skills: category.skills.map((skill) => skill.name),
      })),
      additional: result.data.additional.map((section) => ({
        title: section.title,
        kind: section.kind,
        items: section.items.length,
        sample: section.items.slice(0, 3).map((item) => ({
          title: item.title,
          subtitle: item.subtitle,
          text: item.text,
        })),
      })),
      warnings: result.warnings,
      confidence: result.confidence,
    },
    null,
    2,
  ),
);
