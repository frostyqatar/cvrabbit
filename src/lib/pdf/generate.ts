"use client";

import { createElement, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import type { CvData, CvSettings } from "@/lib/cv/types";

export async function generateCvBlob(data: CvData, settings: CvSettings): Promise<Blob> {
  const [{ pdf }, { CvDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/templates/cv-document"),
  ]);

  return pdf(
    createElement(CvDocument, { data, settings }) as unknown as ReactElement<DocumentProps>,
  ).toBlob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
}
