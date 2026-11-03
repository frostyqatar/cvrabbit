"use client";

import { Font } from "@react-pdf/renderer";

import type { FontId } from "@/lib/cv/types";

let registered = false;

export function registerPdfFonts() {
  if (registered || typeof window === "undefined") return;
  registered = true;

  Font.register({
    family: "Lato",
    fonts: [
      { src: "/fonts/lato-regular.ttf", fontWeight: 400 },
      { src: "/fonts/lato-medium.ttf", fontWeight: 500 },
      { src: "/fonts/lato-semibold.ttf", fontWeight: 600 },
      { src: "/fonts/lato-bold.ttf", fontWeight: 700 },
      { src: "/fonts/lato-italic.ttf", fontWeight: 400, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: "Spectral",
    fonts: [
      { src: "/fonts/spectral-regular.ttf", fontWeight: 400 },
      { src: "/fonts/spectral-medium.ttf", fontWeight: 500 },
      { src: "/fonts/spectral-semibold.ttf", fontWeight: 600 },
      { src: "/fonts/spectral-bold.ttf", fontWeight: 700 },
      { src: "/fonts/spectral-italic.ttf", fontWeight: 400, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: "Crimson",
    fonts: [
      { src: "/fonts/crimson-regular.ttf", fontWeight: 400 },
      { src: "/fonts/crimson-semibold.ttf", fontWeight: 600 },
      { src: "/fonts/crimson-bold.ttf", fontWeight: 700 },
      { src: "/fonts/crimson-italic.ttf", fontWeight: 400, fontStyle: "italic" },
    ],
  });
}

export const PDF_FONT_FAMILIES: Record<FontId, string> = {
  lato: "Lato",
  spectral: "Spectral",
  crimson: "Crimson",
};

// Keep words intact. URLs and email addresses should wrap to the next line rather
// than being split with a hyphen in the middle of a domain.
if (typeof window !== "undefined") {
  Font.registerHyphenationCallback((word) => [word]);
}
