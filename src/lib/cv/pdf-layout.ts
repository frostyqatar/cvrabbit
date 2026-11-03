export interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}

function assembleRows(items: PdfTextItem[], pageWidth: number) {
  interface Row {
    y: number;
    items: PdfTextItem[];
  }

  const rows: Row[] = [];
  for (const item of items) {
    if (!item.str) continue;
    const y = item.transform[5];
    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 2.2);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }

  rows.sort((a, b) => b.y - a.y);

  let complex = false;
  const lines: string[] = [];

  for (const row of rows) {
    row.items.sort((a, b) => a.transform[4] - b.transform[4]);

    for (let index = 1; index < row.items.length; index += 1) {
      const previous = row.items[index - 1];
      const current = row.items[index];
      const gap = current.transform[4] - (previous.transform[4] + previous.width);
      if (gap > pageWidth * 0.12) {
        complex = true;
        break;
      }
    }

    let line = "";
    for (let index = 0; index < row.items.length; index += 1) {
      const item = row.items[index];
      const previous = row.items[index - 1];

      if (previous) {
        const gap = item.transform[4] - (previous.transform[4] + previous.width);
        const bothSingleCharacters =
          previous.str.trim().length === 1 && item.str.trim().length === 1;
        const wordGap = bothSingleCharacters
          ? Math.max(previous.height, item.height) * 0.34
          : 1.2;

        if (gap > wordGap && !line.endsWith(" ") && item.str.trim()) {
          line += " ";
        }
      }

      line += item.str;
      if (item.hasEOL) line += "\n";
    }

    const cleaned = line.replace(/\s+/g, " ").trimEnd();
    if (cleaned) lines.push(cleaned);
  }

  return { text: lines.join("\n"), complex };
}

function splitColumns(items: PdfTextItem[], pageWidth: number): PdfTextItem[][] {
  const textItems = items.filter((item) => item.str.trim().length > 0);
  if (textItems.length < 24) return [items];

  const spans = textItems
    .map((item) => {
      const start = item.transform[4];
      const end = start + Math.max(item.width, 1);
      return [start, Math.min(end, pageWidth)] as [number, number];
    })
    .sort((a, b) => a[0] - b[0]);

  const merged: Array<[number, number]> = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (!last || span[0] > last[1] + 1.5) {
      merged.push([span[0], span[1]]);
    } else {
      last[1] = Math.max(last[1], span[1]);
    }
  }

  const gutters: number[] = [];
  for (let index = 0; index < merged.length - 1; index += 1) {
    const start = merged[index][1];
    const end = merged[index + 1][0];
    const width = end - start;
    if (
      width > Math.max(20, pageWidth * 0.035) &&
      start > pageWidth * 0.12 &&
      end < pageWidth * 0.92
    ) {
      gutters.push((start + end) / 2);
    }
  }

  if (gutters.length === 0 || gutters.length > 2) return [items];
  gutters.sort((a, b) => a - b);

  const groups: PdfTextItem[][] = Array.from({ length: gutters.length + 1 }, () => []);
  for (const item of items) {
    const center = item.transform[4] + Math.max(item.width, 1) / 2;
    let bucket = gutters.length;
    for (let index = 0; index < gutters.length; index += 1) {
      if (center < gutters[index]) {
        bucket = index;
        break;
      }
    }
    groups[bucket].push(item);
  }

  if (groups.some((group) => group.length < 6)) return [items];
  return groups;
}

export function assemblePageText(items: PdfTextItem[], pageWidth: number) {
  const columns = splitColumns(items, pageWidth);

  if (columns.length > 1) {
    // Put the column with the most text first (usually the main CV body),
    // then any sidebars, so names and roles are discovered before contact lists.
    const ranked = columns
      .map((group) => ({
        group,
        characters: group.reduce((total, item) => total + item.str.trim().length, 0),
      }))
      .sort((a, b) => b.characters - a.characters);

    const text = ranked
      .map(({ group }) => assembleRows(group, pageWidth).text)
      .filter(Boolean)
      .join("\n\n");

    return { text, complex: true };
  }

  return assembleRows(items, pageWidth);
}
