"use client";

import { useRef } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEditor } from "@/lib/editor/store";
import type { BulletKind } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

export function BulletEditor({
  experienceId,
  kind,
  label,
  hint,
  placeholder,
}: {
  experienceId: string;
  kind: BulletKind;
  label: string;
  hint?: string;
  placeholder: string;
}) {
  const bullets = useEditor((state) => {
    const entry = state.data.experience.find((item) => item.id === experienceId);
    return entry ? entry[kind] : [];
  });
  const addBullet = useEditor((state) => state.addBullet);
  const updateBullet = useEditor((state) => state.updateBullet);
  const removeBullet = useEditor((state) => state.removeBullet);
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const handleAdd = () => {
    const id = addBullet(experienceId, kind);
    requestAnimationFrame(() => {
      refs.current[id]?.focus();
    });
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[0.78rem] font-semibold text-charcoal">{label}</p>
        {hint ? <p className="text-[0.64rem] text-muted-foreground/70">{hint}</p> : null}
      </div>

      <div className="mt-2 space-y-2">
        {bullets.length === 0 ? (
          <p className="rounded-lg border border-dashed border-onyx/10 bg-mint/30 px-3 py-3 text-[0.72rem] text-charcoal/60">
            Nothing here yet. Add a bullet or leave this part out.
          </p>
        ) : null}

        {bullets.map((bullet, index) => (
          <div key={bullet.id} className="group flex items-start gap-2">
            <span className="mt-3 flex size-4 shrink-0 items-center justify-center">
              <span className="size-1 rounded-full bg-steel" />
            </span>
            <Textarea
              ref={(element) => {
                refs.current[bullet.id] = element;
              }}
              value={bullet.text}
              onChange={(event) =>
                updateBullet(experienceId, kind, bullet.id, event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleAdd();
                }
              }}
              rows={2}
              placeholder={placeholder}
              aria-label={`${label} bullet ${index + 1}`}
              className={cn(
                "min-h-[2.75rem] flex-1 resize-none border-transparent bg-mint/35 px-3 py-2.5 text-[0.86rem] leading-relaxed",
                "hover:border-onyx/10 focus-visible:border-steel focus-visible:bg-card",
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeBullet(experienceId, kind, bullet.id)}
              aria-label="Remove bullet"
              className="mt-0.5 shrink-0 text-charcoal/45 hover:text-destructive"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAdd}
        className="mt-2 text-charcoal/75"
      >
        <Plus className="size-3.5" />
        Add bullet
      </Button>
    </div>
  );
}
