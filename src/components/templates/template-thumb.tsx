import type { CSSProperties } from "react";

import { cn, initials } from "@/lib/utils";
import type { TemplateId } from "@/lib/cv/types";

interface TemplateThumbProps {
  template: TemplateId;
  accent?: string;
  name?: string;
  role?: string;
  className?: string;
  decorative?: boolean;
}

function Lines({
  widths,
  color,
  className,
  height = 2,
}: {
  widths: number[];
  color: string;
  className?: string;
  height?: number;
}) {
  return (
    <div className={cn("flex flex-col gap-[3px]", className)}>
      {widths.map((width, index) => (
        <span
          key={index}
          style={{ width: `${width}%`, background: color, height }}
          className="block rounded-full opacity-70"
        />
      ))}
    </div>
  );
}

function Heading({ color, width = 26 }: { color: string; width?: number }) {
  return (
    <span
      className="block rounded-full"
      style={{ width: `${width}%`, height: 3, background: color }}
    />
  );
}

export function TemplateThumb({
  template,
  accent = "#1c3738",
  name = "Your Name",
  role = "Professional Title",
  className,
  decorative = false,
}: TemplateThumbProps) {
  const paper: CSSProperties = {
    background: "#ffffff",
    borderColor: "rgba(0,15,8,0.10)",
  };

  const serif = template === "classic" || template === "executive";
  const fontFamily = serif
    ? 'Georgia, "Times New Roman", serif'
    : 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif';

  const bodyWidths = [92, 86, 72, 90, 62];

  return (
    <div
      aria-hidden={decorative || undefined}
      className={cn(
        "relative aspect-[1/1.414] w-full overflow-hidden rounded-[3px] border shadow-[0_1px_2px_rgba(0,15,8,0.08)]",
        className,
      )}
      style={{ ...paper, fontFamily }}
    >
      {template === "classic" ? (
        <div className="flex h-full flex-col p-[8%]">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-center text-[7px] font-semibold tracking-[0.16em] uppercase" style={{ color: accent }}>
              {name}
            </span>
            <span className="text-[4px] tracking-[0.1em] text-neutral-500 uppercase">{role}</span>
            <span className="mt-1 block h-px w-1/3" style={{ background: accent }} />
          </div>
          <div className="mt-[7%] flex flex-col gap-[6%]">
            {[1, 2].map((section) => (
              <div key={section} className="flex flex-col gap-1.5">
                <Heading color={accent} width={22} />
                <Lines widths={bodyWidths} color="#4d4847" height={1.5} />
                <Lines widths={[88, 70]} color="#4d4847" height={1.5} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {template === "modern" ? (
        <div className="flex h-full flex-col p-[8%]">
          <div className="flex flex-col gap-1">
            <span className="text-[8.5px] font-bold tracking-[-0.04em]" style={{ color: "#000f08" }}>
              {name}
            </span>
            <span className="text-[4px] font-medium tracking-[0.08em] uppercase" style={{ color: accent }}>
              {role}
            </span>
            <span className="mt-1 block h-[2px] w-8" style={{ background: accent }} />
          </div>
          <div className="mt-[9%] flex flex-col gap-[6%]">
            {[1, 2, 3].map((section) => (
              <div key={section} className="flex gap-2">
                <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full" style={{ background: accent }} />
                <div className="flex w-full flex-col gap-1.5">
                  <Heading color="#000f08" width={30} />
                  <Lines widths={bodyWidths.slice(1)} color="#4d4847" height={1.5} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {template === "executive" ? (
        <div className="flex h-full flex-col">
          <div className="flex flex-col gap-1 px-[8%] pt-[10%] pb-[8%]" style={{ background: accent }}>
            <span className="text-[7.5px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#f4fff8" }}>
              {name}
            </span>
            <span className="text-[3.5px] tracking-[0.14em] uppercase" style={{ color: "rgba(244,255,248,0.72)" }}>
              {role}
            </span>
          </div>
          <div className="flex flex-col gap-[6%] p-[8%]">
            {[1, 2, 3].map((section) => (
              <div key={section} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Heading color={accent} width={18} />
                  <span className="h-px flex-1" style={{ background: "rgba(0,15,8,0.14)" }} />
                </div>
                <Lines widths={bodyWidths} color="#4d4847" height={1.5} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {template === "corporate" ? (
        <div className="flex h-full flex-col p-[7%]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[7.5px] font-bold tracking-[-0.03em]" style={{ color: "#000f08" }}>
                {name}
              </span>
              <span className="text-[3.6px] font-semibold tracking-[0.08em] uppercase" style={{ color: accent }}>
                {role}
              </span>
            </div>
            <div className="flex flex-col items-end gap-[3px]">
              <span className="block h-1 w-8 rounded-full" style={{ background: "rgba(0,15,8,0.18)" }} />
              <span className="block h-1 w-6 rounded-full" style={{ background: "rgba(0,15,8,0.18)" }} />
              <span className="block h-1 w-7 rounded-full" style={{ background: "rgba(0,15,8,0.18)" }} />
            </div>
          </div>
          <span className="mt-2 block h-[2px] w-full" style={{ background: accent }} />
          <div className="mt-[6%] flex flex-col gap-[5%]">
            {[1, 2].map((section) => (
              <div key={section} className="flex gap-2">
                <span className="block w-[2px] shrink-0 rounded-full" style={{ background: accent }} />
                <div className="flex w-full flex-col gap-1.5">
                  <Heading color="#000f08" width={26} />
                  <Lines widths={bodyWidths} color="#4d4847" height={1.5} />
                  <Lines widths={[82, 64]} color="#4d4847" height={1.5} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {template === "creative" ? (
        <div className="flex h-full">
          <div className="flex w-[8%] flex-col items-center gap-2 py-[8%]" style={{ background: accent }}>
            <span className="block size-3 rounded-full border" style={{ borderColor: "rgba(244,255,248,0.7)" }} />
            <span className="block h-6 w-px" style={{ background: "rgba(244,255,248,0.35)" }} />
          </div>
          <div className="flex flex-1 flex-col p-[7%]">
            <div className="flex items-center gap-2">
              <span
                className="flex size-7 items-center justify-center rounded-full text-[5px] font-bold"
                style={{ background: `${accent}18`, color: accent }}
              >
                {initials(name)}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-bold tracking-[-0.03em]" style={{ color: "#000f08" }}>
                  {name}
                </span>
                <span className="text-[3.4px] tracking-[0.06em] uppercase" style={{ color: accent }}>
                  {role}
                </span>
              </div>
            </div>
            <div className="mt-[8%] flex flex-col gap-[5%]">
              {[1, 2, 3].map((section) => (
                <div key={section} className="flex flex-col gap-1.5">
                  <span
                    className="w-fit rounded-full px-1.5 py-[2px] text-[3px] font-bold tracking-[0.1em] uppercase"
                    style={{ background: `${accent}14`, color: accent }}
                  >
                    Section
                  </span>
                  <Lines widths={bodyWidths} color="#4d4847" height={1.5} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {template === "compact" ? (
        <div className="flex h-full flex-col p-[7%]">
          <div className="flex items-end justify-between border-b pb-1.5" style={{ borderColor: "rgba(0,15,8,0.16)" }}>
            <span className="text-[7px] font-bold tracking-[-0.02em]" style={{ color: "#000f08" }}>
              {name}
            </span>
            <span className="text-[3.2px] tracking-[0.06em] uppercase" style={{ color: accent }}>
              {role}
            </span>
          </div>
          <div className="mt-[5%] grid flex-1 grid-cols-[1.4fr_1fr] gap-2">
            <div className="flex flex-col gap-[6%]">
              {[1, 2, 3].map((section) => (
                <div key={section} className="flex flex-col gap-1">
                  <Heading color={accent} width={30} />
                  <Lines widths={[96, 90, 84, 92, 70]} color="#4d4847" height={1} />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-[8%] border-l pl-2" style={{ borderColor: "rgba(0,15,8,0.1)" }}>
              {[1, 2].map((section) => (
                <div key={section} className="flex flex-col gap-1">
                  <Heading color="#000f08" width={50} />
                  <Lines widths={[92, 78, 88, 60]} color="#4d4847" height={1} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {template === "ats" ? (
        <div className="flex h-full flex-col p-[9%]">
          <div className="flex flex-col gap-[3px]">
            <span className="text-[8px] font-bold" style={{ color: "#000000" }}>
              {name}
            </span>
            <span className="text-[3.8px] text-black/70">{role}</span>
            <span className="text-[3.2px] text-black/50">email@example.com · City · Phone</span>
          </div>
          <div className="mt-[7%] flex flex-col gap-[6%]">
            {[1, 2, 3, 4].map((section) => (
              <div key={section} className="flex flex-col gap-1">
                <span className="text-[4px] font-bold tracking-[0.08em] uppercase" style={{ color: "#000000" }}>
                  Section
                </span>
                <Lines widths={bodyWidths} color="#000000" height={1} />
                <Lines widths={[84, 60]} color="#000000" height={1} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
